"use client";

import { motion } from "motion/react";
import {
	BatteryCharging,
	CheckCircle,
	CloudFog,
	Droplet,
	Factory,
	Leaf,
	TrendingUp,
	Zap,
} from "lucide-react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const forecastData = [
	{ month: "Jan", demand: 5403, generation: 5556, co2: 850 },
	{ month: "Feb", demand: 4681, generation: 4875, co2: 650 },
	{ month: "Mar", demand: 4708, generation: 4708, co2: 690 },
	{ month: "Apr", demand: 4717, generation: 4042, co2: 440 },
	{ month: "May", demand: 4083, generation: 3472, co2: 310 },
	{ month: "Jun", demand: 3944, generation: 3236, co2: 310 },
];

const nextMonthPrediction = {
	demand: 4681,
	generation: 4014,
	co2: 610,
	surplus: -667,
};

const policyData = [
	{
		id: "A",
		name: "Policy A: Balanced Transition",
		description: "เน้นการเปลี่ยนผ่านแบบค่อยเป็นค่อยไป รักษาสมดุลระหว่างต้นทุนและสิ่งแวดล้อม",
		demand: 3700,
		generation: 3750,
		co2: 120,
		surplus: 50,
		cleanRatio: 45,
		status: "Feasible",
		co2Delta: -18,
	},
	{
		id: "B",
		name: "Policy B: Aggressive Clean Expansion",
		description: "มุ่งเน้นพลังงานสะอาดอย่างเต็มที่ ลด CO2 ได้มากที่สุดและสร้างพลังงานส่วนเกินสูง",
		demand: 3600,
		generation: 3900,
		co2: 85,
		surplus: 300,
		cleanRatio: 75,
		status: "Feasible",
		co2Delta: -53,
		isBest: true,
	},
	{
		id: "C",
		name: "Policy C: Reliability First",
		description: "เน้นความมั่นคงของระบบไฟฟ้าเป็นหลัก ใช้พลังงานฟอสซิลเพื่อรับประกันการจ่ายไฟ",
		demand: 3850,
		generation: 3900,
		co2: 145,
		surplus: 50,
		cleanRatio: 30,
		status: "Feasible",
		co2Delta: 7,
	},
];

export default function OverviewPage() {
	const bestPolicy = policyData.find((policy) => policy.isBest) ?? policyData[0];

	const kpis = [
		{
			title: "Predicted Demand",
			value: nextMonthPrediction.demand,
			unit: "MW",
			icon: <Zap className="h-6 w-6 text-blue-500" />,
			change: "+2.5%",
			color: "border-blue-500 bg-blue-50",
		},
		{
			title: "Predicted Generation",
			value: nextMonthPrediction.generation,
			unit: "MW",
			icon: <Factory className="h-6 w-6 text-emerald-500" />,
			change: "+1.8%",
			color: "border-emerald-500 bg-emerald-50",
		},
		{
			title: "Predicted CO2",
			value: nextMonthPrediction.co2,
			unit: "kt",
			icon: <CloudFog className="h-6 w-6 text-rose-500" />,
			change: "-5.2%",
			color: "border-rose-500 bg-rose-50",
		},
		{
			title: "Net Energy Surplus",
			value: nextMonthPrediction.surplus,
			unit: "MW",
			icon: <BatteryCharging className="h-6 w-6 text-amber-500" />,
			change: "Stable",
			color: "border-amber-500 bg-amber-50",
		},
	] as const;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
					<p className="mt-1 text-slate-500">ภาพรวมการพยากรณ์พลังงานและนโยบายในเดือนถัดไป</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				{kpis.map((kpi, idx) => (
					<motion.div
						key={kpi.title}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: idx * 0.1 }}
						className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
					>
						<div>
							<p className="text-sm font-medium text-slate-500">{kpi.title}</p>
							<div className="mt-2 flex items-baseline space-x-2">
								<span className="text-2xl font-bold text-slate-900">{kpi.value.toLocaleString()}</span>
								<span className="text-sm text-slate-500">{kpi.unit}</span>
							</div>
							<p
								className={`mt-2 text-xs font-medium ${
									kpi.change.startsWith("-") ? "text-emerald-600" : "text-slate-500"
								}`}
							>
								{/*{kpi.change} vs Last Month*/}
							</p>
						</div>
						<div className={`rounded-full border p-3 ${kpi.color}`}>{kpi.icon}</div>
					</motion.div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.3 }}
					className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
				>
					<div className="mb-6 flex items-center justify-between">
						<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
							<TrendingUp className="h-5 w-5 text-indigo-500" />
							Energy &amp; CO2 Forecast
						</h2>
						<div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">6 Months</div>
					</div>

					<div className="h-72 w-full">
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
								<YAxis
									yAxisId="right"
									orientation="right"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 12, fill: "#64748b" }}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "12px",
										border: "none",
										boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
									}}
									labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
								/>
								<Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
								<Area
									yAxisId="left"
									type="monotone"
									dataKey="generation"
									name="Generation (MW)"
									stroke="#10b981"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorGen)"
								/>
								<Area
									yAxisId="left"
									type="monotone"
									dataKey="demand"
									name="Demand (MW)"
									stroke="#3b82f6"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorDemand)"
								/>
								<Area
									yAxisId="right"
									type="monotone"
									dataKey="co2"
									name="CO2 (kt)"
									stroke="#f43f5e"
									strokeWidth={2}
									fill="transparent"
									strokeDasharray="5 5"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.4 }}
					className="relative overflow-hidden rounded-2xl bg-emerald-900 p-6 text-white shadow-md"
				>
					<div className="pointer-events-none absolute right-0 top-0 p-4 opacity-10">
						<Leaf className="h-32 w-32" />
					</div>

					<div className="mb-4 flex items-center gap-2">
						<div className="rounded-full bg-emerald-500/20 p-2 backdrop-blur-sm">
							<CheckCircle className="h-5 w-5 text-emerald-400" />
						</div>
						<h2 className="text-lg font-bold">Best Policy Summary</h2>
					</div>

					<h3 className="mb-2 text-2xl font-bold text-emerald-300">{bestPolicy.name}</h3>
					<p className="mb-6 text-sm leading-relaxed text-emerald-100/80">
						ระบบแนะนำนโยบายนี้เนื่องจากสร้างสมดุลที่ดีที่สุดระหว่าง <strong>Sustainability</strong> และ{" "}
						<strong>Reliability</strong>
					</p>

					<div className="relative z-10 space-y-4">
						<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
							<div className="flex items-center gap-2">
								<CloudFog className="h-4 w-4 text-emerald-400" />
								<span className="text-sm font-medium text-emerald-100">CO2 Reduction</span>
							</div>
							<span className="font-bold text-emerald-400">+34 kt</span>
						</div>
						<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
							<div className="flex items-center gap-2">
								<BatteryCharging className="h-4 w-4 text-emerald-400" />
								<span className="text-sm font-medium text-emerald-100">Energy Surplus</span>
							</div>
							<span className="font-bold text-emerald-400">+{bestPolicy.surplus} MW</span>
						</div>
						<div className="flex items-center justify-between rounded-xl border border-emerald-700/50 bg-emerald-800/50 p-3">
							<div className="flex items-center gap-2">
								<Droplet className="h-4 w-4 text-emerald-400" />
								<span className="text-sm font-medium text-emerald-100">Clean Ratio</span>
							</div>
							<span className="font-bold text-emerald-400">{bestPolicy.cleanRatio}%</span>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
