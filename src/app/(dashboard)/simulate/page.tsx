"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Activity, Settings, ShieldCheck } from "lucide-react";

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

const TWH_TO_MW = 1388.89;

const defaultParams: Params = {
	cleanGen: 20,
	fossilGen: -10,
	netImport: 0,
	efficiency: 5,
	gdpChange: 2,
};

/*
	Replace this block later with real baseline values
	from your selected country / year / month.
*/
const baselineInputs: BaselineInputs = {
	demandTwh: 2.7,
	genCleanTwh: 2.506,
	genFossilTwh: 0.23,
	netImportsTwh: 0,
	emitFossilMtco2: 0.138,
	gdpElasticity: 0.6,
};

const accentClassMap = {
	emerald: "accent-emerald-500",
	rose: "accent-rose-500",
	blue: "accent-blue-500",
	indigo: "accent-indigo-500",
	amber: "accent-amber-500",
} as const;

type AccentColor = keyof typeof accentClassMap;

type SliderControlProps = {
	label: string;
	value: number;
	min: number;
	max: number;
	unit: string;
	paramKey: keyof Params;
	color: AccentColor;
	onChange: (key: keyof Params, value: number) => void;
};

function calculateScenario(
	baseline: BaselineInputs,
	params: Params,
): Results {
	const newCleanGenTwh =
		baseline.genCleanTwh * (1 + params.cleanGen / 100);

	const newFossilGenTwh =
		baseline.genFossilTwh * (1 + params.fossilGen / 100);

	const newImportTwh =
		baseline.netImportsTwh * (1 + params.netImport / 100);

	const newDemandTwh =
		baseline.demandTwh *
		(1 - params.efficiency / 100) *
		(1 + (params.gdpChange * baseline.gdpElasticity) / 100);

	const fossilEF =
		baseline.genFossilTwh > 0
			? baseline.emitFossilMtco2 / baseline.genFossilTwh
			: 0;

	const generationMw = Math.round(
		(newCleanGenTwh + newFossilGenTwh) * TWH_TO_MW,
	);

	const demandMw = Math.round(newDemandTwh * TWH_TO_MW);

	const co2Kt = Math.round(newFossilGenTwh * fossilEF * 1000);

	const surplusMw = Math.round(
		(newCleanGenTwh + newFossilGenTwh + newImportTwh - newDemandTwh) *
		TWH_TO_MW,
	);

	return {
		demand: demandMw,
		generation: generationMw,
		co2: co2Kt,
		surplus: surplusMw,
	};
}

export default function ScenarioSimulatorPage() {
	const [params, setParams] = useState<Params>(defaultParams);

	const baselineResults = useMemo(
		() =>
			calculateScenario(baselineInputs, {
				cleanGen: 0,
				fossilGen: 0,
				netImport: 0,
				efficiency: 0,
				gdpChange: 0,
			}),
		[],
	);

	const results = useMemo(
		() => calculateScenario(baselineInputs, params),
		[params],
	);

	const updateParam = (key: keyof Params, value: number) => {
		setParams((current) => ({ ...current, [key]: value }));
	};

	const handleReset = () => {
		setParams(defaultParams);
	};

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">
					Scenario Simulator
				</h1>
				<p className="mt-1 text-slate-500">
					ปรับค่าพารามิเตอร์ แล้วระบบจะคำนวณผลลัพธ์ใหม่ทันที
				</p>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5"
				>
					<div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
						<Settings className="h-5 w-5 text-slate-600" />
						<h2 className="text-lg font-bold text-slate-900">
							Policy Knobs
						</h2>
					</div>

					<div className="space-y-2">
						<SliderControl
							label="Clean Gen Change"
							value={params.cleanGen}
							min={-50}
							max={100}
							unit="%"
							paramKey="cleanGen"
							color="emerald"
							onChange={updateParam}
						/>
						<SliderControl
							label="Fossil Gen Change"
							value={params.fossilGen}
							min={-100}
							max={50}
							unit="%"
							paramKey="fossilGen"
							color="rose"
							onChange={updateParam}
						/>
						<SliderControl
							label="Net Import Change"
							value={params.netImport}
							min={-50}
							max={100}
							unit="%"
							paramKey="netImport"
							color="blue"
							onChange={updateParam}
						/>
						<SliderControl
							label="Efficiency Saving"
							value={params.efficiency}
							min={0}
							max={30}
							unit="%"
							paramKey="efficiency"
							color="indigo"
							onChange={updateParam}
						/>
						<SliderControl
							label="GDP Change (Impact Demand)"
							value={params.gdpChange}
							min={-10}
							max={10}
							unit="%"
							paramKey="gdpChange"
							color="amber"
							onChange={updateParam}
						/>
					</div>

					<div className="mt-8 flex gap-4">
						<button
							onClick={handleReset}
							className="rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-200"
						>
							Reset
						</button>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					className="space-y-6 lg:col-span-7"
				>
					<div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-xl">
						<div className="mb-8 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Activity className="h-5 w-5 text-indigo-400" />
								<h2 className="text-xl font-bold">
									Simulation Results
								</h2>
							</div>
							<span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-xs text-indigo-300">
								<ShieldCheck className="h-3 w-3" />
								Live update
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<ResultCard
								title="Simulated Demand"
								value={results.demand}
								unit="MW"
								baseValue={baselineResults.demand}
								color="text-blue-400"
							/>
							<ResultCard
								title="Simulated Generation"
								value={results.generation}
								unit="MW"
								baseValue={baselineResults.generation}
								color="text-emerald-400"
							/>
							<ResultCard
								title="Simulated CO2"
								value={results.co2}
								unit="kt"
								baseValue={baselineResults.co2}
								color="text-rose-400"
							/>
							<ResultCard
								title="Energy Balance (Surplus)"
								value={results.surplus}
								unit="MW"
								baseValue={baselineResults.surplus}
								color="text-amber-400"
								sign
							/>
						</div>
					</div>

					<div className="rounded-2xl border border-slate-200 bg-white p-6">
						<h3 className="mb-2 font-bold text-slate-900">Insight</h3>
						<p className="text-sm leading-relaxed text-slate-600">
							ระบบคำนวณจาก baseline จริงในหน่วย TWh แล้วแปลงเป็น MW
							ด้วยตัวคูณ 1388.89 สำหรับการแสดงผล ส่วน CO2 คำนวณจาก
							fossil generation เท่านั้น
							และค่า Energy Balance รวมผลของ Net Imports ด้วย
							{results.surplus < 0 && (
								<span className="ml-1 font-semibold text-rose-600">
									คำเตือน: ระบบอาจเผชิญกับภาวะไฟฟ้าขาดแคลน
								</span>
							)}
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	);
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
		<div className="mb-6">
			<div className="mb-2 flex items-end justify-between">
				<label className="text-sm font-medium text-slate-700">
					{label}
				</label>
				<div className="flex items-center gap-1">
					<input
						type="number"
						value={value}
						onChange={(event) =>
							onChange(
								paramKey,
								clampValue(Number(event.target.value)),
							)
						}
						className="w-16 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-right text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					/>
					<span className="text-sm font-medium text-slate-500">
						{unit}
					</span>
				</div>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={1}
				value={value}
				onChange={(event) =>
					onChange(paramKey, Number(event.target.value))
				}
				className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 ${accentClassMap[color]}`}
			/>
			<div className="mt-1 flex justify-between text-xs text-slate-400">
				<span>
					{min}
					{unit}
				</span>
				<span>
					{max}
					{unit}
				</span>
			</div>
		</div>
	);
}

type ResultCardProps = {
	title: string;
	value: number;
	unit: string;
	baseValue: number;
	color: string;
	sign?: boolean;
};

function ResultCard({
	                    title,
	                    value,
	                    unit,
	                    baseValue,
	                    color,
	                    sign = false,
                    }: ResultCardProps) {
	const diff = value - baseValue;
	const showDiff = diff !== 0;

	return (
		<div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
			<p className="mb-2 text-xs font-medium text-slate-400">{title}</p>
			<div className="flex items-end gap-2">
				<div className={`text-3xl font-bold ${color}`}>
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						key={value}
					>
						{sign && value > 0 ? "+" : ""}
						{value.toLocaleString()}
					</motion.span>
				</div>
				<span className="mb-1 text-sm text-slate-500">{unit}</span>
			</div>

			<div className="mt-2 h-5">
				{showDiff && (
					<motion.div
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						className={`text-xs font-medium ${
							diff > 0
								? title.includes("CO2")
									? "text-rose-400"
									: "text-emerald-400"
								: title.includes("CO2")
									? "text-emerald-400"
									: "text-slate-400"
						}`}
					>
						{diff > 0 ? "▲ +" : "▼ "}
						{Math.abs(diff).toLocaleString()} vs Baseline
					</motion.div>
				)}
			</div>
		</div>
	);
}