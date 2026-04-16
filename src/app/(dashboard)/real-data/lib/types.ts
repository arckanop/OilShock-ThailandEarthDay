export type Country = {
	name: string;
	gdp: string;
	import: string;
	pop: string;
	flag?: string;
	// code?: string;
};

export type SeriesPoint = {
	name: string;
	clean: number;
	fossil: number;
};

export type SourceRow = {
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

export type RawDataRow = {
	area: string; year: number; month: number;
	capacity_clean: number; capacity_fossil: number;
	gen_clean: number; gen_fossil: number;
	emissions_clean: number; emissions_fossil: number;
};