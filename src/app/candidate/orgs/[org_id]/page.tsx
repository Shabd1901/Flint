import { redirect } from 'next/navigation'

export default async function CandidateOrgDashboard({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  redirect(`/candidate/orgs/${org_id}/exams`)
}
