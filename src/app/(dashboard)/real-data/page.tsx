"use client";

import {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Activity, Box, Check, ChevronDown, Globe, MapPin, Search} from "lucide-react";

import StatCard from "@/app/(dashboard)/components/StatCard";
import ChartCard, {type SeriesPoint} from "@/app/(dashboard)/components/ChartCard";
import { type Country, highlightMatch } from "@/app/(dashboard)/components/CountrySearch";

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const monthName = (m: number) => monthNames[m - 1];

type SourceRow = {
	Area: string;
	Year: number;
	Month: number;
	"GDP_yearly (TBTUUSDPP)": number;
	"Net_Imports_yearly (TWh)": number;
	"Population_yearly (MBTUPP)": number;
	"Capacity_Clean_yearly (GW)": number;
	"Capacity_Fossil_yearly (GW)": number;
	"Electricity generation_Clean (TWh)": number;
	"Electricity generation_Fossil (TWh)": number;
	"Power sector emissions_Clean (mtCO2)": number;
	"Power sector emissions_Fossil (mtCO2)": number;
};

type RawDataRow = {
	area: string; year: number; month: number;
	capacity_clean: number; capacity_fossil: number;
	gen_clean: number; gen_fossil: number;
	emissions_clean: number; emissions_fossil: number;
};

function aggregateYear(rows: RawDataRow[]): RawDataRow[] {
	return rows.sort((a, b) => a.month - b.month);
}

const years = Array.from({length: 25}, (_, i) => 2000 + i).reverse();
const monthsList = ["All Year", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RealDataPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [countries, setCountries] = useState<Country[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [year, setYear] = useState(2023);
	const [month, setMonth] = useState("All Year");
	const [capacityData, setCapacityData] = useState<SeriesPoint[]>([]);
	const [generationData, setGenerationData] = useState<SeriesPoint[]>([]);
	const [emissionsData, setEmissionsData] = useState<SeriesPoint[]>([]);
	const searchRef = useRef<HTMLDivElement>(null);

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
				const latestCountryMap = new Map<string, SourceRow>();

				for (const row of raw) {
					const existing = latestCountryMap.get(row.Area);

					if (
						!existing ||
						row.Year > existing.Year ||
						(row.Year === existing.Year && row.Month > existing.Month)
					) {
						latestCountryMap.set(row.Area, row);
					}
				}

				const countriesFromData: Country[] = Array.from(latestCountryMap.values())
					.map((row) => ({
						name: row.Area,
						gdp: row["GDP_yearly (TBTUUSDPP)"].toFixed(2),
						import: row["Net_Imports_yearly (TWh)"].toFixed(2),
						pop: row["Population_yearly (MBTUPP)"].toFixed(2),
						flag: "🌍",
					}))
					.sort((a, b) => a.name.localeCompare(b.name));

				setCountries(countriesFromData);

				const activeCountry =
					selectedCountry ??
					countriesFromData.find((country) => country.name === "Thailand") ??
					countriesFromData[0] ??
					null;

				if (!selectedCountry && activeCountry) {
					setSelectedCountry(activeCountry);
					setSearchQuery(activeCountry.name);
				}

				if (!activeCountry) {
					setCapacityData([]);
					setGenerationData([]);
					setEmissionsData([]);
					setIsLoading(false);
					return;
				}

				const normalized: RawDataRow[] = raw.map((row) => ({
					area: row.Area,
					year: row.Year,
					month: row.Month,
					capacity_clean: row["Capacity_Clean_yearly (GW)"],
					capacity_fossil: row["Capacity_Fossil_yearly (GW)"],
					gen_clean: row["Electricity generation_Clean (TWh)"],
					gen_fossil: row["Electricity generation_Fossil (TWh)"],
					emissions_clean: row["Power sector emissions_Clean (mtCO2)"],
					emissions_fossil: row["Power sector emissions_Fossil (mtCO2)"],
				}));

				const filtered = normalized.filter(
					(row) => row.area === activeCountry.name && row.year === year,
				);

				const rows =
					month === "All Year"
						? aggregateYear(filtered)
						: filtered.filter((row) => row.month === monthNames.indexOf(month) + 1);

				setCapacityData(
					rows.map((r) => ({
						name: monthName(r.month),
						clean: r.capacity_clean,
						fossil: r.capacity_fossil,
					})),
				);

				setGenerationData(
					rows.map((r) => ({
						name: monthName(r.month),
						clean: r.gen_clean,
						fossil: r.gen_fossil,
					})),
				);

				setEmissionsData(
					rows.map((r) => ({
						name: monthName(r.month),
						clean: r.emissions_clean,
						fossil: r.emissions_fossil,
					})),
				);

				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Failed to load emissions data:", error);
				setIsLoading(false);
			});
	}, [selectedCountry, year, month]);

	const filteredCountries = countries.filter((country) =>
		country.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleSelectCountry = (country: Country) => {
		setSelectedCountry(country);
		setSearchQuery(country.name);
		setIsDropdownOpen(false);
	};

	return (
		<div className="min-h-[calc(100vh)] -m-4 bg-[#0b1120] p-4 font-sans text-slate-50 md:-m-8 md:p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<div className="mb-8">
					<h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-white">
						<Globe className="h-8 w-8 text-[#00FF88]"/> Real Data Intelligence
					</h1>
					<p className="mt-1 text-slate-400">Explore historical power sector metrics and economic context.</p>
				</div>

				<div
					className="grid grid-cols-1 items-center gap-4 rounded-xl border border-slate-800 bg-[#111827] p-4 shadow-lg md:grid-cols-12">
					<div className="relative md:col-span-6 lg:col-span-4" ref={searchRef}>
						<label
							className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Location</label>
						<div className="relative">
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<Search className="h-4 w-4 text-slate-400"/>
							</div>
							<input
								type="text"
								className="block w-full rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-10 pr-3 text-white placeholder-slate-400 transition-colors focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
								placeholder="Search country..."
								value={searchQuery}
								onFocus={() => setIsDropdownOpen(true)}
								onChange={(event) => {
									setSearchQuery(event.target.value);
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
									initial={{opacity: 0, y: -10}}
									animate={{opacity: 1, y: 0}}
									exit={{opacity: 0, y: -10}}
									className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden overflow-y-auto rounded-lg border border-slate-700 bg-[#1f2937] shadow-2xl"
								>
									{filteredCountries.length > 0 ? (
										filteredCountries.map((country) => (
											<div
												key={country.name}
												onClick={() => handleSelectCountry(country)}
												className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-[#374151] ${
													selectedCountry?.name === country.name ? "bg-[#374151]/50" : ""
												}`}
											>
												<div className="flex items-center gap-2">
													<span className="text-xl">{country.flag}</span>
													<span
														className="text-sm font-medium">{highlightMatch(country.name, searchQuery)}</span>
												</div>
												{selectedCountry?.name === country.name &&
                                                    <Check className="h-4 w-4 text-[#00FF88]"/>}
											</div>
										))
									) : (
										<div className="px-4 py-3 text-center text-sm text-slate-400">No countries
											found</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="md:col-span-3 lg:col-span-2">
						<label
							className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Year</label>
						<div className="relative">
							<select
								value={year}
								onChange={(event) => setYear(Number(event.target.value))}
								className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
							>
								{years.map((value) => (
									<option key={value} value={value}>
										{value}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<ChevronDown className="h-4 w-4 text-slate-400"/>
							</div>
						</div>
					</div>

					<div className="md:col-span-3 lg:col-span-2">
						<label
							className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Month</label>
						<div className="relative">
							<select
								value={month}
								onChange={(event) => setMonth(event.target.value)}
								className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
							>
								{monthsList.map((value) => (
									<option key={value} value={value}>
										{value}
									</option>
								))}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<ChevronDown className="h-4 w-4 text-slate-400"/>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<StatCard title="GDP Growth" value={selectedCountry?.gdp ?? "-"}
					          icon={<Activity className="h-5 w-5 text-blue-400"/>} isLoading={isLoading}/>
					<StatCard title="Energy Import Reliance" value={selectedCountry?.import ?? "-"}
					          icon={<Box className="h-5 w-5 text-amber-400"/>} isLoading={isLoading}/>
					<StatCard title="Total Population" value={selectedCountry?.pop ?? "-"}
					          icon={<MapPin className="h-5 w-5 text-purple-400"/>} isLoading={isLoading}/>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<ChartCard title="Capacity (MW)" data={capacityData} isLoading={isLoading}/>
					<ChartCard title="Electricity Generation (GWh)" data={generationData} isLoading={isLoading}/>
					<ChartCard title="Power Sector Emissions (kt)" data={emissionsData} isLoading={isLoading}/>
				</div>
			</div>
		</div>
	);
}