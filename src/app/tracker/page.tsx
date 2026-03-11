import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import TrackerScreen from '@/components/TrackerScreen'
import type { Profile, Session } from '@/lib/types'

export default async function TrackerPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Load today's sessions (midnight UTC as day boundary)
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  return (
    <TrackerScreen
      initialProfile={profile as Profile}
      initialSessions={(sessions ?? []) as Session[]}
      email={user.email ?? ''}
    />
  )
}
