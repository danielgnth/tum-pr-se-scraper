import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const TYPES = ['Praktikum', 'Master-Praktikum', 'Seminar', 'Master-Seminar']
const PLATFORMS = ['Zoom', 'Teams', 'BBB', 'In person', 'Hybrid']

function Chip({
  active,
  onClick,
  children,
  activeClass,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none cursor-pointer',
        active
          ? (activeClass ?? 'border-primary bg-primary text-primary-foreground')
          : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30',
      )}
    >
      {children}
    </button>
  )
}

interface Props {
  search: string
  onSearch: (v: string) => void
  selectedTypes: string[]
  onTypeToggle: (t: string) => void
  leftoverOnly: boolean
  onLeftoverToggle: () => void
  sortBy: 'title' | 'date'
  onSortChange: (s: 'title' | 'date') => void
  selectedPlatforms: string[]
  onPlatformToggle: (p: string) => void
}

export function FilterBar({
  search,
  onSearch,
  selectedTypes,
  onTypeToggle,
  leftoverOnly,
  onLeftoverToggle,
  sortBy,
  onSortChange,
  selectedPlatforms,
  onPlatformToggle,
}: Props) {
  return (
    <div className="flex flex-col gap-2.5">
      <Input
        placeholder="Search by title, course number, or instructor…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {TYPES.map((t) => (
          <Chip key={t} active={selectedTypes.includes(t)} onClick={() => onTypeToggle(t)}>
            {t}
          </Chip>
        ))}
        <span className="text-border text-xs px-0.5 select-none">·</span>
        {PLATFORMS.map((p) => (
          <Chip key={p} active={selectedPlatforms.includes(p)} onClick={() => onPlatformToggle(p)}>
            {p}
          </Chip>
        ))}
        <span className="text-border text-xs px-0.5 select-none">·</span>
        <Chip
          active={leftoverOnly}
          onClick={onLeftoverToggle}
          activeClass="border-green-600 bg-green-600 text-white"
        >
          Spots available
        </Chip>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort</span>
        <div className="flex text-xs border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => onSortChange('title')}
            className={cn(
              'px-2.5 py-1 border-r transition-colors cursor-pointer',
              sortBy === 'title'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            Title
          </button>
          <button
            type="button"
            onClick={() => onSortChange('date')}
            className={cn(
              'px-2.5 py-1 transition-colors cursor-pointer',
              sortBy === 'date'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            Meeting date
          </button>
        </div>
      </div>
    </div>
  )
}
