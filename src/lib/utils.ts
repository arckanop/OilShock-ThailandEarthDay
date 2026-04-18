import {monthNames} from "@/lib/constants";

export function monthLabel(monthNum: number): string {
	return monthNames[monthNum - 1] ?? "All";
}