import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { formatDateTime } from '@/utils/formatDate'
import { TbdNotice } from '@/components/TbdNotice'

export default async function AdminContests({ params }: { params: Promise<{ org_id: string }> }) {
  const { org_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contests } = await supabase.from('contests').select('*').eq('org_id', org_id).order('created_at', { ascending: false }) 

  async function createContest(formData: FormData) {
    'use server'
    const s = await createClient()
    const { data: { user } } = await s.auth.getUser()

    await s.from('contests').insert({
      org_id: org_id,
      title: formData.get('title'),
      duration_minutes: Number(formData.get('duration_minutes')),
      start_at: formData.get('start_at') || null,
      end_at: formData.get('end_at') || null,
      status: 'draft'
    })

    revalidatePath(`/admin/orgs/${org_id}/contests`)
  }

  return (
    <TbdNotice
      title="Admin Coding Contests"
      description="The Admin Coding Contest management panel is tagged as TBD for Version 2 release. All contest creation, problem setup, and management logic have been safely preserved."
      backHref={`/admin/orgs/${org_id}`}
      backLabel="Back to Classroom"
    />
  )
}
