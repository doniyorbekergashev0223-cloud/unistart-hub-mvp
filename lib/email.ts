import nodemailer from 'nodemailer'

/**
 * Email utility for sending password reset codes.
 * Uses SMTP configuration from environment variables.
 * Fails safely if SMTP is not configured (returns false, doesn't crash).
 */

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    console.warn('SMTP configuration incomplete. Email sending disabled.')
    return null
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: port === '465', // 465 = SSL, 587 = TLS
    auth: {
      user,
      pass,
    },
  }
}

/**
 * Creates a nodemailer transporter.
 * Returns null if SMTP is not configured (fails safely).
 */
function createTransporter() {
  const config = getEmailConfig()
  if (!config) return null

  try {
    return nodemailer.createTransport(config)
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    return null
  }
}

/**
 * Sends a password reset code via email.
 * @param email - Recipient email address
 * @param code - 6-digit reset code
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendPasswordResetCode(
  email: string,
  code: string
): Promise<boolean> {
  const transporter = createTransporter()
  if (!transporter) {
    console.warn(`Password reset code for ${email}: ${code} (email not sent - SMTP not configured)`)
    return false
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/auth/reset-password?token=${code}&email=${encodeURIComponent(email)}`

  const mailOptions = {
    from: `"UniStart Hub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'UniStart Hub - Parolni tiklash kodi',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>UniStart Hub</h1>
              <p>Parolni tiklash</p>
            </div>
            <div class="content">
              <p>Salom,</p>
              <p>Parolni tiklash so'rovi qabul qilindi. Quyidagi kodni kiriting:</p>
              <div class="code">${code}</div>
              <p>Yoki quyidagi havolani bosing:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Parolni tiklash</a>
              </p>
              <p><strong>Eslatma:</strong> Bu kod 15 daqiqa davomida amal qiladi.</p>
              <p>Agar siz bu so'rovni qilmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>
            </div>
            <div class="footer">
              <p>UniStart Hub - Innovatsion startap platformasi</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
UniStart Hub - Parolni tiklash

Parolni tiklash so'rovi qabul qilindi.

Tasdiqlash kodi: ${code}

Havola: ${resetUrl}

Eslatma: Bu kod 15 daqiqa davomida amal qiladi.

Agar siz bu so'rovni qilmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.
    `.trim(),
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset code sent to ${email}`)
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}
