"use client";

import { motion } from "motion/react";
import {
	ArrowRight,
	CloudFog,
	Database,
	Factory,
	FileSearch,
	Layers,
	Settings2,
	Zap,
} from "lucide-react";

const models = [
	{
		id: "data",
		title: "Historical Data",
		icon: <Database className="h-6 w-6 text-slate-500" />,
		description: "รวบรวมข้อมูลในอดีต (อากาศ, GDP, การใช้ไฟ)",
		color: "bg-slate-50 border-slate-200",
	},
	{
		id: "demand",
		title: "Demand Model",
		icon: <Zap className="h-6 w-6 text-blue-500" />,
		description: "ทำนาย 'ไฟฟ้าที่ต้องใช้' ในอนาคต",
		color: "bg-blue-50 border-blue-200",
	},
	{
		id: "generation",
		title: "Generation Model",
		icon: <Factory className="h-6 w-6 text-emerald-500" />,
		description: "ทำนาย 'ไฟฟ้าที่ผลิตได้' จากแหล่งพลังงานต่างๆ",
		color: "bg-emerald-50 border-emerald-200",
	},
	{
		id: "co2",
		title: "CO2 Model",
		icon: <CloudFog className="h-6 w-6 text-rose-500" />,
		description: "ทำนาย 'CO2 Emission' ของภาคพลังงาน",
		color: "bg-rose-50 border-rose-200",
	},
	{
		id: "optimization",
		title: "Policy Optimization",
		icon: <Settings2 className="h-6 w-6 text-indigo-500" />,
		description: "จำลอง Scenario (A/B/C) เพื่อหานโยบายที่เหมาะสมที่สุด",
		color: "bg-indigo-50 border-indigo-200",
	},
] as const;

export default function ModelExplanationPage() {
	return (
		<div className="mx-auto max-w-6xl space-y-8">
			<div>
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">Model Explanation</h1>
				<p className="mt-1 text-slate-500">สถาปัตยกรรมของ AI และโมเดลที่อยู่เบื้องหลังระบบพยากรณ์</p>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
			>
				<div className="mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
					<Layers className="h-6 w-6 text-indigo-500" />
					<h2 className="text-xl font-bold text-slate-900">End-to-End Pipeline</h2>
				</div>

				<div className="hidden items-center justify-between lg:flex">
					{models.map((model, idx) => (
						<div key={model.id} className="flex items-center">
							<div className={`flex w-48 flex-col items-center rounded-xl border p-4 text-center ${model.color}`}>
								<div className="mb-3 rounded-full bg-white p-3 shadow-sm">{model.icon}</div>
								<h3 className="mb-1 text-sm font-bold text-slate-900">{model.title}</h3>
								<p className="text-xs text-slate-500">{model.description}</p>
							</div>

							{idx < models.length - 1 && (
								<div className="px-2 text-slate-300">
									<ArrowRight className="h-6 w-6" />
								</div>
							)}
						</div>
					))}
				</div>

				<div className="flex flex-col gap-4 lg:hidden">
					{models.map((model, idx) => (
						<div key={model.id} className="flex flex-col items-center gap-4">
							<div className={`flex w-full items-center gap-4 rounded-xl border p-4 ${model.color}`}>
								<div className="rounded-full bg-white p-3 shadow-sm">{model.icon}</div>
								<div>
									<h3 className="mb-1 text-sm font-bold text-slate-900">{model.title}</h3>
									<p className="text-xs text-slate-500">{model.description}</p>
								</div>
							</div>
							{idx < models.length - 1 && (
								<div className="py-1 text-slate-300">
									<ArrowRight className="h-6 w-6 rotate-90" />
								</div>
							)}
						</div>
					))}
				</div>
			</motion.div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
				>
					<div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
						<Database className="h-5 w-5 text-amber-500" />
						<h3 className="text-lg font-bold text-slate-900">Data Source &amp; Features</h3>
					</div>
					<ul className="space-y-3">
						<li className="flex gap-3">
							<span className="self-start rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Historical</span>
							<span className="text-sm text-slate-600">สถิติการใช้ไฟฟ้าย้อนหลัง (Load Profile)</span>
						</li>
						<li className="flex gap-3">
							<span className="self-start rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Weather</span>
							<span className="text-sm text-slate-600">อุณหภูมิเฉลี่ย, ปริมาณแสงแดด (มีผลต่อ Solar Gen &amp; AC Demand)</span>
						</li>
						<li className="flex gap-3">
							<span className="self-start rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Economic</span>
							<span className="text-sm text-slate-600">GDP, อัตราเงินเฟ้อ, การเติบโตของภาคอุตสาหกรรม</span>
						</li>
						<li className="flex gap-3">
							<span className="self-start rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">Policy Inputs</span>
							<span className="text-sm text-slate-600">สัดส่วนโรงไฟฟ้าใหม่, เป้าหมายการลดก๊าซเรือนกระจก, การนำเข้าพลังงาน (Net Import)</span>
						</li>
					</ul>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
				>
					<div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
						<FileSearch className="h-5 w-5 text-indigo-500" />
						<h3 className="text-lg font-bold text-slate-900">Key Assumptions &amp; Formulas</h3>
					</div>
					<div className="space-y-4">
						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="mb-1 text-xs font-bold text-slate-500">Energy Balance</p>
							<code className="font-mono text-sm text-slate-800">NET = Generation + Import - Export - Demand</code>
							<p className="mt-2 text-xs text-slate-500">
								ถ้า NET ≥ 0 แปลว่า &quot;ไฟพอใช้&quot; (Surplus)
								<br />
								ถ้า NET &lt; 0 แปลว่า &quot;ไฟขาดแคลน&quot; (Deficit)
							</p>
						</div>

						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
							<p className="mb-1 text-xs font-bold text-slate-500">CO2 Change (Delta)</p>
							<code className="font-mono text-sm text-slate-800">co2_delta_vs_baseline</code>
							<p className="mt-2 text-xs text-slate-500">
								คำนวณส่วนต่างของการปล่อยคาร์บอนเทียบกับสถานการณ์ปัจจุบัน (Current Policy Baseline) เพื่อประเมินผลกระทบด้านสิ่งแวดล้อม (Impact)
							</p>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}