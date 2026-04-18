"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
	BatteryCharging, CheckCircle, CloudFog, Droplet, Factory, FlaskConical, Leaf, TrendingUp, Zap,
} from "lucide-react";
import {
	Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { loadCountriesData, getThailandRows } from "@/lib/dataStore";
import { monthLabel } from "@/lib/utils";
import { forecastAccuracy, linearRegression } from "@/lib/stats";
import type { MonthRecord } from "@/lib/types";

const TWH_TO_MW = 1388.89;

type ForecastRow = { month: string; demand: number; generation: number; co2: number; isForecast?: boolean };

type PolicyRow = {
	id: string; name: string; description: string;
	demand: number; generation: number; co2: number; surplus: number;
	cleanRatio: number; status: string; co2Delta: number; isBest?: boolean;
};

/** Seasonal-naive: predict month M of year Y = value at same month of Y-1 */
function seasonalNaive(rows: MonthRecord[]): MonthRecord | null {
	if (rows.length < 13) return rows[rows.length - 1] ?? null;
	const last = rows[rows.length - 1];
	const nextMonth = last.month === 12 ? 1 : last.month + 1;
	const nextYear = last.month === 12 ? last.year + 1 : last.year;
	const same = rows.filter((r) => r.month === nextMonth).slice(-2);
	if (!same.length) return last;
	const avg = (k: keyof MonthRecord) =>
		same.reduce((a, r) => a + (r[k] as number), 0) / same.length;
	return {
		...last,
		year: nextYear,
		month: nextMonth,
		demand: avg("demand"),
		genClean: avg("genClean"),
		genFossil: avg("genFossil"),
		emitFossil: avg("emitFossil"),
		emitClean: avg("emitClean"),
	};
}

function computePolicy(base: MonthRecord, cleanDelta: number, fossilDelta: number):
	Omit<PolicyRow, "id" | "name" | "description" | "status"> {
	const newClean = base.genClean * (1 + cleanDelta);
	const newFossil = base.genFossil * (1 + fossilDelta);
	const fossilEF = base.genFossil > 0 ? base.emitFossil / base.genFossil : 0;
	const genMW = Math.round((newClean + newFossil) * TWH_TO_MW);
	const demandMW = Math.round(base.demand * TWH_TO_MW);
	const co2Kt = Math.round(newFossil * fossilEF * 1000);
	const baseCo2Kt = Math.round(base.genFossil * fossilEF * 1000);
	const surplus = Math.round((newClean + newFossil - base.demand) * TWH_TO_MW);
	const cleanRatio = newClean + newFossil > 0 ? Math.round((newClean / (newClean + newFossil)) * 100) : 0;
	return {
		demand: demandMW, generation: genMW, co2: co2Kt, surplus, cleanRatio,
		co2Delta: baseCo2Kt > 0 ? Math.round(((co2Kt - baseCo2Kt) / baseCo2Kt) * 100) : 0,
	};
}

export default function OverviewPage() {
	const [rows, setRows] = useState<MonthRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		loadCountriesData().then((data) => {
			setRows(getThailandRows(data));
			setIsLoading(false);
		});
	}, []);

	// === Backtest seasonal-naive on historical data ===
	const backtest = useMemo(() => {
		if (rows.length < 13) return null;
		const preds: number[] = [], acts: number[] = [];
		for (let i = 12; i < rows.length; i++) {
			preds.push(rows[i - 12].demand);
			acts.push(rows[i].demand);
		}
		return forecastAccuracy(preds, acts);
	}, [rows]);

	// === Demand trend ===
	const trend = useMemo(() => {
		if (rows.length < 12) return null;
		const x = rows.map((_, i) => i);
		const y = rows.map((r) => r.demand);
		return linearRegression(x, y);
	}, [rows]);

	const last6 = rows.slice(-6);
	const nextBase = rows.length ? seasonalNaive(rows) : null;

	const forecastData: ForecastRow[] = [
		...last6.map((r) => ({
			month: monthLabel(r.month),
			demand: Math.round(r.demand * TWH_TO_MW),
			generation: Math.round((r.genClean + r.genFossil) * TWH_TO_MW),
			co2: Math.round(r.emitFossil * 1000),
			isForecast: false,
		})),
		...(nextBase ? [{
			month: `${monthLabel(nextBase.month)}*`,
			demand: Math.round(nextBase.demand * TWH_TO_MW),
			generation: Math.round((nextBase.genClean + nextBase.genFossil) * TWH_TO_MW),
			co2: Math.round(nextBase.emitFossil * 1000),
			isForecast: true,
		}] : []),
	];

	const nextPrediction = nextBase ? {
		demand: Math.round(nextBase.demand * TWH_TO_MW),
		generation: Math.round((nextBase.genClean + nextBase.genFossil) * TWH_TO_MW),
		co2: Math.round(nextBase.emitFossil * 1000),
		surplus: Math.round((nextBase.genClean + nextBase.genFossil - nextBase.demand) * TWH_TO_MW),
	} : { demand: 0, generation: 0, co2: 0, surplus: 0 };

	// Forecast ±1 RMSE in MW
	const demandCi = backtest ? Math.round(backtest.rmse * TWH_TO_MW) : 0;

	const policyData: PolicyRow[] = nextBase ? [
		{
			id: "A", name: "Policy A: Balanced Transition",
			description: "เพิ่มพลังงานสะอาด 20% ลดฟอสซิล 10% — เปลี่ยนผ่านแบบค่อยเป็นค่อยไป",
			status: "Feasible",
			...computePolicy(nextBase, 0.20, -0.10),
		},
		{
			id: "B", name: "Policy B: Aggressive Clean Expansion",
			description: "เพิ่มพลังงานสะอาด 50% ลดฟอสซิล 25% — มุ่งลด CO2 สูงสุด",
			status: "Feasible", isBest: true,
			...computePolicy(nextBase, 0.50, -0.25),
		},
		{
			id: "C", name: "Policy C: Reliability First",
			description: "เพิ่มพลังงานสะอาด 5% คงฟอสซิลเดิม — เน้นความมั่นคงระบบ",
			status: "Feasible",
			...computePolicy(nextBase, 0.05, 0),
		},
	] : [];

	const bestPolicy = policyData.find((p) => p.isBest) ?? policyData[0];

	const kpis = [
		{ title: "Predicted Demand", value: nextPrediction.demand, unit: "MW", ci: demandCi,
			icon: <Zap className="h-6 w-6 text-blue-500" />, color: "border-blue-500 bg-blue-50" },
		{ title: "Predicted Generation", value: nextPrediction.generation, unit: "MW", ci: 0,
			icon: <Factory className="h-6 w-6 text-emerald-500" />, color: "border-emerald-500 bg-emerald-50" },
		{ title: "Predicted CO2", value: nextPrediction.co2, unit: "kt", ci: 0,
			icon: <CloudFog className="h-6 w-6 text-rose-500" />, color: "border-rose-500 bg-rose-50" },
		{ title: "Net Energy Surplus", value: nextPrediction.surplus, unit: "MW", ci: 0,
			icon: <BatteryCharging className="h-6 w-6 text-amber-500" />, color: "border-amber-500 bg-amber-50" },
	] as const;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
					<p className="mt-1 text-slate-500">
						ภาพรวมการพยากรณ์พลังงานของประเทศไทยจากข้อมูล Ember 2020–2024
						{nextBase && ` (forecast: ${monthLabel(nextBase.month)} ${nextBase.year})`}
					</p>
				</div>
			</div>

			{/* Model accuracy strip */}
			{backtest && trend && (
				<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
				            className="flex flex-wrap items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm">
					<div className="flex items-center gap-2">
						<FlaskConical className="h-4 w-4 text-indigo-600" />
						<span className="font-semibold text-indigo-900">Model validation:</span>
					</div>
					<Pill label="MAPE" value={`${backtest.mape.toFixed(2)}%`} tone="good" />
					<Pill label="RMSE" value={`${backtest.rmse.toFixed(2)} TWh`} />
					<Pill label="MAE" value={`${backtest.mae.toFixed(2)} TWh`} />
					<Pill label="Demand trend" value={`${(trend.slope * 12).toFixed(3)} TWh/yr`}
					      tone={trend.pValue < 0.05 ? "good" : "neutral"} />
					<Pill label="Trend p" value={trend.pValue < 0.001 ? "<0.001" : trend.pValue.toFixed(3)}
					      tone={trend.pValue < 0.05 ? "good" : "neutral"} />
					<Link href="/hypothesis" className="ml-auto text-xs font-semibold text-indigo-700 hover:underline">
						See full hypothesis tests →
					</Link>
				</motion.div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi, idx) => (
					<motion.div key={kpi.title}
					            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
					            className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
						<div>
							<p className="text-sm font-medium text-slate-500">{kpi.title}</p>
							<div className="mt-2 flex items-baseline space-x-2">
								<span className="text-2xl font-bold text-slate-900">
									{isLoading ? "..." : kpi.value.toLocaleString()}
								</span>
								<span className="text-sm text-slate-500">{kpi.unit}</span>
							</div>
							{kpi.ci > 0 && <p className="mt-1 text-xs text-slate-400">±{kpi.ci.toLocaleString()} {kpi.unit} (1σ)</p>}
						</div>
						<div className={`rounded-full border p-3 ${kpi.color}`}>{kpi.icon}</div>
					</motion.div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
				            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
							<TrendingUp className="h-5 w-5 text-indigo-500" />
							Energy &amp; CO2 — Last 6 Months + Forecast
						</h2>
						<div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">Thailand</div>
					</div>
					<div className="h-72 w-full">
						{forecastData.length === 0 ? (
							<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading real data...</div>
						) : (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
											<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
											<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
									<XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
									<YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
									<YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
									<Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
									         labelStyle={{ fontWeight: "bold", color: "#0f172a" }} />
									<Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
									<Area yAxisId="left" type="monotone" dataKey="generation" name="Generation (MW)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGen)" />
									<Area yAxisId="left" type="monotone" dataKey="demand" name="Demand (MW)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
									<Area yAxisId="right" type="monotone" dataKey="co2" name="CO2 (kt)" stroke="#f43f5e" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
								</AreaChart>
							</ResponsiveContainer>
						)}
					</div>
					<p className="mt-2 text-xs text-slate-500">
						* Forecasted value (seasonal-naive). Historical MAPE: {backtest ? backtest.mape.toFixed(2) : "–"}%
					</p>
				</motion.div>

				<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
				            className="relative overflow-hidden rounded-2xl bg-emerald-900 p-6 text-white shadow-md">
					<div className="pointer-events-none absolute right-0 top-0 p-4 opacity-10">
						<Leaf className="h-32 w-32" />
					</div>
					<div className="mb-4 flex items-center gap-2">
						<div className="rounded-full bg-emerald-500/20 p-2 backdrop-blur-sm">
							<CheckCircle className="h-5 w-5 text-emerald-400" />
						</div>
						<h2 className="text-lg font-bold">Best Policy Summary</h2>
					</div>
					<h3 className="mb-2 text-2xl font-bold text-emerald-300">{bestPolicy?.name ?? "Loading..."}</h3>
					<p className="mb-6 text-sm leading-relaxed text-emerald-100/80">
						คำนวณจาก baseline พยากรณ์เดือนถัดไปของประเทศไทย เปรียบเทียบ 3 สถานการณ์นโยบาย
					</p>
					{bestPolicy && (
						<div className="relative z-10 space-y-4">
							<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
								<div className="flex items-center gap-2">
									<CloudFog className="h-4 w-4 text-emerald-400" />
									<span className="text-sm font-medium text-emerald-100">CO2 Δ vs. Baseline</span>
								</div>
								<span className="font-bold text-emerald-400">{bestPolicy.co2Delta}%</span>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
								<div className="flex items-center gap-2">
									<BatteryCharging className="h-4 w-4 text-emerald-400" />
									<span className="text-sm font-medium text-emerald-100">Energy Surplus</span>
								</div>
								<span className="font-bold text-emerald-400">{bestPolicy.surplus.toLocaleString()} MW</span>
							</div>
							<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
								<div className="flex items-center gap-2">
									<Droplet className="h-4 w-4 text-emerald-400" />
									<span className="text-sm font-medium text-emerald-100">Clean Ratio</span>
								</div>
								<span className="font-bold text-emerald-400">{bestPolicy.cleanRatio}%</span>
							</div>
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}

function Pill({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "neutral" }) {
	const bg = tone === "good" ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-700";
	return (
		<div className={`flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs ${bg}`}>
			<span className="font-medium opacity-70">{label}:</span>
			<span className="font-bold">{value}</span>
		</div>
	);
}
