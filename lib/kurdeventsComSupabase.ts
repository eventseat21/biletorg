import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

function readServerEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} tanımlı değil`)
  }
  return value
}

/**
 * kurdevents.com satış veritabanı için yalnızca sunucu tarafında kullanılan client.
 * Service-role anahtarı hiçbir client component'e veya API cevabına aktarılmamalıdır.
 */
export function getKurdeventsComSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      readServerEnv('KURDEVENTS_COM_SUPABASE_URL'),
      readServerEnv('KURDEVENTS_COM_SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return client
}

export function isKurdeventsComConfigured(): boolean {
  return Boolean(
    process.env.KURDEVENTS_COM_SUPABASE_URL?.trim() &&
      process.env.KURDEVENTS_COM_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  )
}
