import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// next start, build anında var olan public dosyalarını sunar; panelden yüklenenler
// build sonrası oluştuğu için bu route onları diskten okur.
const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  const root = path.join(process.cwd(), 'public', 'uploads')
  const target = path.resolve(root, params.path.join('/'))
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const data = await readFile(target)
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentTypes[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
