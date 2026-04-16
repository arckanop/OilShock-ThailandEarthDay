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

export type SeriesPoint = {
	name: string;
	clean: number;
	fossil: number;
};

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
			<div className="rounded-lg border border-slate-700 bg-[#1f2937] p-3 shadow-xl">
				<p className="mb-2 font-medium text-white">{label}</p>
				{payload.map((entry, index) => (
					<div key={`${entry.name}-${index}`} className="mb-1 flex items-center gap-2 text-sm">
						<div className="h-3 w-3 rounded-sm" style={{backgroundColor: entry.color}}/>
						<span className="text-slate-300">{entry.name}:</span>
						<span className="font-bold text-white">{entry.value.toLocaleString()}</span>
					</div>
				))}
				<div className="mt-2 flex items-center justify-between border-t border-slate-700 pt-2 text-sm">
					<span className="text-slate-400">Total:</span>
					<span className="font-bold text-white">
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
		<div className="flex h-96 flex-col rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-sm">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="text-lg font-bold text-white">{title}</h3>
			</div>

			<div className="w-full flex-1">
				{isLoading ? (
					<div className="flex h-full w-full items-end gap-2 px-4 pb-8">
						{Array.from({length: 12}).map((_, index) => (
							<div key={index} className="flex h-full flex-1 flex-col justify-end gap-1">
								<div className="w-full animate-pulse rounded-t bg-slate-800/50"
								     style={{height: `${Math.random() * 40 + 10}%`}}/>
								<div className="w-full animate-pulse rounded-t bg-slate-800"
								     style={{height: `${Math.random() * 40 + 20}%`}}/>
							</div>
						))}
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155"/>
							<XAxis dataKey="name" axisLine={false} tickLine={false}
							       tick={{fontSize: 12, fill: "#94a3b8"}}/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{fontSize: 12, fill: "#94a3b8"}}
								tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`)}
							/>
							<Tooltip content={<CustomTooltip/>}/>
							<Legend iconType="circle" wrapperStyle={{fontSize: "12px", color: "#cbd5e1"}}/>
							<Line
								type="monotone"
								dataKey="fossil"
								name="Fossil Fuels"
								stroke="#ef4444"
								strokeWidth={3}
								dot={{r: 3, fill: "#111827", strokeWidth: 2}}
								activeDot={{r: 6, strokeWidth: 0, fill: "#ef4444"}}
							/>
							<Line
								type="monotone"
								dataKey="clean"
								name="Clean Energy"
								stroke="#00FF88"
								strokeWidth={3}
								dot={{r: 3, fill: "#111827", strokeWidth: 2}}
								activeDot={{r: 6, strokeWidth: 0, fill: "#00FF88"}}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}