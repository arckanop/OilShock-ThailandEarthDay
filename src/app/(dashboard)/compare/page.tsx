"use client";

import {motion} from "motion/react";
import {AlertTriangle, Check, CloudFog, Info, Leaf, Zap} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

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

export default function PolicyComparisonPage() {
	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900">Policy Comparison</h1>
				<p className="mt-1 text-slate-500">เปรียบเทียบผลลัพธ์ของนโยบายทั้ง 3 รูปแบบสำหรับเดือนถัดไป</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{policyData.map((policy, idx) => (
					<motion.div
						key={policy.id}
						initial={{opacity: 0, y: 20}}
						animate={{opacity: 1, y: 0}}
						transition={{delay: idx * 0.1}}
						className={`relative flex flex-col overflow-hidden rounded-2xl border p-6 ${
							policy.isBest
								? "border-emerald-500 bg-emerald-50/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50"
								: "border-slate-200 bg-white"
						}`}
					>
						{policy.isBest && (
							<div
								className="absolute right-0 top-0 rounded-bl-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
								Recommended
							</div>
						)}

						<div className="mb-4 flex items-start justify-between">
							<h3 className="pr-8 text-lg font-bold text-slate-900">{policy.name}</h3>
						</div>
						<p className="mb-6 flex-grow text-sm text-slate-600">{policy.description}</p>

						<div className="mb-6 space-y-4">
							<div className="flex items-center justify-between border-b border-slate-100 pb-2">
								<span className="flex items-center gap-1 text-sm text-slate-500">
									<Zap className="h-4 w-4"/> Demand
								</span>
								<span className="font-semibold text-slate-800">{policy.demand} MW</span>
							</div>
							<div className="flex items-center justify-between border-b border-slate-100 pb-2">
								<span className="flex items-center gap-1 text-sm text-slate-500">
									<Leaf className="h-4 w-4 text-emerald-500"/> Gen
								</span>
								<span className="font-semibold text-slate-800">{policy.generation} MW</span>
							</div>
							<div className="flex items-center justify-between border-b border-slate-100 pb-2">
								<span className="flex items-center gap-1 text-sm text-slate-500">
									<CloudFog className="h-4 w-4 text-rose-500"/> CO2
								</span>
								<span className="font-semibold text-slate-800">{policy.co2} kt</span>
							</div>
							<div className="flex items-center justify-between border-b border-slate-100 pb-2">
								<span className="text-sm text-slate-500">Net Surplus</span>
								<span
									className={`font-semibold ${policy.surplus > 0 ? "text-emerald-600" : "text-rose-600"}`}>
									{policy.surplus > 0 ? "+" : ""}
									{policy.surplus} MW
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500">Clean Ratio</span>
								<span className="font-semibold text-indigo-600">{policy.cleanRatio}%</span>
							</div>
						</div>

						<div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
							<div className="flex items-center gap-1.5">
								{policy.status === "Feasible" ? (
									<Check className="h-4 w-4 text-emerald-500"/>
								) : (
									<AlertTriangle className="h-4 w-4 text-amber-500"/>
								)}
								<span
									className={`text-sm font-medium ${
										policy.status === "Feasible" ? "text-emerald-700" : "text-amber-700"
									}`}
								>
									{policy.status}
								</span>
							</div>
							<span
								className={`rounded-full px-2 py-1 text-xs font-bold ${
									policy.co2Delta < 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
								}`}
							>
								CO2 {policy.co2Delta > 0 ? "+" : ""}
								{policy.co2Delta} kt
							</span>
						</div>
					</motion.div>
				))}
			</div>

			<motion.div
				initial={{opacity: 0, y: 20}}
				animate={{opacity: 1, y: 0}}
				transition={{delay: 0.4}}
				className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
			>
				<div className="mb-6 flex items-center gap-2">
					<Info className="h-5 w-5 text-indigo-500"/>
					<h2 className="text-lg font-bold text-slate-900">Key Metrics Comparison</h2>
				</div>

				<div className="h-80 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={policyData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
							<XAxis dataKey="name" axisLine={false} tickLine={false}
							       tick={{fontSize: 12, fill: "#475569"}}/>
							<YAxis yAxisId="left" axisLine={false} tickLine={false}
							       tick={{fontSize: 12, fill: "#475569"}}/>
							<YAxis
								yAxisId="right"
								orientation="right"
								axisLine={false}
								tickLine={false}
								tick={{fontSize: 12, fill: "#475569"}}
							/>
							<Tooltip
								contentStyle={{
									borderRadius: "12px",
									border: "none",
									boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
								}}
								cursor={{fill: "#f8fafc"}}
							/>
							<Legend iconType="circle" wrapperStyle={{paddingTop: "10px"}}/>
							<Bar yAxisId="left" dataKey="demand" name="Demand (MW)" fill="#3b82f6" radius={[4, 4, 0, 0]}
							     barSize={40}/>
							<Bar
								yAxisId="left"
								dataKey="generation"
								name="Generation (MW)"
								fill="#10b981"
								radius={[4, 4, 0, 0]}
								barSize={40}
							/>
							<Bar
								yAxisId="right"
								dataKey="co2"
								name="CO2 Emission (kt)"
								fill="#f43f5e"
								radius={[4, 4, 0, 0]}
								barSize={40}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</motion.div>
		</div>
	);
}