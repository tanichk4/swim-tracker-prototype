export interface Profile {
  id: string
  height: number
  weight: number
  age: number
  sex: 'male' | 'female'
  bmi: number
  daily_goal: number
}

export type Stroke = 'freestyle' | 'breaststroke' | 'backstroke' | 'butterfly' | 'mixed'
export type Intensity = 'easy' | 'moderate' | 'hard'

export interface Session {
  id: string
  user_id: string
  distance: number
  duration: number
  stroke: Stroke
  intensity: Intensity
  kcal: number
  created_at: string
}
