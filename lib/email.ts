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
  // Trim whitespace and newlines from environment variables
  // This fixes issues where Vercel environment variables have trailing newlines
  const host = process.env.SMTP_HOST?.trim()
  const port = process.env.SMTP_PORT?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.trim()

  if (!host || !port || !user || !pass) {
    console.warn('SMTP configuration incomplete. Email sending disabled.', {
      hasHost: !!host,
      hasPort: !!port,
      hasUser: !!user,
      hasPass: !!pass,
    })
    return null
  }

  const portNum = parseInt(port, 10)
  if (isNaN(portNum)) {
    console.error(`Invalid SMTP_PORT: ${port}. Must be a number.`)
    return null
  }

  // Validate port number
  if (portNum !== 465 && portNum !== 587) {
    console.warn(`SMTP_PORT ${portNum} is not standard. Using ${portNum === 465 ? 'SSL' : 'TLS'} mode.`)
  }

  console.log('SMTP configuration loaded:', {
    host,
    port: portNum,
    user,
    secure: portNum === 465,
    passLength: pass.length,
    hostLength: host.length,
  })

  // Log warning if host contains newlines (common Vercel issue)
  if (host.includes('\n') || host.includes('\r')) {
    console.warn('⚠️ WARNING: SMTP_HOST contains newline characters! This will cause DNS errors.')
    console.warn('⚠️ Fix: Remove trailing newlines from SMTP_HOST in Vercel environment variables.')
  }

  return {
    host,
    port: portNum,
    secure: portNum === 465, // 465 = SSL, 587 = TLS
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

  // Get APP_URL from environment, with fallback for development
  // CRITICAL: APP_URL must be set in Vercel for production password reset links
  const appUrl = process.env.APP_URL?.trim() || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  if (!process.env.APP_URL && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: APP_URL not set in production. Password reset links may not work correctly.')
    console.warn('⚠️ Set APP_URL in Vercel environment variables to your production domain (e.g., https://yourdomain.com)')
  }
  
  const resetUrl = `${appUrl}/auth/reset-password?code=${code}&email=${encodeURIComponent(email)}`

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
    // Verify connection before sending (only log in development)
    await transporter.verify()
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SMTP connection verified successfully')
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Password reset code sent to ${email}`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      })
    }
    return true
  } catch (error: any) {
    // Detailed error logging (always log errors, but less verbose in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Failed to send password reset email:', {
        error: error.message,
        code: error.code,
        response: error.response,
        responseCode: error.responseCode,
      })
    } else {
      // Production: log minimal error info
      console.error('❌ Failed to send password reset email:', error.code || error.message)
    }

    // Common error messages and solutions
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed. Check:')
      console.error('  1. SMTP_USER is correct email address')
      console.error('  2. SMTP_PASS is Gmail App Password (not regular password)')
      console.error('  3. 2-Step Verification is enabled on Gmail account')
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('🌐 Connection failed. Check:')
      console.error('  1. SMTP_HOST is correct (smtp.gmail.com)')
      console.error('  2. SMTP_PORT is correct (587 for TLS or 465 for SSL)')
      console.error('  3. Firewall is not blocking the connection')
    }

    return false
  }
}
