"use client";

import type { ReactNode } from "react";

type StatCardProps = {
	title: string;
	value: string;
	icon: ReactNode;
	isLoading: boolean;
};

export default function StatCard({title, value, icon, isLoading}: StatCardProps) {
	return (
		<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<div>
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
				{isLoading ? (
					<div className="mt-2 h-7 w-24 animate-pulse rounded bg-slate-100"/>
				) : (
					<p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
				)}
			</div>
			<div className="rounded-lg bg-slate-100 p-3">{icon}</div>
		</div>
	);
}