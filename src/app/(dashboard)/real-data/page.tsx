"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Box, Check, ChevronDown, Globe, MapPin, Search } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import StatCard from "@/app/(dashboard)/components/StatCard";
import ChartCard from "@/app/(dashboard)/components/ChartCard";
import { highlightMatch } from "@/app/(dashboard)/components/CountrySearch";
import { monthsList } from "@/app/(dashboard)/real-data/lib/constants";
import type { SourceRow } from "@/app/(dashboard)/real-data/lib/types";
import { avg, countryFlag } from "@/app/(dashboard)/real-data/lib/utils";
import type { Country, SeriesPoint } from "@/lib/types";
import { monthNames } from "@/lib/constants";
import { monthLabel } from "@/lib/utils";

type YearSelection = "all" | number;

type TrendPoint = {
	name: string;
	value: number;
};

type StatValues = {
	gdp: string;
	import: string;
	pop: string;
};

type MonthlyMetricValues = {
	capacity: { clean: string; fossil: string };
	generation: { clean: string; fossil: string };
	emissions: { clean: string; fossil: string };
};

function MetricTrendCard({
	                         title,
	                         data,
	                         suffix,
	                         isLoading,
                         }: {
	title: string;
	data: TrendPoint[];
	suffix: string;
	isLoading: boolean;
}) {
	return (
		<div className="rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-semibold text-white">{title}</h3>
				<span className="text-xs text-slate-400">{suffix}</span>
			</div>

			<div className="h-72">
				{isLoading ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-400">
						Loading...
					</div>
				) : data.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-400">
						No data available
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={data}
							baseValue="dataMin"
							margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
						>
							<CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
							<XAxis
								dataKey="name"
								stroke="#94a3b8"
								tickLine={false}
								axisLine={false}
							/>
							<YAxis
								stroke="#94a3b8"
								tickLine={false}
								axisLine={false}
								width={56}
								tickCount={6}
								allowDecimals={true}
								domain={([dataMin, dataMax]) => {
									if (dataMin === dataMax) return [dataMin - 1, dataMax + 1];
									const padding = (dataMax - dataMin) * 0.15;
									return [dataMin - padding, dataMax + padding];
								}}
								tickFormatter={(value) =>
									Number(value).toFixed(2).replace(/\.?0+$/, "")
								}
							/>
							<Tooltip
								formatter={(value) =>
									Number(value).toFixed(2).replace(/\.?0+$/, "")
								}
								contentStyle={{
									backgroundColor: "#0f172a",
									border: "1px solid #334155",
									borderRadius: "12px",
									color: "#fff",
								}}
							/>
							<Area
								type="monotone"
								dataKey="value"
								stroke="#00FF88"
								fill="#00FF88"
								fillOpacity={0.08}
								strokeWidth={2}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}

function MonthlySplitCard({
	                          title,
	                          unit,
	                          clean,
	                          fossil,
                          }: {
	title: string;
	unit: string;
	clean: string;
	fossil: string;
}) {
	return (
		<div
			className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111827] to-[#0f172a] p-5 shadow-xl shadow-black/20">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-base font-semibold text-white">{title}</h3>
				<span
					className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
					{unit}
				</span>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
					<div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
						Clean
					</div>
					<div className="mt-3 text-3xl font-bold tracking-tight text-white">
						{clean}
					</div>
				</div>

				<div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
					<div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
						Fossil
					</div>
					<div className="mt-3 text-3xl font-bold tracking-tight text-white">
						{fossil}
					</div>
				</div>
			</div>
		</div>
	);
}

const RealData = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [allRows, setAllRows] = useState<SourceRow[]>([]);
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

	const [statValues, setStatValues] = useState<StatValues>({
		gdp: "-",
		import: "-",
		pop: "-",
	});

	const [monthlyValues, setMonthlyValues] = useState<MonthlyMetricValues>({
		capacity: { clean: "-", fossil: "-" },
		generation: { clean: "-", fossil: "-" },
		emissions: { clean: "-", fossil: "-" },
	});

	const searchRef = useRef<HTMLDivElement>(null);
	const [availableYears, setAvailableYears] = useState<number[]>([]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		setIsLoading(true);

		fetch("/data/emissions.json")
			.then((res) => res.json())
			.then((raw: SourceRow[]) => {
				setAllRows(raw);

				const latestMap = new Map<string, SourceRow>();
				for (const row of raw) {
					const existing = latestMap.get(row.Area);
					if (
						!existing ||
						row.Year > existing.Year ||
						(row.Year === existing.Year && row.Month > existing.Month)
					) {
						latestMap.set(row.Area, row);
					}
				}

				const countryList: Country[] = Array.from(latestMap.values())
					.map((row) => ({
						name: row.Area,
						gdp: row["GDP_yearly (TBTUUSDPP)"].toFixed(2) + " $/TBTU",
						import: row["Net_Imports_yearly (TWh)"].toFixed(2) + " TWh",
						pop: row["Population_yearly (MBTUPP)"].toFixed(2) + " M",
						flag: countryFlag(row.Area),
					}))
					.sort((a, b) => a.name.localeCompare(b.name));

				setCountries(countryList);

				const defaultCountry =
					countryList.find((c) => c.name === "Thailand") ?? countryList[0] ?? null;

				if (defaultCountry) {
					setSelectedCountry(defaultCountry);
					setSearchQuery(defaultCountry.name);
				}

				setIsLoading(false);
			})
			.catch((err) => {
				console.error("Failed to load emissions data:", err);
				setIsLoading(false);
			});
	}, []);

	useEffect(() => {
		if (!selectedCountry || !allRows.length) return;

		setIsLoading(true);

		const rowsForCountry = allRows.filter((r) => r.Area === selectedCountry.name);

		const yearsDesc = [...new Set(rowsForCountry.map((r) => r.Year))].sort((a, b) => b - a);
		const yearsAsc = [...yearsDesc].sort((a, b) => a - b);
		const latestYear = yearsDesc[0];

		setAvailableYears(yearsDesc);

		if (!latestYear) {
			setIsLoading(false);
			return;
		}

		if (year !== "all" && !yearsDesc.includes(year)) {
			setYear("all");
			setMonth("All Year");
			setIsLoading(false);
			return;
		}

		const latestYearRows = rowsForCountry.filter((r) => r.Year === latestYear);
		const latestYearGdp = avg(latestYearRows.map((r) => r["GDP_yearly (TBTUUSDPP)"]));
		const latestYearImport = avg(latestYearRows.map((r) => r["Net_Imports_yearly (TWh)"]));
		const latestYearPop = avg(latestYearRows.map((r) => r["Population_yearly (MBTUPP)"]));

		if (year === "all") {
			const yearlySummary = yearsAsc.map((y) => {
				const yRows = rowsForCountry.filter((r) => r.Year === y);

				return {
					year: y,
					gdp: avg(yRows.map((r) => r["GDP_yearly (TBTUUSDPP)"])),
					import: avg(yRows.map((r) => r["Net_Imports_yearly (TWh)"])),
					pop: avg(yRows.map((r) => r["Population_yearly (MBTUPP)"])),
					capacityClean: avg(yRows.map((r) => r["Capacity_Clean_yearly (GW)"])),
					capacityFossil: avg(yRows.map((r) => r["Capacity_Fossil_yearly (GW)"])),
					generationClean: avg(
						yRows.map((r) => r["Electricity generation_Clean (TWh)"]),
					),
					generationFossil: avg(
						yRows.map((r) => r["Electricity generation_Fossil (TWh)"]),
					),
					emissionsClean: avg(
						yRows.map((r) => r["Power sector emissions_Clean (mtCO2)"]),
					),
					emissionsFossil: avg(
						yRows.map((r) => r["Power sector emissions_Fossil (mtCO2)"]),
					),
				};
			});

			setGdpTrendData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					value: Number(row.gdp.toFixed(2)),
				})),
			);

			setImportTrendData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					value: Number(row.import.toFixed(2)),
				})),
			);

			setPopTrendData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					value: Number(row.pop.toFixed(2)),
				})),
			);

			setCapacityYearlyData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					clean: Number(row.capacityClean.toFixed(2)),
					fossil: Number(row.capacityFossil.toFixed(2)),
				})),
			);

			setGenerationYearlyData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					clean: Number(row.generationClean.toFixed(2)),
					fossil: Number(row.generationFossil.toFixed(2)),
				})),
			);

			setEmissionsYearlyData(
				yearlySummary.map((row) => ({
					name: String(row.year),
					clean: Number(row.emissionsClean.toFixed(2)),
					fossil: Number(row.emissionsFossil.toFixed(2)),
				})),
			);

			setStatValues({
				gdp: latestYearGdp.toFixed(2) + " $/TBTU",
				import: latestYearImport.toFixed(2) + " TWh",
				pop: latestYearPop.toFixed(2) + " M",
			});

			setCapacityData([]);
			setGenerationData([]);
			setEmissionsData([]);

			setMonthlyValues({
				capacity: { clean: "-", fossil: "-" },
				generation: { clean: "-", fossil: "-" },
				emissions: { clean: "-", fossil: "-" },
			});

			setIsLoading(false);
			return;
		}

		const forCountryYear = rowsForCountry.filter((r) => r.Year === year);

		let rows: SourceRow[];
		if (month === "All Year") {
			rows = [...forCountryYear].sort((a, b) => a.Month - b.Month);
		} else {
			const monthIndex = monthNames.indexOf(month) + 1;
			rows = forCountryYear.filter((r) => r.Month === monthIndex);
		}

		setGdpTrendData([]);
		setImportTrendData([]);
		setPopTrendData([]);

		setCapacityYearlyData([]);
		setGenerationYearlyData([]);
		setEmissionsYearlyData([]);

		setCapacityData(
			rows.map((r) => ({
				name: monthLabel(r.Month),
				clean: r["Capacity_Clean_yearly (GW)"],
				fossil: r["Capacity_Fossil_yearly (GW)"],
			})),
		);

		setGenerationData(
			rows.map((r) => ({
				name: monthLabel(r.Month),
				clean: r["Electricity generation_Clean (TWh)"],
				fossil: r["Electricity generation_Fossil (TWh)"],
			})),
		);

		setEmissionsData(
			rows.map((r) => ({
				name: monthLabel(r.Month),
				clean: r["Power sector emissions_Clean (mtCO2)"],
				fossil: r["Power sector emissions_Fossil (mtCO2)"],
			})),
		);

		const statRows = month === "All Year" ? forCountryYear : rows;

		setStatValues({
			gdp: avg(statRows.map((r) => r["GDP_yearly (TBTUUSDPP)"])).toFixed(2) + " $/TBTU",
			import: avg(statRows.map((r) => r["Net_Imports_yearly (TWh)"])).toFixed(2) + " TWh",
			pop: avg(statRows.map((r) => r["Population_yearly (MBTUPP)"])).toFixed(2) + " M",
		});

		if (month === "All Year") {
			setMonthlyValues({
				capacity: { clean: "-", fossil: "-" },
				generation: { clean: "-", fossil: "-" },
				emissions: { clean: "-", fossil: "-" },
			});
		} else {
			const monthRow = rows[0];

			setMonthlyValues({
				capacity: {
					clean: monthRow
						? Number(monthRow["Capacity_Clean_yearly (GW)"].toFixed(2)).toString()
						: "-",
					fossil: monthRow
						? Number(monthRow["Capacity_Fossil_yearly (GW)"].toFixed(2)).toString()
						: "-",
				},
				generation: {
					clean: monthRow
						? Number(
							monthRow["Electricity generation_Clean (TWh)"].toFixed(2),
						).toString()
						: "-",
					fossil: monthRow
						? Number(
							monthRow["Electricity generation_Fossil (TWh)"].toFixed(2),
						).toString()
						: "-",
				},
				emissions: {
					clean: monthRow
						? Number(
							monthRow["Power sector emissions_Clean (mtCO2)"].toFixed(2),
						).toString()
						: "-",
					fossil: monthRow
						? Number(
							monthRow["Power sector emissions_Fossil (mtCO2)"].toFixed(2),
						).toString()
						: "-",
				},
			});
		}

		setIsLoading(false);
	}, [selectedCountry?.name, year, month, allRows]);

	const filteredCountries = countries.filter((c) =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleSelectCountry = (country: Country) => {
		setSelectedCountry(country);
		setSearchQuery(country.name);
		setIsDropdownOpen(false);
	};

	const latestYear = availableYears[0] ?? null;
	const selectedYearValue = year === "all" ? "all" : String(year);
	const showAllYearsGraphs = year === "all";
	const showPowerCharts = year !== "all" && month === "All Year";
	const showSingleMonthCards = year !== "all" && month !== "All Year";
	const hideTopStats = year === "all";

	return (
		<div className="min-h-[calc(100vh)] -m-4 bg-[#0b1120] p-4 font-sans text-slate-50 md:-m-8 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<div className="mb-8">
					<h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
						<Globe className="h-8 w-8 text-[#00FF88]" />
						Real Data Intelligence
					</h1>
					<p className="mt-1 text-slate-400">
						Explore historical power sector metrics and economic context.
					</p>
				</div>

				<div
					className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg md:grid-cols-12">
					<div className="relative md:col-span-7 lg:col-span-5" ref={searchRef}>
						<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
							Location
						</label>
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-slate-400" />
							</div>
							<input
								type="text"
								className="block w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-10 pr-3 text-white placeholder-slate-400 transition-colors focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
								placeholder="Search country..."
								value={searchQuery}
								onFocus={() => setIsDropdownOpen(true)}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setIsDropdownOpen(true);
								}}
							/>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<span className="text-lg">{selectedCountry?.flag ?? "🌍"}</span>
							</div>
						</div>

						<AnimatePresence>
							{isDropdownOpen && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-lg border border-slate-700 bg-[#1f2937] shadow-2xl"
								>
									{filteredCountries.length > 0 ? (
										filteredCountries.map((country) => (
											<div
												key={country.name}
												onClick={() => handleSelectCountry(country)}
												className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-[#374151] ${selectedCountry?.name === country.name ? "bg-[#374151]/50" : ""
												}`}
											>
												<div className="flex items-center gap-2">
													<span className="text-xl">{country.flag}</span>
													<span className="text-sm font-medium">
														{highlightMatch(country.name, searchQuery)}
													</span>
												</div>
												{selectedCountry?.name === country.name && (
													<Check className="h-4 w-4 text-[#00FF88]" />
												)}
											</div>
										))
									) : (
										<div className="px-4 py-3 text-center text-sm text-slate-400">
											No countries found
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="md:col-span-5 lg:col-span-3">
						<label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
							Year
						</label>
						<div className="relative">
							<select
								value={selectedYearValue}
								onChange={(e) => {
									const value = e.target.value;
									if (value === "all") {
										setYear("all");
										setMonth("All Year");
									} else {
										setYear(Number(value));
									}
								}}
								className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
							>
								<option value="all">
									All Years {latestYear ? `(latest: ${latestYear})` : ""}
								</option>
								{availableYears.map((v) => (
									<option key={v} value={String(v)}>
										{v}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<ChevronDown className="h-4 w-4 text-slate-400" />
							</div>
						</div>
					</div>
				</div>

				{!hideTopStats && (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<StatCard
							title="GDP per Energy Use"
							value={statValues.gdp}
							icon={<Activity className="h-5 w-5 text-blue-400" />}
							isLoading={isLoading}
						/>
						<StatCard
							title="Energy Import Reliance"
							value={statValues.import}
							icon={<Box className="h-5 w-5 text-amber-400" />}
							isLoading={isLoading}
						/>
						<StatCard
							title="Total Population"
							value={statValues.pop}
							icon={<MapPin className="h-5 w-5 text-purple-400" />}
							isLoading={isLoading}
						/>
					</div>
				)}

				{year !== "all" && (
					<div className="rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
							<div className="md:col-span-4 lg:col-span-3">
								<label
									className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
									Month
								</label>
								<div className="relative">
									<select
										value={month}
										onChange={(e) => setMonth(e.target.value)}
										className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
									>
										{monthsList.map((v) => (
											<option key={v} value={v}>
												{v}
											</option>
										))}
									</select>
									<div
										className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
										<ChevronDown className="h-4 w-4 text-slate-400" />
									</div>
								</div>
							</div>

							<div className="flex h-full items-center md:col-span-8 lg:col-span-9">
								<p className="text-sm text-slate-400">
									{showPowerCharts && `Showing monthly charts for ${year}.`}
									{showSingleMonthCards &&
										`Showing ${month} ${year} with economic summary above and a clean-vs-fossil breakdown below.`}
								</p>
							</div>
						</div>
					</div>
				)}

				{showAllYearsGraphs && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<MetricTrendCard
								title="GDP per Energy Use by Year"
								data={gdpTrendData}
								suffix="$/TBTU"
								isLoading={isLoading}
							/>
							<MetricTrendCard
								title="Energy Import Reliance by Year"
								data={importTrendData}
								suffix="TWh"
								isLoading={isLoading}
							/>
							<MetricTrendCard
								title="Population by Year"
								data={popTrendData}
								suffix="M"
								isLoading={isLoading}
							/>
						</div>

						<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
							<ChartCard
								title="Capacity Avg by Year (GW)"
								data={capacityYearlyData}
								isLoading={isLoading}
							/>
							<ChartCard
								title="Electricity Generation Avg by Year (TWh)"
								data={generationYearlyData}
								isLoading={isLoading}
							/>
							<ChartCard
								title="Power Sector Emissions Avg by Year (mtCO2)"
								data={emissionsYearlyData}
								isLoading={isLoading}
							/>
						</div>
					</div>
				)}

				{showPowerCharts && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<ChartCard title="Capacity (GW)" data={capacityData} isLoading={isLoading} />
						<ChartCard
							title="Electricity Generation (TWh)"
							data={generationData}
							isLoading={isLoading}
						/>
						<ChartCard
							title="Power Sector Emissions (mtCO2)"
							data={emissionsData}
							isLoading={isLoading}
						/>
					</div>
				)}

				{showSingleMonthCards && (
					<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
						<MonthlySplitCard
							title="Capacity"
							unit="GW"
							clean={monthlyValues.capacity.clean}
							fossil={monthlyValues.capacity.fossil}
						/>
						<MonthlySplitCard
							title="Electricity Generation"
							unit="TWh"
							clean={monthlyValues.generation.clean}
							fossil={monthlyValues.generation.fossil}
						/>
						<MonthlySplitCard
							title="Power Sector Emissions"
							unit="mtCO2"
							clean={monthlyValues.emissions.clean}
							fossil={monthlyValues.emissions.fossil}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default RealData;