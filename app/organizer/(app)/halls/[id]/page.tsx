import { redirect } from 'next/navigation'

type HallRootPageProps = {
  params: {
    id: string
  }
}

export default function HallRootPage({ params }: HallRootPageProps) {
  redirect(`/organizer/halls/${params.id}/svg-editor`)
}
