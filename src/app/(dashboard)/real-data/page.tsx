"use client";

import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {Activity, Box, Check, ChevronDown, Globe, MapPin, Search} from "lucide-react";

import StatCard from "@/app/(dashboard)/components/StatCard";
import ChartCard, {type SeriesPoint} from "@/app/(dashboard)/components/ChartCard";
import { type Country, countries, highlightMatch } from "@/app/(dashboard)/components/CountrySearch";

function generateMockData(cleanBase: number, fossilBase: number, type: "capacity" | "generation" | "emissions") {
	const data: SeriesPoint[] = [];
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	for (let i = 0; i < 12; i += 1) {
		const cleanVariance = 1 + (Math.random() * 0.2 - 0.1);
		const fossilVariance = 1 + (Math.random() * 0.15 - 0.075);

		if (type === "emissions") {
			data.push({
				name: months[i],
				clean: 0,
				fossil: Math.round(fossilBase * fossilVariance),
			});
		} else {
			data.push({
				name: months[i],
				clean: Math.round(cleanBase * cleanVariance),
				fossil: Math.round(fossilBase * fossilVariance),
			});
		}
	}

	return data;
}

const years = Array.from({length: 25}, (_, i) => 2000 + i).reverse();
const monthsList = ["All Year", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RealDataPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("Thailand");
	const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
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

		const timeout = setTimeout(() => {
			let cleanBase = 15000;
			let fossilBase = 35000;

			if (selectedCountry.code === "SG") {
				cleanBase = 1000;
				fossilBase = 12000;
			}

			if (selectedCountry.code === "VN") {
				cleanBase = 25000;
				fossilBase = 22000;
			}

			if (selectedCountry.code === "ID") {
				cleanBase = 12000;
				fossilBase = 65000;
			}

			setCapacityData(generateMockData(cleanBase, fossilBase, "capacity"));
			setGenerationData(generateMockData(cleanBase * 0.8, fossilBase * 0.85, "generation"));
			setEmissionsData(generateMockData(0, fossilBase * 2.5, "emissions"));
			setIsLoading(false);
		}, 1200);

		return () => clearTimeout(timeout);
	}, [selectedCountry, year, month]);

	const filteredCountries = countries.filter((country) => country.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
								<span className="text-lg">{selectedCountry.flag}</span>
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
												key={country.code}
												onClick={() => handleSelectCountry(country)}
												className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-[#374151] ${
													selectedCountry.code === country.code ? "bg-[#374151]/50" : ""
												}`}
											>
												<div className="flex items-center gap-2">
													<span className="text-xl">{country.flag}</span>
													<span
														className="text-sm font-medium">{highlightMatch(country.name, searchQuery)}</span>
												</div>
												{selectedCountry.code === country.code &&
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
					<StatCard title="GDP Growth" value={selectedCountry.gdp}
					          icon={<Activity className="h-5 w-5 text-blue-400"/>} isLoading={isLoading}/>
					<StatCard title="Energy Import Reliance" value={selectedCountry.import}
					          icon={<Box className="h-5 w-5 text-amber-400"/>} isLoading={isLoading}/>
					<StatCard title="Total Population" value={selectedCountry.pop}
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