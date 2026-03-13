interface Props {
  totalKcal: number
  goal: number
}

export default function GoalRing({ totalKcal, goal }: Props) {
  const circumference = 2 * Math.PI * 65
  const pct = Math.min(totalKcal / goal, 1)
  const strokeDashoffset = circumference * (1 - pct)

  return (
    <div className="goal-ring">
      <div className="ring-container">
        <svg viewBox="0 0 140 140">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#48c9b0" />
              <stop offset="100%" stopColor="#f0856e" />
            </linearGradient>
          </defs>
          <circle className="ring-bg" cx="70" cy="70" r="65" />
          <circle
            className="ring-fill"
            cx="70"
            cy="70"
            r="65"
            style={{ strokeDashoffset }}
          />
        </svg>
        <div className="ring-center">
          <div className="number">{totalKcal}</div>
          <div className="label">kcal today</div>
        </div>
      </div>
    </div>
  )
}
