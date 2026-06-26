import { cn } from '@/lib/utils'

interface Phase {
  label: string
  detail: string
  start: Date
  end: Date
}

export interface TimelineConfig {
  timelineBrowseStart: string
  timelineMeetingsStart: string
  timelineMeetingsEnd: string
  timelineMatchingStart: string
  timelineMatchingEnd: string
  timelineResultsDate: string
}

function buildPhases(cfg: TimelineConfig): Phase[] {
  const d = (s: string) => new Date(s)
  const eod = (s: string) => new Date(`${s}T23:59:59`)
  return [
    {
      label: 'Browse',
      detail: cfg.timelineBrowseStart.slice(5).replace('-', ' '),
      start: d(cfg.timelineBrowseStart),
      end: eod(cfg.timelineBrowseStart),
    },
    {
      label: 'Preliminary Meetings',
      detail: `${cfg.timelineMeetingsStart.slice(5).replace('-', ' ')} – ${cfg.timelineMeetingsEnd.slice(5).replace('-', ' ')}`,
      start: d(cfg.timelineMeetingsStart),
      end: eod(cfg.timelineMeetingsEnd),
    },
    {
      label: 'Matching',
      detail: `${cfg.timelineMatchingStart.slice(5).replace('-', ' ')} – ${cfg.timelineMatchingEnd.slice(5).replace('-', ' ')}`,
      start: d(cfg.timelineMatchingStart),
      end: eod(cfg.timelineMatchingEnd),
    },
    {
      label: 'Results',
      detail: cfg.timelineResultsDate.slice(5).replace('-', ' '),
      start: d(cfg.timelineResultsDate),
      end: eod(cfg.timelineResultsDate),
    },
  ]
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function getPhaseStatus(phase: Phase, now: number): 'past' | 'active' | 'future' {
  if (now > phase.end.getTime()) return 'past'
  if (now >= phase.start.getTime()) return 'active'
  return 'future'
}

export function MatchingTimeline({ config }: { config: TimelineConfig }) {
  const now = Date.now()
  const phases = buildPhases(config)
  const activeIdx = phases.findIndex((p) => getPhaseStatus(p, now) === 'active')

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-start gap-0">
        {phases.map((phase, i) => {
          const status = getPhaseStatus(phase, now)
          const isLast = i === phases.length - 1
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
                        i < (activeIdx === -1 ? phases.length : activeIdx)
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
