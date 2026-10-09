
import { MessageSquareWarning } from 'lucide-react'

export default function IncidentRow({ item }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
        <MessageSquareWarning size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{item.platform}</p>
          <span className="text-xs text-slate-400">{item.date}</span>
        </div>

        <p className="mt-1 line-clamp-2 break-words text-sm text-slate-500">
          {item.message}
        </p>
      </div>
    </div>
  )
}