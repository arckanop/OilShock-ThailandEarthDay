"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, CloudFog, Leaf, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { loadCountriesData, getThailandRows } from "@/lib/dataStore";
import type { MonthRecord } from "@/lib/types";

const TWH_TO_MW = 1388.89;

type Policy = {
	id: string; name: string; description: string;
	demand: number; generation: number; co2: number; surplus: number;
	cleanRatio: number; status: string; co2Delta: number; isBest?: boolean;
};

function forecastNextMonth(rows: MonthRecord[]): MonthRecord | null {
	if (!rows.length) return null;
	const last = rows[rows.length - 1];
	const nextMonth = last.month === 12 ? 1 : last.month + 1;
	const same = rows.filter((r) => r.month === nextMonth).slice(-2);
	if (!same.length) return last;
	const avg = (k: keyof MonthRecord) => same.reduce((a, r) => a + (r[k] as number), 0) / same.length;
	return {
		...last,
		month: nextMonth,
		year: last.month === 12 ? last.year + 1 : last.year,
		demand: avg("demand"), genClean: avg("genClean"), genFossil: avg("genFossil"),
		emitFossil: avg("emitFossil"), emitClean: avg("emitClean"),
	};
}

function computePolicy(
	base: MonthRecord, cleanDelta: number, fossilDelta: number,
	id: string, name: string, description: string, isBest = false,
): Policy {
	const newClean = base.genClean * (1 + cleanDelta);
	const newFossil = base.genFossil * (1 + fossilDelta);
	const fossilEF = base.genFossil > 0 ? base.emitFossil / base.genFossil : 0;
	const co2Kt = Math.round(newFossil * fossilEF * 1000);
	const baseCo2Kt = Math.round(base.genFossil * fossilEF * 1000);
	return {
		id, name, description, status: "Feasible", isBest,
		demand: Math.round(base.demand * TWH_TO_MW),
		generation: Math.round((newClean + newFossil) * TWH_TO_MW),
		co2: co2Kt,
		surplus: Math.round((newClean + newFossil - base.demand) * TWH_TO_MW),
		cleanRatio: newClean + newFossil > 0 ? Math.round((newClean / (newClean + newFossil)) * 100) : 0,
		co2Delta: baseCo2Kt > 0 ? Math.round(((co2Kt - baseCo2Kt) / baseCo2Kt) * 100) : 0,
	};
}

export default function PolicyComparisonPage() {
	const [baseline, setBaseline] = useState<MonthRecord | null>(null);

	useEffect(() => {
		loadCountriesData().then((data) => {
			setBaseline(forecastNextMonth(getThailandRows(data)));
		});
	}, []);

	const policies: Policy[] = baseline ? [
		computePolicy(baseline, 0.20, -0.10, "A", "Policy A: Balanced Transition",
			"เพิ่มพลังงานสะอาด 20% ลดฟอสซิล 10% — เปลี่ยนผ่านแบบค่อยเป็นค่อยไป"),
		computePolicy(baseline, 0.50, -0.25, "B", "Policy B: Aggressive Clean Expansion",
			"เพิ่มพลังงานสะอาด 50% ลดฟอสซิล 25% — มุ่งลด CO2 สูงสุด", true),
		computePolicy(baseline, 0.05, 0, "C", "Policy C: Reliability First",
			"เพิ่มพลังงานสะอาด 5% คงฟอสซิลเดิม — เน้นความมั่นคงระบบ"),
	] : [];

	const chartData = policies.map((p) => ({
		name: `Policy ${p.id}`, Demand: p.demand, Generation: p.generation, CO2: p.co2,
	}));

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">Policy Comparison</h1>
				<p className="mt-1 text-slate-500">
					เปรียบเทียบนโยบาย 3 รูปแบบ คำนวณจากข้อมูล Thailand ล่าสุด (Ember 2024)
				</p>
			</div>

			{!baseline ? (
				<div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">Loading real baseline...</div>
			) : (
				<>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{policies.map((policy, idx) => (
							<motion.div key={policy.id}
							            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
							            className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 ${
								            policy.isBest
									            ? "border-emerald-500 bg-emerald-50/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
									            : "border-slate-200 bg-white"
							            }`}>
								{policy.isBest && (
									<div className="absolute right-0 top-0 rounded-bl-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
										Recommended
									</div>
								)}
								<h3 className="mb-2 text-lg font-bold text-slate-900">{policy.name}</h3>
								<p className="mb-4 min-h-[60px] text-sm text-slate-500">{policy.description}</p>
								<div className="space-y-2 border-t border-slate-100 pt-4">
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">Demand</span>
										<span className="font-semibold">{policy.demand.toLocaleString()} MW</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">Generation</span>
										<span className="font-semibold">{policy.generation.toLocaleString()} MW</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">CO2 Emission</span>
										<span className="font-semibold text-rose-600">{policy.co2.toLocaleString()} kt</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">Clean Ratio</span>
										<span className="font-semibold text-emerald-600">{policy.cleanRatio}%</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-slate-500">CO2 Δ vs baseline</span>
										<span className={`font-semibold ${policy.co2Delta < 0 ? "text-emerald-600" : "text-rose-600"}`}>
											{policy.co2Delta > 0 ? "+" : ""}{policy.co2Delta}%
										</span>
									</div>
									<div className="flex items-center justify-between pt-2 text-sm">
										<span className="text-slate-500">Status</span>
										<span className="flex items-center gap-1 font-semibold text-emerald-600">
											<Check className="h-4 w-4" />{policy.status}
										</span>
									</div>
								</div>
							</motion.div>
						))}
					</div>

					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
					            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
							<Zap className="h-5 w-5 text-indigo-500" />
							Side-by-Side Comparison
						</h2>
						<div className="h-80 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={chartData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
									<XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
									<YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
									<Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} cursor={{fill: "#f8fafc"}}/>
									<Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px"}} />
									<Bar dataKey="Demand" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60}/>
									<Bar dataKey="Generation" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60}/>
									<Bar dataKey="CO2" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={60}/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</motion.div>

					<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
						<div className="flex items-start gap-2">
							<Leaf className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
							<div>
								<p className="font-semibold">Baseline Source</p>
								<p className="mt-1 text-amber-800">
									Baseline = ค่าพยากรณ์เดือนถัดไปของประเทศไทย (seasonal-naive: ค่าเฉลี่ย 2 ปีล่าสุดของเดือนเดียวกัน) จากข้อมูล Ember Electricity Data ชุด 2020–2024
								</p>
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
