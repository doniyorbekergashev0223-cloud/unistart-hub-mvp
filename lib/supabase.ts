import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client (public access uchun)
 * Server va client tarafda ishlaydi.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * Supabase client (service role - admin access)
 * Faqat server tarafda (API routes) ishlaydi.
 */
export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * File upload to Supabase Storage
 */
export async function uploadProjectFile(file: File, userId: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from('project-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`File upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('project-files')
    .getPublicUrl(fileName)

  if (!urlData.publicUrl) {
    throw new Error('Failed to get public URL for uploaded file')
  }

  return urlData.publicUrl
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Faqat rasm fayllari qabul qilinadi (jpg, png, webp)')
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    throw new Error('Rasm hajmi 2MB dan katta bo\'lmasligi kerak')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${userId}_${Date.now()}.${fileExt}`

  try {
    // Check if bucket exists, if not provide helpful error
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw new Error(`Storage xatolik: ${listError.message}. Iltimos, Supabase Dashboard → Storage → Buckets ni tekshiring.`)
    }

    const avatarsBucket = buckets?.find(b => b.name === 'avatars')
    if (!avatarsBucket) {
      throw new Error('"avatars" bucket topilmadi. Iltimos, Supabase Dashboard → Storage → "New bucket" → Name: "avatars" → Public: ✅ → Create. SUPABASE_STORAGE_SETUP.md faylini ko\'ring.')
    }

    // Upload to Supabase Storage (avatars bucket)
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting old avatar
      })

    if (error) {
      // Provide more helpful error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
        throw new Error('"avatars" bucket topilmadi. Iltimos, Supabase Dashboard → Storage → "New bucket" → Name: "avatars" → Public: ✅ → Create. SUPABASE_STORAGE_SETUP.md faylini ko\'ring.')
      }
      throw new Error(`Rasm yuklashda xatolik: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName)

    if (!urlData.publicUrl) {
      throw new Error('Rasm URL olishda xatolik')
    }

    return urlData.publicUrl
  } catch (error: any) {
    // Re-throw with helpful message
    if (error.message) {
      throw error
    }
    throw new Error(`Rasm yuklashda xatolik: ${error.message || 'Noma\'lum xatolik'}`)
  }
}
