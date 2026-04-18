"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Box, Check, ChevronDown, Globe, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRouter } from "next/navigation";

import StatCard from "@/components/StatCard";
import ChartCard from "@/components/ChartCard";
import { highlightMatch } from "@/components/CountrySearch";
import { monthNames } from "@/lib/constants";
import { monthsList } from "@/app/(dashboard)/real-data/lib/constants";
import type { Country, SeriesPoint, CountriesData, MonthRecord } from "@/lib/types";
import { avg, countryFlag } from "@/app/(dashboard)/real-data/lib/utils";
import { monthLabel } from "@/lib/utils";
import { loadCountriesData } from "@/lib/dataStore";

type YearSelection = "all" | number;
type TrendPoint = { name: string; value: number };
type StatValues = { gdp: string; import: string; pop: string };
type MonthlyMetricValues = {
	capacity: { clean: string; fossil: string };
	generation: { clean: string; fossil: string };
	emissions: { clean: string; fossil: string };
};

function MetricTrendCard({ title, data, suffix, isLoading }: { title: string; data: TrendPoint[]; suffix: string; isLoading: boolean }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-semibold text-slate-900">{title}</h3>
				<span className="text-xs text-slate-400">{suffix}</span>
			</div>
			<div className="h-72">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading...</div>
				) : data.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-400">No data available</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={data} baseValue="dataMin" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
							<CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
							<YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={56} tickCount={6} allowDecimals={true}
							       tick={{ fontSize: 12, fill: "#64748b" }}
							       domain={([dataMin, dataMax]: [number, number]) => {
								       if (dataMin === dataMax) return [dataMin - 1, dataMax + 1];
								       const padding = (dataMax - dataMin) * 0.15;
								       return [dataMin - padding, dataMax + padding];
							       }}
							       tickFormatter={(value: number) => Number(value).toFixed(2).replace(/\.?0+$/, "")}
							/>
							<Tooltip formatter={(value: number | string) => Number(value).toFixed(2).replace(/\.?0+$/, "")}
							         contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", color: "#0f172a", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
							<Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={2} />
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

function MonthlySplitCard({ title, unit, clean, fossil }: { title: string; unit: string; clean: string; fossil: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-base font-semibold text-slate-900">{title}</h3>
				<span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{unit}</span>
			</div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
					<div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Clean</div>
					<div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{clean}</div>
				</div>
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
					<div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Fossil</div>
					<div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{fossil}</div>
				</div>
			</div>
		</div>
	);
}

const RealData = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [allData, setAllData] = useState<CountriesData>({});
	const [countries, setCountries] = useState<Country[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const [year, setYear] = useState<YearSelection>("all");
	const [month, setMonth] = useState("All Year");

	const [capacityData, setCapacityData] = useState<SeriesPoint[]>([]);
	const [generationData, setGenerationData] = useState<SeriesPoint[]>([]);
	const [emissionsData, setEmissionsData] = useState<SeriesPoint[]>([]);
	const [capacityYearlyData, setCapacityYearlyData] = useState<SeriesPoint[]>([]);
	const [generationYearlyData, setGenerationYearlyData] = useState<SeriesPoint[]>([]);
	const [emissionsYearlyData, setEmissionsYearlyData] = useState<SeriesPoint[]>([]);

	const [gdpTrendData, setGdpTrendData] = useState<TrendPoint[]>([]);
	const [importTrendData, setImportTrendData] = useState<TrendPoint[]>([]);
	const [popTrendData, setPopTrendData] = useState<TrendPoint[]>([]);

	const [statValues, setStatValues] = useState<StatValues>({ gdp: "-", import: "-", pop: "-" });
	const [monthlyValues, setMonthlyValues] = useState<MonthlyMetricValues>({
		capacity: { clean: "-", fossil: "-" },
		generation: { clean: "-", fossil: "-" },
		emissions: { clean: "-", fossil: "-" },
	});

	const [baselineRow, setBaselineRow] = useState<MonthRecord | null>(null);
	const [baselineSet, setBaselineSet] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);
	const [availableYears, setAvailableYears] = useState<number[]>([]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	useEffect(() => {
		setIsLoading(true);
		loadCountriesData().then((data) => {
			setAllData(data);
			const list: Country[] = Object.entries(data)
				.map(([name, rows]) => {
					const latest = rows[rows.length - 1];
					return {
						name,
						gdp: latest.gdp.toFixed(2) + " $/TBTU",
						import: latest.netImports.toFixed(2) + " TWh",
						pop: latest.pop.toFixed(2) + " M",
						flag: countryFlag(name),
					};
				})
				.sort((a, b) => a.name.localeCompare(b.name));
			setCountries(list);
			const defaultC = list.find((c) => c.name === "Thailand") ?? list[0] ?? null;
			if (defaultC) { setSelectedCountry(defaultC); setSearchQuery(defaultC.name); }
			setIsLoading(false);
		}).catch((err) => { console.error(err); setIsLoading(false); });
	}, []);

	useEffect(() => {
		if (!selectedCountry || !allData[selectedCountry.name]) return;
		setIsLoading(true);
		const rows = allData[selectedCountry.name];
		const yearsDesc = [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a);
		const yearsAsc = [...yearsDesc].sort((a, b) => a - b);
		const latestYear = yearsDesc[0];
		setAvailableYears(yearsDesc);

		if (!latestYear) { setIsLoading(false); return; }
		if (year !== "all" && !yearsDesc.includes(year as number)) {
			setYear("all"); setMonth("All Year"); setIsLoading(false); return;
		}

		const latestRows = rows.filter((r) => r.year === latestYear);
		const latestGdp = avg(latestRows.map((r) => r.gdp));
		const latestImport = avg(latestRows.map((r) => r.netImports));
		const latestPop = avg(latestRows.map((r) => r.pop));

		if (year === "all") {
			const summary = yearsAsc.map((y) => {
				const yr = rows.filter((r) => r.year === y);
				return {
					year: y,
					gdp: avg(yr.map((r) => r.gdp)),
					import: avg(yr.map((r) => r.netImports)),
					pop: avg(yr.map((r) => r.pop)),
					capClean: avg(yr.map((r) => r.capClean)),
					capFossil: avg(yr.map((r) => r.capFossil)),
					genClean: avg(yr.map((r) => r.genClean)),
					genFossil: avg(yr.map((r) => r.genFossil)),
					emitClean: avg(yr.map((r) => r.emitClean)),
					emitFossil: avg(yr.map((r) => r.emitFossil)),
				};
			});
			setGdpTrendData(summary.map((r) => ({ name: String(r.year), value: Number(r.gdp.toFixed(2)) })));
			setImportTrendData(summary.map((r) => ({ name: String(r.year), value: Number(r.import.toFixed(2)) })));
			setPopTrendData(summary.map((r) => ({ name: String(r.year), value: Number(r.pop.toFixed(2)) })));
			setCapacityYearlyData(summary.map((r) => ({ name: String(r.year), clean: Number(r.capClean.toFixed(2)), fossil: Number(r.capFossil.toFixed(2)) })));
			setGenerationYearlyData(summary.map((r) => ({ name: String(r.year), clean: Number(r.genClean.toFixed(2)), fossil: Number(r.genFossil.toFixed(2)) })));
			setEmissionsYearlyData(summary.map((r) => ({ name: String(r.year), clean: Number(r.emitClean.toFixed(2)), fossil: Number(r.emitFossil.toFixed(2)) })));
			setStatValues({ gdp: latestGdp.toFixed(2) + " $/TBTU", import: latestImport.toFixed(2) + " TWh", pop: latestPop.toFixed(2) + " M" });
			setCapacityData([]); setGenerationData([]); setEmissionsData([]);
			setMonthlyValues({ capacity: { clean: "-", fossil: "-" }, generation: { clean: "-", fossil: "-" }, emissions: { clean: "-", fossil: "-" } });
			setBaselineRow(null);
			setIsLoading(false);
			return;
		}

		const forCY = rows.filter((r) => r.year === year);
		const filtered = month === "All Year"
			? [...forCY].sort((a, b) => a.month - b.month)
			: forCY.filter((r) => r.month === monthNames.indexOf(month) + 1);

		setGdpTrendData([]); setImportTrendData([]); setPopTrendData([]);
		setCapacityYearlyData([]); setGenerationYearlyData([]); setEmissionsYearlyData([]);
		setCapacityData(filtered.map((r) => ({ name: monthLabel(r.month), clean: r.capClean, fossil: r.capFossil })));
		setGenerationData(filtered.map((r) => ({ name: monthLabel(r.month), clean: r.genClean, fossil: r.genFossil })));
		setEmissionsData(filtered.map((r) => ({ name: monthLabel(r.month), clean: r.emitClean, fossil: r.emitFossil })));

		const statR = month === "All Year" ? forCY : filtered;
		setStatValues({
			gdp: avg(statR.map((r) => r.gdp)).toFixed(2) + " $/TBTU",
			import: avg(statR.map((r) => r.netImports)).toFixed(2) + " TWh",
			pop: avg(statR.map((r) => r.pop)).toFixed(2) + " M",
		});

		if (month === "All Year") {
			setMonthlyValues({ capacity: { clean: "-", fossil: "-" }, generation: { clean: "-", fossil: "-" }, emissions: { clean: "-", fossil: "-" } });
			setBaselineRow(null);
		} else {
			const m = filtered[0] ?? null;
			setBaselineRow(m); setBaselineSet(false);
			if (m) {
				setMonthlyValues({
					capacity: { clean: m.capClean.toFixed(2), fossil: m.capFossil.toFixed(2) },
					generation: { clean: m.genClean.toFixed(2), fossil: m.genFossil.toFixed(2) },
					emissions: { clean: m.emitClean.toFixed(2), fossil: m.emitFossil.toFixed(2) },
				});
			}
		}
		setIsLoading(false);
	}, [selectedCountry?.name, year, month, allData]);

	const handleUseAsBaseline = () => {
		if (!baselineRow || !selectedCountry) return;
		sessionStorage.setItem("simulatorBaseline", JSON.stringify({
			country: selectedCountry.name, year, month,
			demandTwh: baselineRow.demand,
			genCleanTwh: baselineRow.genClean,
			genFossilTwh: baselineRow.genFossil,
			netImportsTwh: baselineRow.netImports / 12,
			emitFossilMtco2: baselineRow.emitFossil,
			gdpElasticity: 0.6,
		}));
		setBaselineSet(true);
		setTimeout(() => router.push("/simulate"), 600);
	};

	const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
	const handleSelectCountry = (c: Country) => { setSelectedCountry(c); setSearchQuery(c.name); setIsDropdownOpen(false); };

	const latestYear = availableYears[0] ?? null;
	const selectedYearValue = year === "all" ? "all" : String(year);
	const showAllYearsGraphs = year === "all";
	const showPowerCharts = year !== "all" && month === "All Year";
	const showSingleMonthCards = year !== "all" && month !== "All Year";
	const hideTopStats = year === "all";

	return (
		<div className="space-y-6">
			<div className="mb-8">
				<h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
					<Globe className="h-8 w-8 text-emerald-500" />
					Real Data Intelligence
				</h1>
				<p className="mt-1 text-slate-500">
					Explore Ember monthly data (2020–2024) across 72 countries — send a specific month to the Scenario Simulator.
				</p>
			</div>

			{/* Filter bar */}
			<div className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-12">
				<div className="relative md:col-span-7 lg:col-span-5" ref={searchRef}>
					<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Location</label>
					<div className="relative">
						<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-4 w-4 text-slate-400" /></div>
						<input type="text"
						       className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
						       placeholder="Search country..." value={searchQuery}
						       onFocus={() => setIsDropdownOpen(true)}
						       onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }} />
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-lg">{selectedCountry?.flag ?? "🌍"}</span></div>
					</div>
					<AnimatePresence>
						{isDropdownOpen && (
							<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
							            className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
								{filteredCountries.length > 0 ? filteredCountries.map((c) => (
									<div key={c.name} onClick={() => handleSelectCountry(c)}
									     className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-slate-50 ${selectedCountry?.name === c.name ? "bg-slate-50" : ""}`}>
										<div className="flex items-center gap-2"><span className="text-xl">{c.flag}</span>
											<span className="text-sm font-medium text-slate-900">{highlightMatch(c.name, searchQuery)}</span></div>
										{selectedCountry?.name === c.name && <Check className="h-4 w-4 text-emerald-600" />}
									</div>
								)) : <div className="px-4 py-3 text-center text-sm text-slate-400">No countries found</div>}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<div className="md:col-span-5 lg:col-span-3">
					<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Year</label>
					<div className="relative">
						<select value={selectedYearValue}
						        onChange={(e: ChangeEvent<HTMLSelectElement>) => { const v = e.target.value; if (v === "all") { setYear("all"); setMonth("All Year"); } else setYear(Number(v)); }}
						        className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm">
							<option value="all">All Years {latestYear ? `(latest: ${latestYear})` : ""}</option>
							{availableYears.map((v) => <option key={v} value={String(v)}>{v}</option>)}
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><ChevronDown className="h-4 w-4 text-slate-400" /></div>
					</div>
				</div>
			</div>

			{!hideTopStats && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<StatCard title="GDP per Energy Use" value={statValues.gdp} icon={<Activity className="h-5 w-5 text-blue-500" />} isLoading={isLoading} />
					<StatCard title="Energy Import Reliance" value={statValues.import} icon={<Box className="h-5 w-5 text-amber-500" />} isLoading={isLoading} />
					<StatCard title="Total Population" value={statValues.pop} icon={<MapPin className="h-5 w-5 text-purple-500" />} isLoading={isLoading} />
				</div>
			)}

			{year !== "all" && (
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
						<div className="md:col-span-4 lg:col-span-3">
							<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Month</label>
							<div className="relative">
								<select value={month} onChange={(e: ChangeEvent<HTMLSelectElement>) => setMonth(e.target.value)}
								        className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm">
									{monthsList.map((v) => <option key={v} value={v}>{v}</option>)}
								</select>
								<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><ChevronDown className="h-4 w-4 text-slate-400" /></div>
							</div>
						</div>
						<div className="flex h-full items-center md:col-span-8 lg:col-span-9">
							<p className="text-sm text-slate-500">
								{showPowerCharts && `Showing monthly charts for ${year}.`}
								{showSingleMonthCards && `Showing ${month} ${year} — use as baseline for the Scenario Simulator.`}
							</p>
						</div>
					</div>
				</div>
			)}

			{showSingleMonthCards && baselineRow && (
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
				            className="flex flex-col items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center">
					<div>
						<p className="text-sm font-semibold text-emerald-700">📌 Ready to simulate</p>
						<p className="mt-0.5 text-xs text-slate-500">
							Use {selectedCountry?.name} · {month} {year} (demand {baselineRow.demand} TWh) as the baseline
						</p>
					</div>
					<button onClick={handleUseAsBaseline} disabled={baselineSet}
					        className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-60">
						{baselineSet ? (<><Check className="h-4 w-4" />Sent to Simulator</>) : (<><SlidersHorizontal className="h-4 w-4" />Use as Baseline</>)}
					</button>
				</motion.div>
			)}

			{showAllYearsGraphs && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<MetricTrendCard title="GDP per Energy Use by Year" data={gdpTrendData} suffix="$/TBTU" isLoading={isLoading} />
						<MetricTrendCard title="Energy Import Reliance by Year" data={importTrendData} suffix="TWh" isLoading={isLoading} />
						<MetricTrendCard title="Population by Year" data={popTrendData} suffix="M" isLoading={isLoading} />
					</div>
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<ChartCard title="Capacity Avg by Year (GW)" data={capacityYearlyData} isLoading={isLoading} />
						<ChartCard title="Electricity Generation Avg by Year (TWh)" data={generationYearlyData} isLoading={isLoading} />
						<ChartCard title="Power Sector Emissions Avg by Year (mtCO2)" data={emissionsYearlyData} isLoading={isLoading} />
					</div>
				</div>
			)}

			{showPowerCharts && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<ChartCard title="Capacity (GW)" data={capacityData} isLoading={isLoading} />
					<ChartCard title="Electricity Generation (TWh)" data={generationData} isLoading={isLoading} />
					<ChartCard title="Power Sector Emissions (mtCO2)" data={emissionsData} isLoading={isLoading} />
				</div>
			)}

			{showSingleMonthCards && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<MonthlySplitCard title="Capacity" unit="GW" clean={monthlyValues.capacity.clean} fossil={monthlyValues.capacity.fossil} />
					<MonthlySplitCard title="Electricity Generation" unit="TWh" clean={monthlyValues.generation.clean} fossil={monthlyValues.generation.fossil} />
					<MonthlySplitCard title="Power Sector Emissions" unit="mtCO2" clean={monthlyValues.emissions.clean} fossil={monthlyValues.emissions.fossil} />
				</div>
			)}
		</div>
	);
};

export default RealData;