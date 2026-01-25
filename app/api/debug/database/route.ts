import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check DATABASE_URL configuration
 * This helps diagnose authentication and connection issues
 */
export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL

    if (!dbUrl) {
      return NextResponse.json({
        ok: false,
        error: 'DATABASE_URL is not set',
        details: {
          hasUrl: false,
        },
      }, { status: 503 })
    }

    // Parse URL (without exposing password)
    let parsedInfo: Record<string, unknown> = {}
    try {
      const urlObj = new URL(dbUrl)
      parsedInfo = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port || '5432',
        database: urlObj.pathname.slice(1) || 'postgres',
        username: urlObj.username || 'postgres',
        hasPassword: !!urlObj.password,
        passwordLength: urlObj.password ? urlObj.password.length : 0,
        // Check for special characters in password (without exposing password)
        passwordHasSpecialChars: urlObj.password ? /[@#%&+=\s]/.test(urlObj.password) : false,
        usesDirectConnection: (urlObj.port || '5432') === '5432' && !dbUrl.includes('pgbouncer=true'),
        usesSessionPooler: urlObj.port === '6543' || dbUrl.includes('pgbouncer=true'),
      }
    } catch (parseError: any) {
      parsedInfo = {
        parseError: parseError.message,
        urlLength: dbUrl.length,
      }
    }

    // Try to get Prisma client
    const prisma = getPrisma()
    const hasPrisma = !!prisma

    // Try a simple query to test connection
    let connectionTest: Record<string, unknown> = { tested: false }
    if (prisma) {
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        connectionTest = {
          tested: true,
          success: true,
          message: 'Connection successful',
        }
      } catch (testError: any) {
        connectionTest = {
          tested: true,
          success: false,
          error: testError.message,
          errorCode: testError.code,
          isAuthenticationError: testError.message?.includes('Authentication failed') || 
                                testError.message?.includes('provided database credentials') ||
                                testError.code === 'P1000',
          isConnectionLimitError: testError.message?.includes('MaxClientsInSessionMode') ||
                                  testError.message?.includes('max clients reached'),
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        hasUrl: true,
        urlLength: dbUrl.length,
        parsedInfo,
        hasPrisma,
        connectionTest,
        recommendations: [
          parsedInfo.usesSessionPooler ? '❌ Using Session Pooler (port 6543). Use Direct Connection (port 5432) for Vercel.' : null,
          parsedInfo.passwordHasSpecialChars ? '⚠️ Password contains special characters. Ensure they are URL-encoded (@ → %40, # → %23, etc.)' : null,
          !parsedInfo.hasPassword ? '❌ No password in DATABASE_URL' : null,
          connectionTest.isAuthenticationError ? '❌ Authentication failed. Check password and URL encoding.' : null,
          connectionTest.isConnectionLimitError ? '❌ Connection limit reached. Use Direct Connection (port 5432).' : null,
        ].filter(Boolean),
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      details: {
        hasUrl: !!process.env.DATABASE_URL,
        urlLength: process.env.DATABASE_URL?.length || 0,
      },
    }, { status: 500 })
  }
}
