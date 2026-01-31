import { NextResponse } from 'next/server'
import { sendPasswordResetCode } from '@/lib/email'

export const runtime = 'nodejs'

// Allow CORS for debugging (only in development/test endpoints)
export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

/**
 * Test endpoint for email sending (development only).
 * Disabled in production for security.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }
  try {
    const body = await req.json().catch(() => null) as null | {
      email?: unknown
    }

    if (!body || typeof body.email !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Email is required',
      }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()

    // Check environment variables
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      APP_URL: !!process.env.APP_URL,
    }

    console.log('Environment variables check:', envCheck)
    console.log('SMTP_HOST:', process.env.SMTP_HOST)
    console.log('SMTP_PORT:', process.env.SMTP_PORT)
    console.log('SMTP_USER:', process.env.SMTP_USER)
    console.log('SMTP_PASS exists:', !!process.env.SMTP_PASS)
    console.log('SMTP_PASS length:', process.env.SMTP_PASS?.length || 0)
    console.log('APP_URL:', process.env.APP_URL)

    // Generate test code
    const testCode = '123456'

    // Try to send email
    const emailSent = await sendPasswordResetCode(email, testCode)

    return NextResponse.json({
      ok: true,
      data: {
        emailSent,
        envCheck,
        message: emailSent
          ? 'Test email sent successfully! Check your inbox.'
          : 'Failed to send test email. Check Vercel Runtime Logs for details.',
      },
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    const response = NextResponse.json({
      ok: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })

    // Add CORS headers for debugging
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  }
}
