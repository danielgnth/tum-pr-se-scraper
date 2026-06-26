import type { ExtAppState } from '@/lib/externalApplications'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Course } from 'server/src/db/schema'
import { CourseCard } from './CourseCard'

interface Props {
  course: Course
  note?: string
  extAppState?: ExtAppState
  onFavorite?: (id: string) => void
  onDismiss?: (id: string) => void
  onExtAppToggle?: (id: string) => void
}

export function SortableCourseCard({
  course,
  note,
  extAppState,
  onFavorite,
  onDismiss,
  onExtAppToggle,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.tumonlineId,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-stretch gap-1', isDragging && 'opacity-50')}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-muted-foreground/25 hover:text-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing flex items-center px-0.5 shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <CourseCard
          course={course}
          isFavorite
          note={note}
          extAppState={extAppState}
          onFavorite={onFavorite}
          onDismiss={onDismiss}
          onExtAppToggle={onExtAppToggle}
        />
      </div>
    </div>
  )
}
