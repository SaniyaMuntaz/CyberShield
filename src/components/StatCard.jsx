
export default function StatCard({ icon: Icon, label, value, color, detail }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color] || colors.indigo}`}>
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{detail}</p>
    </div>
  )
}