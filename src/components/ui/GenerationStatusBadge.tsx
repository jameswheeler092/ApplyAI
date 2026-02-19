import { cn } from '@/lib/utils'
import type { GenerationStatus } from '@/types'

const styles: Record<GenerationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700 animate-pulse',
  complete: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const labels: Record<GenerationStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  complete: 'Complete',
  failed: 'Failed',
}

export function GenerationStatusBadge({ status }: { status: GenerationStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}
