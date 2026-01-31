import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function isAnonKeyLikelyValid(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  const trimmed = key.trim()
  if (!trimmed) return false
  return trimmed.split('.').length >= 3
}

if (typeof window !== 'undefined' && (!SUPABASE_URL || !isAnonKeyLikelyValid(SUPABASE_ANON_KEY))) {
  console.warn(
    '[Supabase] NEXT_PUBLIC_SUPABASE_URL yoki NEXT_PUBLIC_SUPABASE_ANON_KEY .env da yo\'q yoki noto\'g\'ri. ' +
      'Storage yuklash ishlamaydi. Supabase Dashboard → Settings → API dan anon key ni nusxalang.'
  )
}

/**
 * Supabase client (public access uchun)
 * Server va client tarafda ishlaydi.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

  // Upload to Supabase Storage (upsert: true so duplicate path on retry overwrites instead of failing)
  const { data, error } = await supabaseAdmin.storage
    .from('project-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
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
