import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Görsel dosyası gerekli' }, { status: 400 })
  const extension = allowedTypes[file.type]
  if (!extension) return NextResponse.json({ error: 'Sadece JPG, PNG veya WebP yüklenebilir' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Görsel 5 MB’dan küçük olmalı' }, { status: 400 })

  const directory = path.join(process.cwd(), 'public', 'uploads', 'events')
  await mkdir(directory, { recursive: true })
  const filename = `${session.user.organizerId}-${randomUUID()}${extension}`
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()))

  return NextResponse.json({ url: `/uploads/events/${filename}` })
}
