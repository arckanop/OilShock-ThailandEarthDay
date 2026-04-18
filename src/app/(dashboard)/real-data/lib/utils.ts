import { flag } from "country-emoji";

export function avg(nums: number[]): number {
	if (!nums.length) return 0;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function countryFlag(name: string): string {
	return flag(name) ?? "🌍";
}