import 'server-only'

import { prisma } from '@/lib/prisma'
import { getKurdeventsComSupabase } from '@/lib/kurdeventsComSupabase'

const DEFAULT_SECTION_NAME = 'Genel'
const DEFAULT_PLAN_NAME = 'Ana Plan'
const DEFAULT_EVENT_CATEGORY = 'diger'
const DEFAULT_EVENT_TIME = '20:00'

export type KurdeventsComSyncResult = {
  salesVenueId: string
  salesPlanId: string
  salesEventId: string
  syncedAt: Date
}

type ComRow = {
  id: string
  row_label: string
  section_id: string
}

type ComSection = {
  id: string
  name: string
  sort_order: number
  ticket_type_label?: string | null
}

type ComSeat = {
  id: string
  row_id: string
  seat_label: string
}


function required(value: string | null | undefined, label: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${label} eksik`)
  return normalized
}

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function normalizeTicketType(value: string | null | undefined): 'normal' | 'vip' {
  return value?.trim().toLowerCase() === 'vip' ? 'vip' : 'normal'
}

function isBlockedSeat(status: string | null | undefined): boolean {
  return ['blocked', 'unavailable'].includes((status ?? '').trim().toLowerCase())
}


async function findOrCreateVenue(
  supabase: ReturnType<typeof getKurdeventsComSupabase>,
  hall: { name: string; address: string | null; capacity: number },
  existingVenueId: string | null,
) {
  const venuePayload = {
    name: hall.name,
    address: hall.address,
    city: null,
    capacity: hall.capacity,
    seating_layout_description: null,
    seating_layout_image_url: null,
    entrance_info: null,
    transport_info: null,
    map_embed_url: null,
    rules: null,
    faq: [],
  }

  if (existingVenueId) {
    const { data, error } = await supabase
      .from('venues')
      .update(venuePayload)
      .eq('id', existingVenueId)
      .select('id')
      .maybeSingle()

    if (error) throw new Error(`Venue güncellenemedi: ${error.message}`)
    if (data?.id) return data.id as string
  }

  const { data: byName, error: lookupError } = await supabase
    .from('venues')
    .select('id')
    .eq('name', hall.name)
    .limit(1)
    .maybeSingle()

  if (lookupError) throw new Error(`Venue aranamadı: ${lookupError.message}`)
  if (byName?.id) return byName.id as string

  const { data, error } = await supabase
    .from('venues')
    .insert(venuePayload)
    .select('id')
    .single()

  if (error) throw new Error(`Venue oluşturulamadı: ${error.message}`)
  return required(data?.id as string | undefined, 'Venue id')
}

async function findOrCreatePlan(
  supabase: ReturnType<typeof getKurdeventsComSupabase>,
  venueId: string,
  existingPlanId: string | null,
  hallName: string,
) {
  const payload = {
    venue_id: venueId,
    name: `${hallName} - ${DEFAULT_PLAN_NAME}`,
    is_default: true,
  }

  if (existingPlanId) {
    const { data, error } = await supabase
      .from('seating_plans')
      .update({ venue_id: venueId, name: payload.name, is_default: true })
      .eq('id', existingPlanId)
      .select('id')
      .maybeSingle()

    if (error) throw new Error(`Seating plan güncellenemedi: ${error.message}`)
    if (data?.id) return data.id as string
  }

  const { data: existing, error: lookupError } = await supabase
    .from('seating_plans')
    .select('id')
    .eq('venue_id', venueId)
    .eq('name', payload.name)
    .limit(1)
    .maybeSingle()

  if (lookupError) throw new Error(`Seating plan aranamadı: ${lookupError.message}`)
  if (existing?.id) return existing.id as string

  const { data, error } = await supabase
    .from('seating_plans')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(`Seating plan oluşturulamadı: ${error.message}`)
  return required(data?.id as string | undefined, 'Seating plan id')
}

function buildSectionKey(seat: { sectionId: string | null; blockId: string | null; zone: string | null }): string {
  return seat.sectionId || seat.blockId || seat.zone || '__default__'
}

async function syncPlanTree(
  supabase: ReturnType<typeof getKurdeventsComSupabase>,
  planId: string,
  seats: Array<{
    id: string
    row: string
    number: string
    x: number
    y: number
    status: string
    sectionId: string | null
    blockId: string | null
    zone: string | null
  }>,
  categories: Array<{ name: string }>,
) {
  const { data: currentSections, error: sectionsError } = await supabase
    .from('seating_plan_sections')
    .select('id, name, sort_order, ticket_type_label')
    .eq('seating_plan_id', planId)
    .order('sort_order')

  if (sectionsError) throw new Error(`Sections okunamadı: ${sectionsError.message}`)

  const sectionMap = new Map<string, ComSection>()
  for (const section of (currentSections ?? []) as ComSection[]) {
    sectionMap.set(section.name, section)
  }

  const grouped = new Map<string, typeof seats>()
  for (const seat of seats) {
    const key = buildSectionKey(seat)
    const group = grouped.get(key) ?? []
    group.push(seat)
    grouped.set(key, group)
  }

  const categoryNames = new Set(categories.map((category) => category.name.trim()).filter(Boolean))
  const sectionEntries = Array.from(grouped.entries())
  if (sectionEntries.length === 0) sectionEntries.push(['__default__', []])

  const syncedSectionIds: string[] = []
  for (let index = 0; index < sectionEntries.length; index += 1) {
    const [key, sectionSeats] = sectionEntries[index]
    const sectionName = key === '__default__' ? DEFAULT_SECTION_NAME : key
    const existing = sectionMap.get(sectionName)
    const ticketTypeLabel = categoryNames.has(sectionName) ? sectionName : null
    const payload = {
      seating_plan_id: planId,
      name: sectionName,
      sort_order: index,
      ticket_type_label: ticketTypeLabel,
      section_align: 'center',
    }

    let sectionId = existing?.id
    if (sectionId) {
      const { error } = await supabase
        .from('seating_plan_sections')
        .update(payload)
        .eq('id', sectionId)
      if (error) throw new Error(`Section güncellenemedi: ${error.message}`)
    } else {
      const { data, error } = await supabase
        .from('seating_plan_sections')
        .insert(payload)
        .select('id, name, sort_order, ticket_type_label')
        .single()
      if (error) throw new Error(`Section oluşturulamadı: ${error.message}`)
      sectionId = required(data?.id as string | undefined, 'Section id')
    }

    syncedSectionIds.push(sectionId)

    const { data: currentRows, error: rowsError } = await supabase
      .from('seating_plan_rows')
      .select('id, row_label, section_id')
      .eq('section_id', sectionId)
      .order('sort_order')

    if (rowsError) throw new Error(`Rows okunamadı: ${rowsError.message}`)
    const rowMap = new Map<string, ComRow>()
    for (const row of (currentRows ?? []) as ComRow[]) rowMap.set(row.row_label, row)

    const rows = new Map<string, typeof sectionSeats>()
    for (const seat of sectionSeats) {
      const group = rows.get(seat.row) ?? []
      group.push(seat)
      rows.set(seat.row, group)
    }

    let rowIndex = 0
    const rowEntries = Array.from(rows.entries())
    for (let rowEntryIndex = 0; rowEntryIndex < rowEntries.length; rowEntryIndex += 1) {
      const [rowLabel, rowSeats] = rowEntries[rowEntryIndex]
      const rowTicketLabel = rowSeats[0] && categoryNames.has(rowSeats[0].row) ? rowSeats[0].row : ticketTypeLabel
      const rowPayload = {
        section_id: sectionId,
        row_label: rowLabel,
        sort_order: rowIndex,
        ticket_type_label: rowTicketLabel || null,
      }
      const existingRow = rowMap.get(rowLabel)
      let rowId = existingRow?.id

      if (rowId) {
        const { error } = await supabase.from('seating_plan_rows').update(rowPayload).eq('id', rowId)
        if (error) throw new Error(`Row güncellenemedi: ${error.message}`)
      } else {
        const { data, error } = await supabase.from('seating_plan_rows').insert(rowPayload).select('id').single()
        if (error) throw new Error(`Row oluşturulamadı: ${error.message}`)
        rowId = required(data?.id as string | undefined, 'Row id')
      }

        const { data: currentSeats, error: seatsError } = await supabase
          .from('seats')
          .select('id, row_id, seat_label')
          .eq('row_id', rowId)

        if (seatsError) throw new Error(`Seats okunamadı: ${seatsError.message}`)
        const seatMap = new Map<string, ComSeat>()
        for (const seat of (currentSeats ?? []) as ComSeat[]) seatMap.set(seat.seat_label, seat)
        const sourceSeatLabels = rowSeats.map((seat) => seat.number)

        for (let seatIndex = 0; seatIndex < rowSeats.length; seatIndex += 1) {
          const sourceSeat = rowSeats[seatIndex]
          const seatPayload = {
            row_id: rowId,
            seat_label: sourceSeat.number,
            x: sourceSeat.x,
            y: sourceSeat.y,
            sales_blocked: isBlockedSeat(sourceSeat.status),
          }
          const existingSeat = seatMap.get(sourceSeat.number)
          if (existingSeat?.id) {
            const { error } = await supabase.from('seats').update(seatPayload).eq('id', existingSeat.id)
            if (error) throw new Error(`Seat güncellenemedi: ${error.message}`)
          } else {
            const { error } = await supabase.from('seats').insert(seatPayload)
            if (error) throw new Error(`Seat oluşturulamadı: ${error.message}`)
          }
        }

        const staleSeatIds = (currentSeats ?? [])
          .filter((seat) => !sourceSeatLabels.includes((seat as ComSeat).seat_label))
          .map((seat) => (seat as ComSeat).id)
        if (staleSeatIds.length > 0) {
          const { error } = await supabase.from('seats').delete().in('id', staleSeatIds)
          if (error) throw new Error(`Eski seat kayıtları silinemedi: ${error.message}`)
        }
        rowIndex += 1
    }
  }

  const staleSectionIds = (currentSections ?? [])
    .filter((section) => !syncedSectionIds.includes((section as ComSection).id))
    .map((section) => (section as ComSection).id)
  for (const staleSectionId of staleSectionIds) {
    const { data: staleRows, error: staleRowsError } = await supabase
      .from('seating_plan_rows')
      .select('id')
      .eq('section_id', staleSectionId)
    if (staleRowsError) throw new Error(`Eski row kayıtları okunamadı: ${staleRowsError.message}`)

    const staleRowIds = (staleRows ?? []).map((row) => String((row as { id: string }).id))
    if (staleRowIds.length > 0) {
      const { error: staleSeatsError } = await supabase.from('seats').delete().in('row_id', staleRowIds)
      if (staleSeatsError) throw new Error(`Eski seat kayıtları silinemedi: ${staleSeatsError.message}`)
      const { error: staleRowsDeleteError } = await supabase.from('seating_plan_rows').delete().in('id', staleRowIds)
      if (staleRowsDeleteError) throw new Error(`Eski row kayıtları silinemedi: ${staleRowsDeleteError.message}`)
    }

    const { error } = await supabase.from('seating_plan_sections').delete().eq('id', staleSectionId)
    if (error) throw new Error(`Eski section kayıtları silinemedi: ${error.message}`)
  }

  return syncedSectionIds
}

async function syncEvent(
  supabase: ReturnType<typeof getKurdeventsComSupabase>,
  event: {
    id: string
    title: string
    slug: string
    description: string | null
    titleTr: string | null
    titleDe: string | null
    titleEn: string | null
    titleKu: string | null
    titleCkb: string | null
    descriptionTr: string | null
    descriptionDe: string | null
    descriptionEn: string | null
    descriptionKu: string | null
    descriptionCkb: string | null
    image: string | null
    category: string | null
    startDate: Date
    hallId: string | null
    salesEventId: string | null
  },
  venueId: string,
  planId: string,
  organizerName: string,
) {
  const date = toDateString(event.startDate)
  const time = toTimeString(event.startDate) || DEFAULT_EVENT_TIME
  const payload = {
    title: event.titleTr || event.title,
    title_tr: event.titleTr || event.title,
    title_de: event.titleDe,
    title_en: event.titleEn,
    title_ku: event.titleKu,
    title_ckb: event.titleCkb,
    description: event.descriptionTr || event.description,
    description_tr: event.descriptionTr || event.description,
    description_de: event.descriptionDe,
    description_en: event.descriptionEn,
    description_ku: event.descriptionKu,
    description_ckb: event.descriptionCkb,
    date,
    time,
    location: organizerName,
    venue: organizerName,
    venue_id: venueId,
    image_url: event.image,
    category: event.category || DEFAULT_EVENT_CATEGORY,
    is_active: true,
    is_approved: true,
    is_draft: false,
    slug: event.slug,
    seating_plan_id: planId,
    organizer_display_name: organizerName,
  }

  if (event.salesEventId) {
    const { data, error } = await supabase.from('events').update(payload).eq('id', event.salesEventId).select('id').maybeSingle()
    if (error) throw new Error(`Sales event güncellenemedi: ${error.message}`)
    if (data?.id) return data.id as string
  }

  const { data: existing, error: lookupError } = await supabase
    .from('events')
    .select('id')
    .eq('slug', event.slug)
    .limit(1)
    .maybeSingle()
  if (lookupError) throw new Error(`Sales event aranamadı: ${lookupError.message}`)
  if (existing?.id) {
    const { error } = await supabase.from('events').update(payload).eq('id', existing.id)
    if (error) throw new Error(`Sales event güncellenemedi: ${error.message}`)
    return existing.id as string
  }

  const { data, error } = await supabase.from('events').insert(payload).select('id').single()
  if (error) throw new Error(`Sales event oluşturulamadı: ${error.message}`)
  return required(data?.id as string | undefined, 'Sales event id')
}

export async function syncEventToKurdeventsCom(eventId: string): Promise<KurdeventsComSyncResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: true,
      hall: { include: { seats: true, seatCategories: true } },
      ticketCategories: true,
    },
  })

  if (!event) throw new Error('Etkinlik bulunamadı')
  if (!event.hall) throw new Error('Etkinliğe bağlı salon bulunamadı')
  if (event.hall.seats.length === 0) throw new Error('Salonun aktarılacak koltuğu yok')

  const supabase = getKurdeventsComSupabase()
  const venueId = await findOrCreateVenue(supabase, event.hall, event.salesVenueId)
  const organizerName = event.organizer.organizationDisplayName || event.organizer.companyName
  const planId = await findOrCreatePlan(supabase, venueId, event.salesPlanId, event.hall.name)

  await syncPlanTree(
    supabase,
    planId,
    event.hall.seats,
    event.ticketCategories.map((category) => ({ name: category.name })),
  )

  const salesEventId = await syncEvent(supabase, event, venueId, planId, organizerName)

  for (let index = 0; index < event.ticketCategories.length; index += 1) {
    const category = event.ticketCategories[index]
    const ticketPayload = {
      event_id: salesEventId,
      name: category.name,
      type: normalizeTicketType(category.seatType),
      price: category.price,
      quantity: category.totalQuantity,
      available: category.availableQuantity,
      sort_order: index,
      description: category.description,
    }
    const { data: existing, error: lookupError } = await supabase
      .from('tickets')
      .select('id')
      .eq('event_id', salesEventId)
      .eq('name', category.name)
      .limit(1)
      .maybeSingle()
    if (lookupError) throw new Error(`Ticket aranamadı: ${lookupError.message}`)

    if (existing?.id) {
      const { error } = await supabase.from('tickets').update(ticketPayload).eq('id', existing.id)
      if (error) throw new Error(`Ticket güncellenemedi: ${error.message}`)
    } else {
      const { error } = await supabase.from('tickets').insert(ticketPayload)
      if (error) throw new Error(`Ticket oluşturulamadı: ${error.message}`)
    }
  }

  const syncedAt = new Date()
  await prisma.event.update({
    where: { id: event.id },
    data: {
      salesVenueId: venueId,
      salesPlanId: planId,
      salesEventId,
      salesSyncedAt: syncedAt,
      salesSyncStatus: 'SYNCED',
      salesSyncError: null,
    },
  })

  return { salesVenueId: venueId, salesPlanId: planId, salesEventId, syncedAt }
}

export async function markEventSyncFailed(eventId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : 'Bilinmeyen sync hatası'
  await prisma.event.update({
    where: { id: eventId },
    data: {
      salesSyncStatus: 'FAILED',
      salesSyncError: message.slice(0, 4000),
    },
  })
}
