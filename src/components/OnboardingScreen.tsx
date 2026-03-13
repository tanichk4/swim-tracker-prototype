'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { calcBMI } from '@/lib/calculations'
import type { Profile } from '@/lib/types'

interface Props {
  initialProfile: Profile | null
}

export default function OnboardingScreen({ initialProfile }: Props) {
  const router = useRouter()
  const [height, setHeight] = useState(initialProfile?.height?.toString() ?? '')
  const [weight, setWeight] = useState(initialProfile?.weight?.toString() ?? '')
  const [age, setAge] = useState(initialProfile?.age?.toString() ?? '')
  const [sex, setSex] = useState<'male' | 'female'>(initialProfile?.sex ?? 'male')
  const [goal, setGoal] = useState((initialProfile?.daily_goal ?? 500).toString())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({})
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locked = !(
    height && parseFloat(height) > 0 &&
    weight && parseFloat(weight) > 0 &&
    age && parseFloat(age) > 0 &&
    goal && parseFloat(goal) > 0
  )

  const isEditMode = !!initialProfile
  const isDirty = isEditMode && (
    height !== (initialProfile!.height?.toString() ?? '') ||
    weight !== (initialProfile!.weight?.toString() ?? '') ||
    age    !== (initialProfile!.age?.toString()    ?? '') ||
    sex    !== (initialProfile!.sex ?? 'male') ||
    goal   !== (initialProfile!.daily_goal ?? 500).toString()
  )
  const showClose = isEditMode && !isDirty
  const btnLabel = !isEditMode ? 'Continue →' : isDirty ? 'Save Changes' : 'Close'
  const btnVisuallyLocked = locked

  useEffect(() => {
    if (!toastMsg) return
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null)
      setFieldErrors({})
    }, 3600)
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [toastMsg])

  function triggerShake() {
    const btn = btnRef.current
    if (!btn) return
    btn.style.animation = 'none'
    void btn.offsetHeight
    btn.style.animation = 'shake 0.4s ease'
  }

  function checkWarnings(h: string, w: string, a: string) {
    const hv = parseFloat(h)
    const wv = parseFloat(w)
    const av = parseFloat(a)
    const warnings: Record<string, string> = {}

    if (!isNaN(av) && !isNaN(hv) && hv > 0) {
      if (av < 7 && hv > 130) warnings.height = `Height above 130 cm is unusual for age ${av}`
      else if (av < 10 && hv > 155) warnings.height = `Height above 155 cm is unusual for age ${av}`
      else if (av < 14 && hv > 180) warnings.height = `Height above 180 cm is unusual for age ${av}`
    }

    if (!isNaN(av) && !isNaN(wv) && wv > 0) {
      if (av < 7 && wv > 35) warnings.weight = `Weight above 35 kg is unusual for age ${av}`
      else if (av < 10 && wv > 50) warnings.weight = `Weight above 50 kg is unusual for age ${av}`
      else if (av < 14 && wv > 70) warnings.weight = `Weight above 70 kg is unusual for age ${av}`
    }

    if (!isNaN(av) && (av < 3 || av > 120)) {
      warnings.age = `Age ${av} seems outside a normal range`
    }

    if (!isNaN(hv) && !isNaN(wv) && hv > 0 && wv > 0) {
      const bmi = wv / (hv / 100) ** 2
      if (bmi < 12) warnings.bmi = `BMI of ${bmi.toFixed(1)} seems very low — double-check values`
      else if (bmi > 60) warnings.bmi = `BMI of ${bmi.toFixed(1)} seems very high — double-check values`
    }

    setFieldWarnings(warnings)
  }

  async function handleSubmit() {
    if (submitting) return

    if (locked) {
      triggerShake()
      const errors: Record<string, string> = {}
      if (!height || parseFloat(height) <= 0) errors.height = 'Height is required'
      if (!weight || parseFloat(weight) <= 0) errors.weight = 'Weight is required'
      if (!age || parseFloat(age) <= 0) errors.age = 'Age is required'
      if (!goal || parseFloat(goal) <= 0) errors.goal = 'Daily goal is required'
      setFieldErrors(errors)
      setTimeout(() => setFieldErrors({}), 2000)
      return
    }

    const h = parseFloat(height)
    const w = parseFloat(weight)
    const a = parseInt(age)
    const g = parseInt(goal)

    const errors: Record<string, string> = {}
    const toastErrors: string[] = []

    if (isNaN(h)) {
      errors.height = 'Height is required'
      toastErrors.push('Please enter your height')
    } else if (h < 50 || h > 250) {
      errors.height = 'Must be 50–250 cm'
      toastErrors.push(`<strong>${h} cm</strong> doesn't look right — expected 50–250 cm`)
    }

    if (isNaN(w)) {
      errors.weight = 'Weight is required'
      toastErrors.push('Please enter your weight')
    } else if (w < 10 || w > 300) {
      errors.weight = 'Must be 10–300 kg'
      toastErrors.push(`<strong>${w} kg</strong> doesn't look right — expected 10–300 kg`)
    }

    if (isNaN(a)) {
      errors.age = 'Age is required'
      toastErrors.push('Please enter your age')
    } else if (a < 1 || a > 120) {
      errors.age = 'Must be 1–120'
      toastErrors.push(`<strong>${a} years</strong> doesn't seem right — expected 1–120`)
    }

    if (isNaN(g)) {
      errors.goal = 'Daily goal is required'
      toastErrors.push('Please enter your daily calorie goal')
    } else if (g < 50 || g > 5000) {
      errors.goal = 'Must be 50–5000 kcal'
      toastErrors.push(`<strong>${g} kcal</strong> doesn't look right — expected 50–5000 kcal`)
    }

    if (toastErrors.length > 0) {
      setFieldErrors(errors)
      setToastMsg(toastErrors.join('<br>'))
      triggerShake()
      return
    }

    const bmi = calcBMI(w, h)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      height: h,
      weight: w,
      age: a,
      sex,
      bmi: parseFloat(bmi.toFixed(2)),
      daily_goal: g,
    })

    if (error) {
      setToastMsg('Failed to save profile — please try again')
      setSubmitting(false)
      return
    }

    router.push('/tracker')
  }

  function stepInput(field: 'height' | 'weight' | 'age' | 'goal', delta: number) {
    const stepSizes = { height: 1, weight: 0.5, age: 1, goal: 50 }
    const setter = { height: setHeight, weight: setWeight, age: setAge, goal: setGoal }[field]
    const current = parseFloat({ height, weight, age, goal }[field]) || 0
    setter(String(Math.max(0, current + delta * stepSizes[field])))
  }

  return (
    <>
      <div id="screenOnboarding" className="screen active">
        <div className="onboarding-card">
          <div className="onboarding-logo">
            <h1>SwimPulse</h1>
            <p>Track · Burn · Recover</p>
          </div>

          <div className="onboarding-why">
            <p>
              Your height, weight, and age let us calculate accurate calorie burn for every swim —
              no guesswork.
            </p>
          </div>

          <div className="onboarding-heading">Your Body Profile</div>

          <div className="onboarding-fields">
            {/* Height */}
            <div className="onboarding-field">
              <label htmlFor="height">Height (cm)</label>
              <div className="num-input-wrap">
                <input
                  id="height"
                  type="number"
                  placeholder="e.g. 170"
                  min="50"
                  max="250"
                  step="1"
                  value={height}
                  className={fieldErrors.height ? 'input-error' : ''}
                  onChange={(e) => {
                    setHeight(e.target.value)
                    setFieldErrors((p) => ({ ...p, height: '' }))
                    setFieldWarnings((p) => ({ ...p, height: '', bmi: '' }))
                  }}
                  onBlur={() => checkWarnings(height, weight, age)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="num-steppers">
                  <button type="button" tabIndex={-1} onClick={() => stepInput('height', 1)}>▲</button>
                  <button type="button" tabIndex={-1} onClick={() => stepInput('height', -1)}>▼</button>
                </div>
              </div>
              <div className={`field-error${fieldErrors.height ? ' visible' : ''}`}>
                {fieldErrors.height}
              </div>
              <div className={`field-warn${fieldWarnings.height ? ' visible' : ''}`}>
                {fieldWarnings.height ? `⚠ ${fieldWarnings.height}` : ''}
              </div>
            </div>

            {/* Weight */}
            <div className="onboarding-field">
              <label htmlFor="weight">Weight (kg)</label>
              <div className="num-input-wrap">
                <input
                  id="weight"
                  type="number"
                  placeholder="e.g. 65"
                  min="10"
                  max="300"
                  step="0.5"
                  value={weight}
                  className={fieldErrors.weight ? 'input-error' : ''}
                  onChange={(e) => {
                    setWeight(e.target.value)
                    setFieldErrors((p) => ({ ...p, weight: '' }))
                    setFieldWarnings((p) => ({ ...p, weight: '', bmi: '' }))
                  }}
                  onBlur={() => checkWarnings(height, weight, age)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="num-steppers">
                  <button type="button" tabIndex={-1} onClick={() => stepInput('weight', 1)}>▲</button>
                  <button type="button" tabIndex={-1} onClick={() => stepInput('weight', -1)}>▼</button>
                </div>
              </div>
              <div className={`field-error${fieldErrors.weight ? ' visible' : ''}`}>
                {fieldErrors.weight}
              </div>
              <div className={`field-warn${fieldWarnings.weight ? ' visible' : ''}`}>
                {fieldWarnings.weight ? `⚠ ${fieldWarnings.weight}` : ''}
              </div>
            </div>

            {/* Age */}
            <div className="onboarding-field">
              <label htmlFor="age">Age</label>
              <div className="num-input-wrap">
                <input
                  id="age"
                  type="number"
                  placeholder="e.g. 28"
                  min="1"
                  max="120"
                  step="1"
                  value={age}
                  className={fieldErrors.age ? 'input-error' : ''}
                  onChange={(e) => {
                    setAge(e.target.value)
                    setFieldErrors((p) => ({ ...p, age: '' }))
                    setFieldWarnings((p) => ({ ...p, age: '' }))
                  }}
                  onBlur={() => checkWarnings(height, weight, age)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="num-steppers">
                  <button type="button" tabIndex={-1} onClick={() => stepInput('age', 1)}>▲</button>
                  <button type="button" tabIndex={-1} onClick={() => stepInput('age', -1)}>▼</button>
                </div>
              </div>
              <div className={`field-error${fieldErrors.age ? ' visible' : ''}`}>
                {fieldErrors.age}
              </div>
              <div className={`field-warn${fieldWarnings.age ? ' visible' : ''}`}>
                {fieldWarnings.age ? `⚠ ${fieldWarnings.age}` : ''}
              </div>
            </div>

            {/* Daily Goal */}
            <div className="onboarding-field">
              <label htmlFor="goal">Daily Goal (kcal)</label>
              <div className="num-input-wrap">
                <input
                  id="goal"
                  type="number"
                  placeholder="e.g. 500"
                  min="50"
                  max="5000"
                  step="50"
                  value={goal}
                  className={fieldErrors.goal ? 'input-error' : ''}
                  onChange={(e) => {
                    setGoal(e.target.value)
                    setFieldErrors((p) => ({ ...p, goal: '' }))
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="num-steppers">
                  <button type="button" tabIndex={-1} onClick={() => stepInput('goal', 1)}>▲</button>
                  <button type="button" tabIndex={-1} onClick={() => stepInput('goal', -1)}>▼</button>
                </div>
              </div>
              <div className={`field-error${fieldErrors.goal ? ' visible' : ''}`}>
                {fieldErrors.goal}
              </div>
            </div>

            {/* Sex */}
            <div className="onboarding-field">
              <label>Sex</label>
              <div className="sex-toggle">
                <button
                  type="button"
                  data-val="male"
                  className={sex === 'male' ? 'selected' : ''}
                  onClick={() => setSex('male')}
                >
                  Male
                </button>
                <button
                  type="button"
                  data-val="female"
                  className={sex === 'female' ? 'selected' : ''}
                  onClick={() => setSex('female')}
                >
                  Female
                </button>
              </div>
              <div className={`field-warn${fieldWarnings.bmi ? ' visible' : ''}`}>
                {fieldWarnings.bmi ? `⚠ ${fieldWarnings.bmi}` : ''}
              </div>
            </div>
          </div>

          <button
            ref={btnRef}
            className={`btn-continue${btnVisuallyLocked ? ' btn-continue--locked' : ''}`}
            onClick={showClose ? () => router.push('/tracker') : handleSubmit}
            disabled={submitting}
          >
            {btnLabel}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="error-toast">
          <span className="toast-icon">⚠️</span>
          <span
            className="toast-msg"
            dangerouslySetInnerHTML={{ __html: toastMsg }}
          />
          <button className="toast-close" onClick={() => setToastMsg(null)}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}
