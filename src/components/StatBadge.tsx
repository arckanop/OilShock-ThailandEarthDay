export function StatBadge({ label, value, sig, highlight }: { label: string; value: string; sig?: string; highlight?: boolean }) {
	return (
		<div className={`flex items-center justify-between rounded-lg border px-4 py-2.5 ${
			highlight ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white"
		}`}>
			<span className="text-sm font-medium text-slate-600">{label}</span>
			<span className="flex items-center gap-1">
				<span className={`font-mono text-sm font-bold ${highlight ? "text-indigo-700" : "text-slate-900"}`}>{value}</span>
				{sig && <span className="text-xs font-bold text-emerald-600">{sig}</span>}
			</span>
		</div>
	);
}
