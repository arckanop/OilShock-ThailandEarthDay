"use client";

import {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Activity, Box, Check, ChevronDown, Globe, MapPin, Search} from "lucide-react";

import StatCard from "@/app/(dashboard)/components/StatCard";
import ChartCard from "@/app/(dashboard)/components/ChartCard";
import {highlightMatch} from "@/app/(dashboard)/components/CountrySearch";
import {monthNames, monthsList} from "@/app/(dashboard)/real-data/lib/constants";
import type {Country, SeriesPoint, SourceRow} from "@/app/(dashboard)/real-data/lib/types";
import {monthLabel, avg, countryFlag} from "@/app/(dashboard)/real-data/lib/utils";

const RealData = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [allRows, setAllRows] = useState<SourceRow[]>([]);
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
						gdp: row["GDP_yearly (TBTUUSDPP)"].toFixed(3) + " $/TBTU",
						import: row["Net_Imports_yearly (TWh)"].toFixed(3) + " TWh",
						pop: row["Population_yearly (MBTUPP)"].toFixed(3) + " M",
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

		const yearsForCountry = [...new Set(
			allRows
				.filter((r) => r.Area === selectedCountry.name)
				.map((r) => r.Year)
		)].sort((a, b) => b - a);

		setAvailableYears(yearsForCountry);

		if (!yearsForCountry.includes(year)) {
			setYear(yearsForCountry[0]);
			return;
		}

		const forCountryYear = allRows.filter(
			(r) => r.Area === selectedCountry.name && r.Year === year,
		);

		let rows: SourceRow[];

		if (month === "All Year") {
			// One point per month, sorted Jan → Dec
			rows = [...forCountryYear].sort((a, b) => a.Month - b.Month);
		} else {
			const monthIndex = monthNames.indexOf(month) + 1;
			rows = forCountryYear.filter((r) => r.Month === monthIndex);
		}

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

		// const refRow = forCountryYear[0];

		const gdpAvg = avg(forCountryYear.map((r) => r["GDP_yearly (TBTUUSDPP)"]));
		const importAvg = avg(forCountryYear.map((r) => r["Net_Imports_yearly (TWh)"]));
		const popAvg = avg(forCountryYear.map((r) => r["Population_yearly (MBTUPP)"]));

		setSelectedCountry((prev) =>
			prev
				? {
					...prev,
					gdp: gdpAvg.toFixed(3) + " $/TBTU",
					import: importAvg.toFixed(3) + " TWh",
					pop: popAvg.toFixed(3) + " M",
				}
				: prev,
		);

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
								onChange={(e) => setYear(Number(e.target.value))}
								className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
							>
								{availableYears.map((v) => <option key={v} value={v}>{v}</option>)}
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
								onChange={(e) => setMonth(e.target.value)}
								className="block w-full cursor-pointer appearance-none rounded-lg border border-slate-700 bg-[#1f2937] py-2.5 pl-3 pr-10 text-white focus:border-[#00FF88] focus:outline-none focus:ring-1 focus:ring-[#00FF88] sm:text-sm"
							>
								{monthsList.map((v) => <option key={v} value={v}>{v}</option>)}
							</select>
							<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
								<ChevronDown className="h-4 w-4 text-slate-400"/>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<StatCard title="GDP per Energy Use" value={selectedCountry?.gdp ?? "-"}
					          icon={<Activity className="h-5 w-5 text-blue-400"/>} isLoading={isLoading}/>
					<StatCard title="Energy Import Reliance" value={selectedCountry?.import ?? "-"}
					          icon={<Box className="h-5 w-5 text-amber-400"/>} isLoading={isLoading}/>
					<StatCard title="Total Population" value={selectedCountry?.pop ?? "-"}
					          icon={<MapPin className="h-5 w-5 text-purple-400"/>} isLoading={isLoading}/>
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<ChartCard title="Capacity (GW)" data={capacityData} isLoading={isLoading}/>
					<ChartCard title="Electricity Generation (TWh)" data={generationData} isLoading={isLoading}/>
					<ChartCard title="Power Sector Emissions (mtCO2)" data={emissionsData} isLoading={isLoading}/>
				</div>
			</div>
		</div>
	)
}
export default RealData
