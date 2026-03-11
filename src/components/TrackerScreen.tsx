'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import ProfileStrip from './ProfileStrip'
import GoalRing from './GoalRing'
import StatsGrid from './StatsGrid'
import SessionConfirm from './SessionConfirm'
import SessionForm from './SessionForm'
import SessionList from './SessionList'
import type { Profile, Session } from '@/lib/types'

interface Props {
  initialProfile: Profile
  initialSessions: Session[]
  email: string
}

export default function TrackerScreen({ initialProfile, initialSessions, email }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [lastLoggedAt, setLastLoggedAt] = useState<number | null>(null)

  const totalKcal = sessions.reduce((s, x) => s + x.kcal, 0)
  const totalDist = sessions.reduce((s, x) => s + x.distance, 0)
  const totalMin = sessions.reduce((s, x) => s + x.duration, 0)
  const kcalPerMin = totalMin > 0 ? (totalKcal / totalMin).toFixed(1) : '—'

  const supabase = getSupabaseBrowserClient()

  async function handleLog(newSession: Omit<Session, 'id' | 'user_id' | 'created_at'>) {
    const optimisticId = crypto.randomUUID()
    const optimistic: Session = {
      ...newSession,
      id: optimisticId,
      user_id: initialProfile.id,
      created_at: new Date().toISOString(),
    }

    setSessions((prev) => [optimistic, ...prev])
    setLastLoggedAt(Date.now())

    const { data, error } = await supabase
      .from('sessions')
      .insert({ ...newSession, user_id: initialProfile.id })
      .select()
      .single()

    if (error) {
      setSessions((prev) => prev.filter((s) => s.id !== optimisticId))
    } else {
      setSessions((prev) => prev.map((s) => (s.id === optimisticId ? (data as Session) : s)))
    }
  }

  async function handleRemove(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    await supabase.from('sessions').delete().eq('id', id)
  }

  async function handleClearAll() {
    const ids = sessions.map((s) => s.id)
    setSessions([])
    if (ids.length > 0) {
      await supabase.from('sessions').delete().in('id', ids)
    }
  }

  return (
    <div id="screenTracker" className="screen active">
      <header>
        <h1>SwimPulse</h1>
        <p>Track · Burn · Recover</p>
      </header>

      <ProfileStrip profile={initialProfile} email={email} />

      <GoalRing totalKcal={totalKcal} />

      <StatsGrid
        totalDist={totalDist}
        totalMin={totalMin}
        sessionCount={sessions.length}
        kcalPerMin={kcalPerMin}
      />

      <SessionConfirm lastLoggedAt={lastLoggedAt} />

      <SessionForm profile={initialProfile} onLog={handleLog} />

      <SessionList
        sessions={sessions}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
      />
    </div>
  )
}
