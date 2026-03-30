import { supabase } from './supabaseClient.js'

const TABLE = import.meta.env.VITE_SUPABASE_TABLE || 'matcha_entries'
const BUCKET = 'matcha-images'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function dbError(err) {
  if (!err) return new Error('Unknown database error')
  const msg = [err.message, err.details, err.hint].filter(Boolean).join(' — ')
  return new Error(msg || String(err))
}

export function isUuid(id) {
  return typeof id === 'string' && UUID_RE.test(id)
}

export function mapRow(row) {
  return {
    id: row.id,
    cafe: row.cafe,
    location: row.location ?? '',
    order: row.matcha_order ?? '',
    notes: row.notes ?? '',
    date: row.visit_date,
    rating: Number(row.rating),
    image: row.image_url ?? null,
  }
}

async function uploadDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s)
  if (!m) throw new Error('Invalid image data')
  const mime = m[1]
  const raw = atob(m[2])
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  const ext = mime.includes('png')
    ? 'png'
    : mime.includes('webp')
      ? 'webp'
      : mime.includes('gif')
        ? 'gif'
        : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: mime,
    upsert: false,
  })
  if (upErr) throw upErr
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function resolveImageUrl(image) {
  if (!image) return null
  if (typeof image !== 'string') return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('data:')) {
    try {
      return await uploadDataUrl(image)
    } catch (e) {
      console.warn('[matcha] Image upload failed; saving entry without photo.', e)
      return null
    }
  }
  return image
}

export async function fetchEntries() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('visit_date', { ascending: false })
  if (error) throw dbError(error)
  return (data ?? []).map(mapRow)
}

export async function upsertEntry(entry) {
  const visit_date = entry.date && String(entry.date).trim() ? entry.date : new Date().toISOString().split('T')[0]
  const image_url = await resolveImageUrl(entry.image)
  const payload = {
    cafe: entry.cafe.trim(),
    location: entry.location?.trim() || null,
    matcha_order: entry.order?.trim() || null,
    notes: entry.notes?.trim() || null,
    visit_date,
    rating: Number(entry.rating),
    image_url,
  }

  if (isUuid(entry.id)) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', entry.id).select('*')
    if (error) throw dbError(error)
    const row = data?.[0]
    if (!row) {
      throw new Error(
        'Update ran but Supabase returned no row. Check RLS policies on matcha_entries allow SELECT for the anon key.'
      )
    }
    return mapRow(row)
  }

  const { data, error } = await supabase.from(TABLE).insert(payload).select('*')
  if (error) throw dbError(error)
  const row = data?.[0]
  if (!row) {
    throw new Error(
      'Insert may have failed or returned no row. Confirm the table is named matcha_entries, RLS policy allows INSERT and SELECT for anon, and re-run supabase/schema.sql.'
    )
  }
  return mapRow(row)
}

export async function deleteEntry(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) throw dbError(error)
}
