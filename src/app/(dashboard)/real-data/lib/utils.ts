import {monthNames} from "@/app/(dashboard)/real-data/lib/constants";

export function monthLabel(monthNum: number): string {
	return monthNames[monthNum - 1] ?? "All";
}

export function avg(nums: number[]): number {
	if (!nums.length) return 0;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}