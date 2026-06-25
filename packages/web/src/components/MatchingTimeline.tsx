import { cn } from '@/lib/utils'

interface Phase {
  label: string
  detail: string
  start: Date
  end: Date
}

const PHASES: Phase[] = [
  {
    label: 'Browse',
    detail: '22 Jun',
    start: new Date('2026-06-22'),
    end: new Date('2026-06-24T23:59:59'),
  },
  {
    label: 'Preliminary Meetings',
    detail: '25 Jun – 9 Jul',
    start: new Date('2026-06-25'),
    end: new Date('2026-07-09T23:59:59'),
  },
  {
    label: 'Matching',
    detail: '10 – 15 Jul',
    start: new Date('2026-07-10'),
    end: new Date('2026-07-15T23:59:59'),
  },
  {
    label: 'Results',
    detail: '27 Jul',
    start: new Date('2026-07-27'),
    end: new Date('2026-07-27T23:59:59'),
  },
]

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function getPhaseStatus(phase: Phase, now: number): 'past' | 'active' | 'future' {
  if (now > phase.end.getTime()) return 'past'
  if (now >= phase.start.getTime()) return 'active'
  return 'future'
}

export function MatchingTimeline() {
  const now = Date.now()
  const activeIdx = PHASES.findIndex((p) => getPhaseStatus(p, now) === 'active')

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-start gap-0">
        {PHASES.map((phase, i) => {
          const status = getPhaseStatus(phase, now)
          const isLast = i === PHASES.length - 1
          const daysLeft = status === 'active' ? daysUntil(phase.end) : null

          return (
            <div key={phase.label} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* dot + connector line */}
                <div className="flex items-center w-full">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0 z-10',
                      status === 'past' && 'bg-muted-foreground/40',
                      status === 'active' && 'bg-primary ring-2 ring-primary/20',
                      status === 'future' && 'border-2 border-muted-foreground/30 bg-background',
                    )}
                  />
                  {!isLast && (
                    <div
                      className={cn(
                        'h-0.5 flex-1',
                        i < (activeIdx === -1 ? PHASES.length : activeIdx)
                          ? 'bg-muted-foreground/30'
                          : 'bg-muted-foreground/15',
                      )}
                    />
                  )}
                </div>

                {/* label + date */}
                <div className="mt-1.5 pr-2 w-full">
                  <p
                    className={cn(
                      'text-xs font-medium leading-tight',
                      status === 'past' && 'text-muted-foreground/60',
                      status === 'active' && 'text-foreground',
                      status === 'future' && 'text-muted-foreground/50',
                    )}
                  >
                    {phase.label}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-0.5 leading-tight',
                      status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground/40',
                    )}
                  >
                    {phase.detail}
                  </p>
                  {status === 'active' && daysLeft !== null && (
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {daysLeft <= 0 ? 'ends today' : `${daysLeft}d left`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
