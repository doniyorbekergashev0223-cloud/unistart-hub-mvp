import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadAvatar } from '@/lib/supabase';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Get user profile
export async function GET(req: Request) {
  if (!prisma) {
    return jsonError(503, 'DATABASE_NOT_CONFIGURED', "Ma'lumotlar bazasi sozlanmagan.");
  }

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    return NextResponse.json({ ok: true, data: { user } });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    // Check for connection limit errors
    if (error?.message?.includes('MaxClientsInSessionMode') || 
        error?.message?.includes('max clients reached')) {
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    
    // Check for "Tenant or user not found" error
    if (error?.message?.includes('Tenant or user not found') ||
        error?.message?.includes('tenant or user not found')) {
      return jsonError(
        503,
        'DATABASE_TENANT_ERROR',
        "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
      )
    }
    
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}

// Update user profile
export async function PATCH(req: Request) {
  if (!prisma) {
    return jsonError(503, 'DATABASE_NOT_CONFIGURED', "Ma'lumotlar bazasi sozlanmagan.");
  }

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name')?.toString();
    const avatarFile = formData.get('avatar') as File | null;

    // Verify user exists
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, avatarUrl: true },
      });
    } catch (dbError: any) {
      console.error('Database query error in profile update (find user):', dbError);
      console.error('Error type:', dbError?.constructor?.name);
      console.error('Error code:', dbError?.code);
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      // Check for "Tenant or user not found" error
      if (dbError?.message?.includes('Tenant or user not found') ||
          dbError?.message?.includes('tenant or user not found')) {
        return jsonError(
          503,
          'DATABASE_TENANT_ERROR',
          "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
        )
      }
      
      return jsonError(500, 'DATABASE_ERROR', "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi.")
    }

    if (!existingUser) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    const updateData: { name?: string; avatarUrl?: string } = {};

    // Update name if provided
    if (name && name.trim() && name !== existingUser.name) {
      if (name.trim().length < 2) {
        return jsonError(400, 'VALIDATION_ERROR', 'Ism kamida 2 ta belgi bo\'lishi kerak.');
      }
      updateData.name = name.trim();
    }

    // Upload avatar if provided
    if (avatarFile && avatarFile.size > 0) {
      try {
        const avatarUrl = await uploadAvatar(avatarFile, userId);
        updateData.avatarUrl = avatarUrl;
      } catch (uploadError: any) {
        console.error('Avatar upload error:', uploadError);
        return jsonError(400, 'AVATAR_UPLOAD_ERROR', uploadError.message || 'Rasm yuklashda xatolik yuz berdi.');
      }
    }

    // If no updates, return current data
    if (Object.keys(updateData).length === 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        });
        return NextResponse.json({ ok: true, data: { user } });
      } catch (dbError: any) {
        console.error('Database query error in profile update (get current):', dbError);
        if (dbError?.message?.includes('MaxClientsInSessionMode') || 
            dbError?.message?.includes('max clients reached')) {
          return jsonError(
            503,
            'DATABASE_CONNECTION_LIMIT',
            "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
          )
        }
        throw dbError
      }
    }

    // Update user
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    } catch (dbError: any) {
      console.error('Database query error in profile update (update user):', dbError);
      console.error('Error type:', dbError?.constructor?.name);
      console.error('Error code:', dbError?.code);
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      // Check for "Tenant or user not found" error
      if (dbError?.message?.includes('Tenant or user not found') ||
          dbError?.message?.includes('tenant or user not found')) {
        return jsonError(
          503,
          'DATABASE_TENANT_ERROR',
          "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
        )
      }
      
      return jsonError(500, 'DATABASE_ERROR', "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi.")
    }

    return NextResponse.json({ ok: true, data: { user: updatedUser } });
  } catch (error: any) {
    console.error('Profile update error:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    // Check for connection limit errors
    if (error?.message?.includes('MaxClientsInSessionMode') || 
        error?.message?.includes('max clients reached')) {
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
