import { syncEventToKurdeventsCom, markEventSyncFailed } from '../lib/kurdeventsComSync'

const eventId = 'cmtyajxkl000nn5vlsfsv6dg9'

async function main() {
  try {
    const result = await syncEventToKurdeventsCom(eventId)
    console.log(JSON.stringify({ ok: true, result }, null, 2))
  } catch (error) {
    await markEventSyncFailed(eventId, error)
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2))
    process.exitCode = 1
  }
}

main()
