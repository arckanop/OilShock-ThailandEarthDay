"use client";

import {useEffect, useMemo, useState, type ChangeEvent} from "react";
import Link from "next/link";
import {motion} from "motion/react";
import {Activity, Database, FlaskConical, Settings, ShieldCheck} from "lucide-react";

import {loadCountriesData, getThailandRows} from "@/lib/dataStore";
import {linearRegression, formatP} from "@/lib/stats";
import type {MonthRecord, SimulatorBaseline, CountriesData} from "@/lib/types";

type Params = {
	cleanGen: number;
	fossilGen: number;
	netImport: number;
	efficiency: number;
	gdpChange: number;
};

type Results = {
	demand: number;
	generation: number;
	co2: number;
	surplus: number;
};

type BaselineInputs = {
	demandTwh: number;
	genCleanTwh: number;
	genFossilTwh: number;
	netImportsTwh: number;
	emitFossilMtco2: number;
	gdpElasticity: number;
};

type BaselineMeta = { country: string; year: number | string; month: string };

const TWH_TO_MW = 1388.89;

const defaultParams: Params = {
	cleanGen: 20, fossilGen: -10, netImport: 0, efficiency: 5, gdpChange: 2,
};

function thailandLatestBaseline(rows: MonthRecord[]): { base: BaselineInputs; meta: BaselineMeta } | null {
	if (!rows.length) return null;
	const last = rows[rows.length - 1];
	return {
		base: {
			demandTwh: last.demand,
			genCleanTwh: last.genClean,
			genFossilTwh: last.genFossil,
			netImportsTwh: last.netImports / 12,
			emitFossilMtco2: last.emitFossil,
			gdpElasticity: 0.6,
		},
		meta: {country: "Thailand", year: last.year, month: String(last.month)},
	};
}

const accentClassMap = {
	emerald: "accent-emerald-500",
	rose: "accent-rose-500",
	blue: "accent-blue-500",
	indigo: "accent-indigo-500",
	amber: "accent-amber-500",
} as const;

type AccentColor = keyof typeof accentClassMap;

type SliderControlProps = {
	label: string; value: number; min: number; max: number;
	unit: string; paramKey: keyof Params; color: AccentColor;
	onChange: (key: keyof Params, value: number) => void;
};

function calculateScenario(baseline: BaselineInputs, params: Params): Results {
	const newCleanGenTwh = baseline.genCleanTwh * (1 + params.cleanGen / 100);
	const newFossilGenTwh = baseline.genFossilTwh * (1 + params.fossilGen / 100);
	const newImportTwh = baseline.netImportsTwh * (1 + params.netImport / 100);
	const newDemandTwh = baseline.demandTwh * (1 - params.efficiency / 100)
		* (1 + (params.gdpChange * baseline.gdpElasticity) / 100);
	const fossilEF = baseline.genFossilTwh > 0 ? baseline.emitFossilMtco2 / baseline.genFossilTwh : 0;
	return {
		demand: Math.round(newDemandTwh * TWH_TO_MW),
		generation: Math.round((newCleanGenTwh + newFossilGenTwh) * TWH_TO_MW),
		co2: Math.round(newFossilGenTwh * fossilEF * 1000),
		surplus: Math.round((newCleanGenTwh + newFossilGenTwh + newImportTwh - newDemandTwh) * TWH_TO_MW),
	};
}

function SliderControl({
	                       label,
	                       value,
	                       min,
	                       max,
	                       unit,
	                       paramKey,
	                       color,
	                       onChange,
                       }: SliderControlProps) {
	const clampValue = (nextValue: number) =>
		Math.min(max, Math.max(min, nextValue));

	return (
		<div className="space-y-2">
			<div className="mb-2 flex items-center justify-between gap-3">
				<label className="text-sm font-medium text-slate-700">{label}</label>

				<div className="flex items-center gap-1.5">
					<input
						type="number"
						min={min}
						max={max}
						step={1}
						value={value}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							onChange(paramKey, clampValue(Number(e.target.value)))
						}
						className="w-15 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-right text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
					/>
					<span className="text-sm font-medium text-slate-500">{unit}</span>
				</div>
			</div>

			<input
				type="range"
				min={min}
				max={max}
				step={1}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) =>
					onChange(paramKey, Number(e.target.value))
				}
				className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 ${accentClassMap[color]}`}
			/>

			<div className="flex justify-between text-xs text-slate-400">
				<span>{min}{unit}</span>
				<span>{max}{unit}</span>
			</div>
		</div>
	);
}

export default function ScenarioSimulatorPage() {
	const [params, setParams] = useState<Params>(defaultParams);
	const [baseline, setBaseline] = useState<BaselineInputs | null>(null);
	const [meta, setMeta] = useState<BaselineMeta | null>(null);
	const [source, setSource] = useState<"user" | "default">("default");
	const [allData, setAllData] = useState<CountriesData>({});

	useEffect(() => {
		loadCountriesData().then((data) => {
			setAllData(data);
			// Priority 1: user-chosen baseline
			const saved = sessionStorage.getItem("simulatorBaseline");
			if (saved) {
				try {
					const parsed = JSON.parse(saved) as SimulatorBaseline;
					setBaseline({
						demandTwh: parsed.demandTwh,
						genCleanTwh: parsed.genCleanTwh,
						genFossilTwh: parsed.genFossilTwh,
						netImportsTwh: parsed.netImportsTwh,
						emitFossilMtco2: parsed.emitFossilMtco2,
						gdpElasticity: parsed.gdpElasticity,
					});
					setMeta({country: parsed.country, year: parsed.year, month: parsed.month});
					setSource("user");
					return;
				} catch { /* fall through */
				}
			}
			// Priority 2: Thailand latest month
			const result = thailandLatestBaseline(getThailandRows(data));
			if (result) {
				setBaseline(result.base);
				setMeta(result.meta);
				setSource("default");
			}
		});
	}, []);

	// Compute statistical basis: EF regression from the baseline country's full history
	const efRegression = useMemo(() => {
		if (!meta || !allData[meta.country]) return null;
		const rows = allData[meta.country];
		const x = rows.map((r) => r.genFossil);
		const y = rows.map((r) => r.emitFossil);
		return linearRegression(x, y);
	}, [meta, allData]);

	const results = useMemo(() => baseline ? calculateScenario(baseline, params) : null, [baseline, params]);

	const handleParamChange = (key: keyof Params, value: number) => {
		setParams((prev) => ({...prev, [key]: value}));
	};

	const handleReset = () => setParams(defaultParams);

	const handleClearBaseline = () => {
		sessionStorage.removeItem("simulatorBaseline");
		window.location.reload();
	};

	if (!baseline || !results || !meta) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center text-slate-500">Loading baseline from real
				data...</div>
		);
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Scenario Simulator</h1>
					<p className="mt-1 text-slate-500">ปรับค่าพารามิเตอร์เพื่อจำลองสถานการณ์พลังงาน</p>
				</div>
				<div
					className={`rounded-lg border px-4 py-2 text-sm ${source === "user" ? "border-[#00FF88] bg-[#00FF88]/10 text-slate-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
					<div className="flex items-center gap-2">
						<Database className="h-4 w-4"/>
						<span className="font-semibold">Baseline:</span>
						<span>{meta.country} · {meta.month} {meta.year}</span>
						{source === "user" && (
							<button onClick={handleClearBaseline}
							        className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-300">Clear</button>
						)}
					</div>
					{source === "default" && (
						<Link href="/real-data" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
							→ Select a different country/month in Real Data
						</Link>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
				<motion.div initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}}
				            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
					<h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
						<Settings className="h-5 w-5 text-indigo-500"/>
						Adjust Parameters
					</h2>
					<div className="space-y-6">
						<SliderControl label="Clean Generation Change" value={params.cleanGen} min={-50} max={100}
						               unit="%" paramKey="cleanGen" color="emerald" onChange={handleParamChange}/>
						<SliderControl label="Fossil Generation Change" value={params.fossilGen} min={-100} max={50}
						               unit="%" paramKey="fossilGen" color="rose" onChange={handleParamChange}/>
						<SliderControl label="Net Imports Change" value={params.netImport} min={-100} max={100} unit="%"
						               paramKey="netImport" color="blue" onChange={handleParamChange}/>
						<SliderControl label="Efficiency Improvement" value={params.efficiency} min={0} max={30}
						               unit="%" paramKey="efficiency" color="indigo" onChange={handleParamChange}/>
						<SliderControl label="GDP Change" value={params.gdpChange} min={-5} max={10} unit="%"
						               paramKey="gdpChange" color="amber" onChange={handleParamChange}/>
					</div>
					<button onClick={handleReset}
					        className="mt-6 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
						Reset to Defaults
					</button>
				</motion.div>

				<motion.div initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}}
				            className="space-y-4 lg:col-span-3">
					<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
							<Activity className="h-5 w-5 text-emerald-500"/>
							Simulation Results
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<ResultCard label="Demand" value={results.demand} unit="MW" color="text-blue-600"/>
							<ResultCard label="Generation" value={results.generation} unit="MW"
							            color="text-emerald-600"/>
							<ResultCard label="CO2 Emissions" value={results.co2} unit="kt" color="text-rose-600"/>
							<ResultCard label="Net Surplus" value={results.surplus} unit="MW"
							            color={results.surplus >= 0 ? "text-emerald-600" : "text-amber-600"}/>
						</div>
					</div>

					{results.surplus < 0 && (
						<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
							คำเตือน: ระบบอาจเผชิญกับภาวะไฟฟ้าขาดแคลน
						</div>
					)}

					<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
						<div className="flex items-start gap-3">
							<ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"/>
							<div className="text-sm text-emerald-900">
								<p className="font-semibold">Baseline values (real data)</p>
								<div className="mt-2 grid grid-cols-2 gap-2 text-xs text-emerald-800 sm:grid-cols-3">
									<div>Demand: <b>{baseline.demandTwh.toFixed(2)}</b> TWh</div>
									<div>Clean Gen: <b>{baseline.genCleanTwh.toFixed(2)}</b> TWh</div>
									<div>Fossil Gen: <b>{baseline.genFossilTwh.toFixed(2)}</b> TWh</div>
									<div>Net Imports: <b>{baseline.netImportsTwh.toFixed(2)}</b> TWh/mo</div>
									<div>CO2 Fossil: <b>{baseline.emitFossilMtco2.toFixed(2)}</b> MtCO2</div>
									<div>GDP Elasticity: <b>{baseline.gdpElasticity}</b></div>
								</div>
							</div>
						</div>
					</div>

					{/* Statistical Basis — shows EF comes from a real regression */}
					{efRegression && (
						<div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
							<div className="flex items-start gap-3">
								<FlaskConical className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600"/>
								<div className="flex-1 text-sm">
									<div className="flex items-center justify-between">
										<p className="font-semibold text-indigo-900">Statistical basis: CO₂ emission
											factor</p>
										<Link href="/hypothesis" className="text-xs text-indigo-600 hover:underline">Full
											test →</Link>
									</div>
									<p className="mt-1 text-xs text-indigo-800">
										Regression of {meta?.country} monthly data: <b>emitFossil ~ β × genFossil +
										α</b>
									</p>
									<div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
										<div className="rounded border border-indigo-200 bg-white px-2 py-1.5">
											<div className="text-indigo-600">EF (β)</div>
											<div
												className="font-mono font-bold text-indigo-900">{efRegression.slope.toFixed(3)}</div>
										</div>
										<div className="rounded border border-indigo-200 bg-white px-2 py-1.5">
											<div className="text-indigo-600">R²</div>
											<div
												className="font-mono font-bold text-indigo-900">{efRegression.rSquared.toFixed(3)}</div>
										</div>
										<div className="rounded border border-indigo-200 bg-white px-2 py-1.5">
											<div className="text-indigo-600">95% CI β</div>
											<div
												className="font-mono font-bold text-indigo-900">[{efRegression.ci95SlopeLow.toFixed(2)}, {efRegression.ci95SlopeHigh.toFixed(2)}]
											</div>
										</div>
										<div className="rounded border border-indigo-200 bg-white px-2 py-1.5">
											<div className="text-indigo-600">p-value</div>
											<div
												className="font-mono font-bold text-indigo-900">{formatP(efRegression.pValue)}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}

function ResultCard({label, value, unit, color}: { label: string; value: number; unit: string; color: string }) {
	return (
		<div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
			<p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
			<div className="mt-2 flex items-baseline gap-1.5">
				<span className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</span>
				<span className="text-sm text-slate-500">{unit}</span>
			</div>
		</div>
	);
}
