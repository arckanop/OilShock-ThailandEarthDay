import type {RawDataRow} from "@/app/(dashboard)/real-data/lib/types";
import {monthNames} from "@/app/(dashboard)/real-data/lib/constants";

export const monthName = (month: number) => monthNames[month - 1];

export function aggregateYear(rows: RawDataRow[]): RawDataRow[] {
	return [...rows].sort((a, b) => a.month - b.month);
}
