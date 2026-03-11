'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface Props {
  profile: Profile
  email: string
}

export default function ProfileStrip({ profile, email }: Props) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSignOut() {
    await getSupabaseBrowserClient().auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="profile-strip">
      <div className="profile-account">
        <div className="profile-account-identity">
          <span className="profile-account-label">Signed in as</span>
          <span className="profile-account-email" title={email}>{email}</span>
        </div>
        {showConfirm ? (
          <div className="signout-confirm">
            <span>Sign out?</span>
            <button className="signout-confirm-yes" onClick={handleSignOut}>Yes</button>
            <button className="signout-confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
          </div>
        ) : (
          <button className="signout-btn" onClick={() => setShowConfirm(true)}>
            Sign Out
          </button>
        )}
      </div>
      <div className="profile-chips">
        <div className="chip">
          <span className="chip-val">{profile.weight}</span> kg
        </div>
        <div className="divider" />
        <div className="chip">
          <span className="chip-val">{profile.height}</span> cm
        </div>
        <div className="divider" />
        <div className="chip bmi-chip">
          <span className="chip-val">{profile.bmi.toFixed(1)}</span> BMI
        </div>
        <button className="edit-btn" onClick={() => router.push('/onboarding')}>
          Edit
        </button>
      </div>
    </div>
  )
}
