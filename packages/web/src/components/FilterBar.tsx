import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const TYPES = ['Praktikum', 'Master-Praktikum', 'Seminar', 'Master-Seminar']

interface Props {
  search: string
  onSearch: (v: string) => void
  selectedTypes: string[]
  onTypeToggle: (t: string) => void
  leftoverOnly: boolean
  onLeftoverToggle: () => void
  sortBy: 'title' | 'ects'
  onSortChange: (s: 'title' | 'ects') => void
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
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search by title, course number, or instructor..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 items-center">
        {TYPES.map((t) => (
          <Badge
            key={t}
            variant={selectedTypes.includes(t) ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => onTypeToggle(t)}
          >
            {t}
          </Badge>
        ))}
        <Badge
          variant={leftoverOnly ? 'destructive' : 'outline'}
          className="cursor-pointer select-none"
          onClick={onLeftoverToggle}
        >
          Leftover spots
        </Badge>
        <div className="ml-auto flex gap-1 text-sm">
          <button
            type="button"
            onClick={() => onSortChange('title')}
            className={
              sortBy === 'title' ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
            }
          >
            A–Z
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            onClick={() => onSortChange('ects')}
            className={
              sortBy === 'ects' ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
            }
          >
            ECTS ↓
          </button>
        </div>
      </div>
    </div>
  )
}
