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

export type MonthRecord = {
	year: number; month: number;
	demand: number; genClean: number; genFossil: number;
	emitFossil: number; emitClean: number;
	capClean: number; capFossil: number;
	netImports: number; gdp: number; pop: number; cleanRatio: number;
};

export type CountriesData = Record<string, MonthRecord[]>;

export type SimulatorBaseline = {
	country: string; year: number; month: string;
	demandTwh: number; genCleanTwh: number; genFossilTwh: number;
	netImportsTwh: number; emitFossilMtco2: number; gdpElasticity: number;
};
