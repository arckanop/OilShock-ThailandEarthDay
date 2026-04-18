import type { CountriesData, MonthRecord } from "./types";

let cache: CountriesData | null = null;
let pending: Promise<CountriesData> | null = null;

export async function loadCountriesData(): Promise<CountriesData> {
	if (cache) return cache;
	if (pending) return pending;
	pending = fetch("/data/countries.json").then((res) => res.json()).then((data) => {
		cache = data as CountriesData;
		return cache;
	});
	return pending;
}

export function getThailandRows(data: CountriesData): MonthRecord[] {
	return data["Thailand"] ?? [];
}

export function getLatestMonth(rows: MonthRecord[]): MonthRecord | null {
	if (!rows.length) return null;
	return rows[rows.length - 1];
}

export function getRowsByYear(rows: MonthRecord[], year: number): MonthRecord[] {
	return rows.filter((r) => r.year === year).sort((a, b) => a.month - b.month);
}
