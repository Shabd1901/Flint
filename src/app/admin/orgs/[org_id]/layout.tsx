import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function AdminOrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ org_id: string }>
}) {
  const { org_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use the RPC to reliably check if the user is an admin or maintainer for this org
  const { data: isAdmin } = await supabase.rpc('is_org_admin', { check_org_id: org_id })

  if (!isAdmin) {
    redirect(`/candidate/orgs/${org_id}`)
  }

  return <>{children}</>
}
