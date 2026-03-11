'use client'

const BUBBLES = [
  { id: 1,  size: 80,  left: 8,  bottom: 5,  color: 'coral', delay: 0,   dur: 14, inner: true  },
  { id: 2,  size: 40,  left: 15, bottom: 20, color: 'foam',  delay: 2,   dur: 18, inner: false },
  { id: 3,  size: 120, left: 25, bottom: 10, color: 'coral', delay: 5,   dur: 22, inner: true  },
  { id: 4,  size: 55,  left: 35, bottom: 35, color: 'foam',  delay: 1,   dur: 16, inner: false },
  { id: 5,  size: 30,  left: 48, bottom: 60, color: 'coral', delay: 8,   dur: 20, inner: true  },
  { id: 6,  size: 95,  left: 58, bottom: 8,  color: 'foam',  delay: 3,   dur: 25, inner: false },
  { id: 7,  size: 45,  left: 70, bottom: 45, color: 'coral', delay: 6,   dur: 17, inner: true  },
  { id: 8,  size: 70,  left: 80, bottom: 15, color: 'foam',  delay: 1.5, dur: 21, inner: false },
  { id: 9,  size: 35,  left: 90, bottom: 55, color: 'coral', delay: 9,   dur: 19, inner: true  },
  { id: 10, size: 110, left: 5,  bottom: 70, color: 'foam',  delay: 4,   dur: 28, inner: false },
  { id: 11, size: 50,  left: 20, bottom: 80, color: 'coral', delay: 7,   dur: 15, inner: true  },
  { id: 12, size: 65,  left: 42, bottom: 15, color: 'foam',  delay: 2.5, dur: 23, inner: false },
  { id: 13, size: 85,  left: 62, bottom: 72, color: 'coral', delay: 10,  dur: 26, inner: true  },
  { id: 14, size: 30,  left: 75, bottom: 30, color: 'foam',  delay: 0.5, dur: 18, inner: false },
  { id: 15, size: 55,  left: 88, bottom: 80, color: 'coral', delay: 5.5, dur: 20, inner: true  },
  { id: 16, size: 40,  left: 32, bottom: 50, color: 'foam',  delay: 3.5, dur: 16, inner: false },
  { id: 17, size: 100, left: 52, bottom: 85, color: 'coral', delay: 11,  dur: 30, inner: false },
  { id: 18, size: 25,  left: 18, bottom: 42, color: 'foam',  delay: 6.5, dur: 13, inner: true  },
]

export default function BubbleField({ active }: { active: boolean }) {
  return (
    <div className={`bubble-field${active ? ' bubble-field--active' : ''}`}>
      {BUBBLES.map((b) => (
        <span
          key={b.id}
          className={`bubble bubble--${b.color}`}
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            bottom: `${b.bottom}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        >
          {b.inner && <span className="bubble__inner" />}
        </span>
      ))}
    </div>
  )
}
