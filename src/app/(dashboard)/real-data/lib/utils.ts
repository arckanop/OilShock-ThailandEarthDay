import {monthNames} from "@/app/(dashboard)/real-data/lib/constants";
import { flag } from "country-emoji";

export function monthLabel(monthNum: number): string {
	return monthNames[monthNum - 1] ?? "All";
}

export function avg(nums: number[]): number {
	if (!nums.length) return 0;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function countryFlag(name: string): string {
	return flag(name) ?? "🌍";
}