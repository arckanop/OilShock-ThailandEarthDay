"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import {SeriesPoint} from "@/app/(dashboard)/real-data/lib/types";

type ChartCardProps = {
	title: string;
	data: SeriesPoint[];
	isLoading: boolean;
};

type TooltipPayloadItem = {
	color: string;
	name: string;
	value: number;
};

type TooltipProps = {
	active?: boolean;
	payload?: TooltipPayloadItem[];
	label?: string;
};

function CustomTooltip({active, payload, label}: TooltipProps) {
	if (active && payload && payload.length) {
		return (
			<div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
				<p className="mb-2 font-medium text-slate-900">{label}</p>
				{payload.map((entry, index) => (
					<div key={`${entry.name}-${index}`} className="mb-1 flex items-center gap-2 text-sm">
						<div className="h-3 w-3 rounded-sm" style={{backgroundColor: entry.color}}/>
						<span className="text-slate-500">{entry.name}:</span>
						<span className="font-bold text-slate-900">{entry.value.toLocaleString()}</span>
					</div>
				))}
				<div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
					<span className="text-slate-400">Total:</span>
					<span className="font-bold text-slate-900">
                        {payload.reduce((sum, entry) => sum + entry.value, 0).toLocaleString()}
                    </span>
				</div>
			</div>
		);
	}
	return null;
}

export default function ChartCard({title, data, isLoading}: ChartCardProps) {
	return (
		<div className="flex h-96 flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="text-lg font-bold text-slate-900">{title}</h3>
			</div>

			<div className="w-full flex-1">
				{isLoading ? (
					<div className="flex h-full w-full items-end gap-2 px-4 pb-8">
						{Array.from({length: 12}).map((_, index) => (
							<div key={index} className="flex h-full flex-1 flex-col justify-end gap-1">
								<div className="w-full animate-pulse rounded-t bg-slate-200"
								     style={{height: `${Math.random() * 40 + 10}%`}}/>
								<div className="w-full animate-pulse rounded-t bg-slate-100"
								     style={{height: `${Math.random() * 40 + 20}%`}}/>
							</div>
						))}
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
							<XAxis dataKey="name" axisLine={false} tickLine={false}
							       tick={{fontSize: 12, fill: "#64748b"}}/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{fontSize: 12, fill: "#64748b"}}
								tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`)}
							/>
							<Tooltip content={<CustomTooltip/>}/>
							<Legend iconType="circle" wrapperStyle={{fontSize: "12px", color: "#475569"}}/>
							<Line
								type="monotone"
								dataKey="fossil"
								name="Fossil Fuels"
								stroke="#ef4444"
								strokeWidth={3}
								dot={{r: 3, fill: "#fff", strokeWidth: 2}}
								activeDot={{r: 6, strokeWidth: 0, fill: "#ef4444"}}
							/>
							<Line
								type="monotone"
								dataKey="clean"
								name="Clean Energy"
								stroke="#10b981"
								strokeWidth={3}
								dot={{r: 3, fill: "#fff", strokeWidth: 2}}
								activeDot={{r: 6, strokeWidth: 0, fill: "#10b981"}}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

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