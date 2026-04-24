/**
 * Vercel + Supabase: entegrasyon bazen yalnızca POSTGRES_PRISMA_URL / POSTGRES_URL verir.
 * prisma generate şema için DATABASE_URL ister; yoksa eşleşen değişkeni kopyalarız.
 */
const { spawnSync } = require('child_process')

const env = { ...process.env }
if (!String(env.DATABASE_URL || '').trim()) {
  const alt =
    String(env.POSTGRES_PRISMA_URL || '').trim() ||
    String(env.POSTGRES_URL || '').trim()
  if (alt) {
    env.DATABASE_URL = alt
    console.log('[build] DATABASE_URL boştu; POSTGRES_* ortam değişkeni kullanıldı.')
  }
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: true })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('npx', ['prisma', 'generate'])
run('npx', ['next', 'build'])
