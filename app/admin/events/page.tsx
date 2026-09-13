import { prisma } from '@/lib/prisma'
import EventApprovalCard from './components/EventApprovalCard'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const [events, publishedEvents] = await Promise.all([
    prisma.event.findMany({
      where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'asc' },
      include: { organizer: { select: { companyName: true, companyEmail: true } }, hall: { select: { name: true, capacity: true } } },
    }),
    prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { organizer: { select: { companyName: true, companyEmail: true } }, hall: { select: { name: true, capacity: true } } },
    }),
  ])
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Etkinlik onayları</h1>
      <p className="mb-8 text-gray-600">Komisyon anlaşmasını belirleyin, yayın kanallarını seçin ve etkinliği yayınlayın.</p>
      <section>
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Onay bekleyen etkinlikler</h2>
        {events.length === 0 ? <p className="text-sm text-gray-500">Onay bekleyen etkinlik yok.</p> : <ul className="space-y-5">{events.map((event) => <EventApprovalCard key={event.id} event={{ ...event, startDate: event.startDate.toISOString(), commissionValue: Number(event.commissionValue) }} />)}</ul>}
      </section>
      <section className="mt-12">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Yayınlanan etkinlikler / yeniden sync</h2>
        {publishedEvents.length === 0 ? <p className="text-sm text-gray-500">Yayınlanan etkinlik yok.</p> : <ul className="space-y-5">{publishedEvents.map((event) => <EventApprovalCard key={event.id} event={{ ...event, startDate: event.startDate.toISOString(), commissionValue: Number(event.commissionValue) }} />)}</ul>}
      </section>
    </div>
  )
}
