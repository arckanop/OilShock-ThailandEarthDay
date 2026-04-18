"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
	AlertCircle, BarChart3, CheckCircle2, FlaskConical, LineChart as LineIcon, XCircle,
} from "lucide-react";
import {
	CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter,
	Tooltip, XAxis, YAxis, Line, ComposedChart, BarChart, Bar, Cell,
} from "recharts";

import { loadCountriesData, getThailandRows } from "@/lib/dataStore";
import { linearRegression, formatP, sigStars } from "@/lib/stats";
import type { CountriesData, MonthRecord } from "@/lib/types";

import {StatBadge} from "@/components/StatBadge";

type CountryStat = { country: string; r: number; p: number; n: number; significant: boolean };

const Hypothesis = () => {
	const [thRows, setThRows] = useState<MonthRecord[]>([]);
	const [allData, setAllData] = useState<CountriesData>({});
	const [hypoData, setHypoData] = useState<CountryStat[]>([]);

	useEffect(() => {
		loadCountriesData().then((d) => {
			setAllData(d);
			setThRows(getThailandRows(d));
		});
		fetch("/data/hypothesis.json").then((r) => r.json()).then(setHypoData);
	}, []);

	const h1 = useMemo(() => {
		if (!thRows.length) return null;
		const x = thRows.map((r) => r.cleanRatio);
		// CO2 intensity = emitFossil / (genClean + genFossil) in tCO2/MWh-ish
		const y = thRows.map((r) => {
			const totalGen = r.genClean + r.genFossil;
			return totalGen > 0 ? r.emitFossil / totalGen : 0;
		});
		const reg = linearRegression(x, y);
		const scatter = thRows.map((r, i) => ({
			x: Number((x[i] * 100).toFixed(2)),
			y: Number(y[i].toFixed(4)),
			label: `${r.year}-${String(r.month).padStart(2, "0")}`,
		}));
		// regression line
		const xMin = Math.min(...x), xMax = Math.max(...x);
		const line = [
			{ x: Number((xMin * 100).toFixed(2)), yHat: reg.intercept + reg.slope * xMin },
			{ x: Number((xMax * 100).toFixed(2)), yHat: reg.intercept + reg.slope * xMax },
		];
		return { reg, scatter, line };
	}, [thRows]);

	const h2 = useMemo(() => {
		if (!thRows.length) return null;
		const x = thRows.map((r) => r.genFossil);
		const y = thRows.map((r) => r.emitFossil);
		const reg = linearRegression(x, y);
		const scatter = thRows.map((r, i) => ({
			x: Number(x[i].toFixed(3)), y: Number(y[i].toFixed(3)),
			label: `${r.year}-${String(r.month).padStart(2, "0")}`,
		}));
		const xMin = Math.min(...x), xMax = Math.max(...x);
		const line = [
			{ x: Number(xMin.toFixed(3)), yHat: reg.intercept + reg.slope * xMin },
			{ x: Number(xMax.toFixed(3)), yHat: reg.intercept + reg.slope * xMax },
		];
		return { reg, scatter, line };
	}, [thRows]);

	const sortedH1Countries = useMemo(() => {
		if (!hypoData.length) return [];
		return [...hypoData].sort((a, b) => a.r - b.r);
	}, [hypoData]);

	const negCount = hypoData.filter((c) => c.r < 0).length;
	const posCount = hypoData.filter((c) => c.r > 0).length;
	const sigNegCount = hypoData.filter((c) => c.r < 0 && c.p < 0.05).length;

	const h1Verdict = h1 ? (h1.reg.pValue < 0.05 ? (h1.reg.r < 0 ? "support" : "contradict") : "fail") : null;

	return (
		<div className="mx-auto max-w-7xl space-y-8">
			<div>
				<h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
					<FlaskConical className="h-8 w-8 text-purple-600" />
					Hypothesis &amp; Statistical Tests
				</h1>
				<p className="mt-1 text-slate-500">
					การตั้งสมมติฐานและทดสอบทางสถิติบนข้อมูลจริงจาก Ember Electricity Data (2020–2024, 72 ประเทศ)
				</p>
			</div>

			{/* === H1 CARD === */}
			<motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
			                className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
				<div className="mb-4 flex items-start gap-3">
					<div className="rounded-lg bg-purple-100 p-2"><FlaskConical className="h-5 w-5 text-purple-600" /></div>
					<div className="flex-1">
						<h2 className="text-xl font-bold text-slate-900">H₁: Clean Energy Ratio → CO₂ Intensity</h2>
						<p className="mt-1 text-sm text-slate-500">
							การเพิ่มสัดส่วนพลังงานสะอาดจะทำให้ CO₂ intensity (ตันต่อหน่วยไฟฟ้า) ลดลง
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">H₀ (null hypothesis)</p>
						<p className="mt-2 text-sm text-slate-700">ไม่มีความสัมพันธ์ระหว่าง clean ratio กับ CO₂ intensity<br />
							<span className="font-mono text-xs text-slate-500">β = 0</span></p>
					</div>
					<div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wider text-purple-600">H₁ (alt. hypothesis)</p>
						<p className="mt-2 text-sm text-slate-700">Clean ratio มีผลเชิงลบต่อ CO₂ intensity<br />
							<span className="font-mono text-xs text-slate-500">β &lt; 0</span></p>
					</div>
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test</p>
						<p className="mt-2 text-sm text-slate-700">Pearson correlation<br />+ t-test (two-sided, α = 0.05)</p>
					</div>
				</div>

				{h1 && (
					<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div className="rounded-xl border border-slate-200 bg-white p-4">
							<p className="mb-4 text-sm font-semibold text-slate-700">
								Scatter — Thailand (n = {h1.reg.n} months)
							</p>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
										<XAxis type="number" dataKey="x" domain={["dataMin-1", "dataMax+1"]}
										       tick={{ fontSize: 11, fill: "#64748b" }}
										       label={{ value: "Clean ratio (%)", position: "bottom", offset: 0, style: { fontSize: 11, fill: "#64748b" } }} />
										<YAxis type="number" dataKey="y" domain={["auto", "auto"]}
										       tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: number) => v.toFixed(3)}
										       label={{ value: "CO₂ intensity", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#64748b" } }} />
										<Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
										         formatter={(v: number | string, n: string) => [Number(v).toFixed(4), n === "y" ? "CO₂ intensity" : n === "yHat" ? "Fitted line" : "Clean %"]} />
										<Scatter name="Thailand months" data={h1.scatter} fill="#9333ea" />
										<Line data={h1.line} type="linear" dataKey="yHat" stroke="#9333ea" strokeWidth={2} strokeDasharray="4 4" dot={false} />
									</ComposedChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="space-y-3">
							<StatBadge label="Pearson r" value={h1.reg.r.toFixed(4)} sig={sigStars(h1.reg.pValue)} />
							<StatBadge label="R²" value={h1.reg.rSquared.toFixed(4)} />
							<StatBadge label="Slope (β)" value={h1.reg.slope.toFixed(4)} />
							<StatBadge label="95% CI for β" value={`[${h1.reg.ci95SlopeLow.toFixed(3)}, ${h1.reg.ci95SlopeHigh.toFixed(3)}]`} />
							<StatBadge label="p-value" value={formatP(h1.reg.pValue)} />
							<StatBadge label="n (sample)" value={String(h1.reg.n)} />

							<div className={`rounded-lg p-3 text-sm ${
								h1Verdict === "support" ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
									: h1Verdict === "contradict" ? "border border-rose-300 bg-rose-50 text-rose-800"
										: "border border-amber-300 bg-amber-50 text-amber-800"
							}`}>
								<div className="flex items-start gap-2">
									{h1Verdict === "support" ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
										: h1Verdict === "contradict" ? <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
											: <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
									<div>
										<p className="font-bold">
											{h1Verdict === "support" ? "สนับสนุน H₁"
												: h1Verdict === "contradict" ? "ขัดแย้งกับ H₁"
													: "Fail to reject H₀"}
										</p>
										<p className="mt-1 text-xs">
											{h1Verdict === "fail" && `สำหรับประเทศไทย (n=${h1.reg.n}, 2020–2024) ไม่พบความสัมพันธ์ทางสถิติที่มีนัยสำคัญระหว่าง clean ratio กับ CO₂ intensity ที่ระดับ α = 0.05 — ซึ่งเป็น "New Assumption" ที่น่าสนใจ: การเพิ่ม clean energy เพียงอย่างเดียวไม่ได้ลด CO₂ intensity ของไทยโดยอัตโนมัติ`}
											{h1Verdict === "support" && "มีหลักฐานทางสถิติ ผลของ clean ratio ต่อ CO₂ intensity เป็นลบอย่างมีนัยสำคัญ"}
											{h1Verdict === "contradict" && "น่าแปลกใจ: สำหรับประเทศไทย ความสัมพันธ์เป็นบวก — อาจเกิดจากการขยาย capacity ทั้งสองฝั่งพร้อมกัน"}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Cross-country panel */}
				{hypoData.length > 0 && (
					<div className="mt-8">
						<h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
							<BarChart3 className="h-5 w-5 text-purple-600" />
							Cross-Country Generalization ({hypoData.length} ประเทศ)
						</h3>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">สนับสนุน H₁ (r &lt; 0)</p>
								<p className="mt-2 text-3xl font-bold text-emerald-600">{negCount} <span className="text-base font-normal text-emerald-700">/ {hypoData.length}</span></p>
								<p className="mt-1 text-xs text-emerald-700">มีนัยสำคัญ (p &lt; 0.05): <b>{sigNegCount}</b></p>
							</div>
							<div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-rose-700">ขัดแย้ง H₁ (r &gt; 0)</p>
								<p className="mt-2 text-3xl font-bold text-rose-600">{posCount} <span className="text-base font-normal text-rose-700">/ {hypoData.length}</span></p>
								<p className="mt-1 text-xs text-rose-700">ประเทศที่ clean ratio เพิ่ม แต่ CO₂ intensity ไม่ได้ลด</p>
							</div>
							<div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Finding</p>
								<p className="mt-2 text-sm text-amber-800">
									<b>{Math.round(posCount/hypoData.length*100)}%</b> ของประเทศ <b>ไม่ได้</b>แสดงผล clean → CO₂ ลดลง — การนโยบายต้องระวัง
								</p>
							</div>
						</div>

						<div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
							<p className="mb-2 text-sm font-semibold text-slate-700">Pearson r by country (sorted)</p>
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={sortedH1Countries.slice(0, 71).map((c) => ({ country: c.country, r: c.r, color: c.r < 0 ? "#10b981" : "#ef4444" }))}
									          margin={{ top: 5, right: 5, left: 0, bottom: 60 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
										<XAxis dataKey="country" interval={0} angle={-70} textAnchor="end" height={60} tick={{ fontSize: 9, fill: "#64748b" }} />
										<YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: "#64748b" }} />
										<Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
										         formatter={(v: number | string) => [Number(v).toFixed(3), "Pearson r"]} />
										<ReferenceLine y={0} stroke="#64748b" strokeWidth={1} />
										<Bar dataKey="r" radius={[2, 2, 0, 0]}>
											{sortedH1Countries.map((c, i) => (
												<Cell key={i} fill={c.r < 0 ? "#10b981" : "#ef4444"} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				)}
			</motion.section>

			{/* === H2 CARD: Fossil → CO2 (for simulator EF derivation) === */}
			<motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
			                className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
				<div className="mb-4 flex items-start gap-3">
					<div className="rounded-lg bg-indigo-100 p-2"><LineIcon className="h-5 w-5 text-indigo-600" /></div>
					<div className="flex-1">
						<h2 className="text-xl font-bold text-slate-900">H₂: Fossil Generation → Power-Sector CO₂ Emissions</h2>
						<p className="mt-1 text-sm text-slate-500">
							การผลิตไฟจากฟอสซิลทำให้เกิด CO₂ แบบเชิงเส้น (emission factor คงที่)
						</p>
					</div>
				</div>

				{h2 && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div className="rounded-xl border border-slate-200 bg-white p-4">
							<p className="mb-4 text-sm font-semibold text-slate-700">Scatter — Thailand (n = {h2.reg.n})</p>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
										<XAxis type="number" dataKey="x" domain={["dataMin", "dataMax"]}
										       tick={{ fontSize: 11, fill: "#64748b" }}
										       label={{ value: "Fossil generation (TWh)", position: "bottom", offset: 0, style: { fontSize: 11, fill: "#64748b" } }} />
										<YAxis type="number" dataKey="y" domain={["auto", "auto"]}
										       tick={{ fontSize: 11, fill: "#64748b" }}
										       label={{ value: "CO₂ (MtCO₂)", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#64748b" } }} />
										<Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
										<Scatter name="Months" data={h2.scatter} fill="#4f46e5" />
										<Line data={h2.line} type="linear" dataKey="yHat" stroke="#4f46e5" strokeWidth={2} dot={false} />
									</ComposedChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="space-y-3">
							<StatBadge label="Pearson r" value={h2.reg.r.toFixed(4)} sig={sigStars(h2.reg.pValue)} />
							<StatBadge label="R²" value={h2.reg.rSquared.toFixed(4)} />
							<StatBadge label="Emission factor (β)" value={`${h2.reg.slope.toFixed(4)} MtCO₂/TWh`} highlight />
							<StatBadge label="95% CI for β" value={`[${h2.reg.ci95SlopeLow.toFixed(3)}, ${h2.reg.ci95SlopeHigh.toFixed(3)}]`} />
							<StatBadge label="Intercept (α)" value={`${h2.reg.intercept.toFixed(4)}`} />
							<StatBadge label="p-value" value={formatP(h2.reg.pValue)} />

							<div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
								<div className="flex items-start gap-2">
									<CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
									<div>
										<p className="font-bold">สนับสนุน H₂ อย่างแข็งแกร่ง (Strong support)</p>
										<p className="mt-1 text-xs">
											R² = {h2.reg.rSquared.toFixed(3)} หมายความว่าตัวแปร fossil generation อธิบายการเปลี่ยนแปลงของ CO₂ ได้ {(h2.reg.rSquared * 100).toFixed(1)}% — นี่คือพื้นฐานทางสถิติของการคำนวณ CO₂ ในหน้า Simulator
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</motion.section>

			{/* Methodology footer */}
			<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
				<h3 className="mb-3 text-base font-bold text-slate-900">Methodology</h3>
				<ul className="space-y-1.5 text-sm text-slate-600">
					<li>• <b>Data source:</b> Ember Electricity Data, monthly resolution, 2020–2024 (72 countries, 6,797 country-months)</li>
					<li>• <b>Test:</b> Pearson correlation + two-sided t-test (H₀: β = 0), α = 0.05</li>
					<li>• <b>p-value:</b> computed via regularized incomplete beta function (Numerical Recipes §6.4)</li>
					<li>• <b>CI:</b> Student&apos;s t critical value × standard error of slope</li>
					<li>• <b>Code:</b> Pure TypeScript implementation in <code className="rounded bg-white px-1 py-0.5 text-xs">stats.ts</code> — validated against scipy</li>
				</ul>
			</div>
		</div>
	)
}
export default Hypothesis