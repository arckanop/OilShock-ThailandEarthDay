"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Database,
	FileText,
	GitCompare,
	GitFork,
	LayoutDashboard,
	SlidersHorizontal,
	Zap,
} from "lucide-react";

const navItems = [
	{
		href: "/",
		label: "Overview",
		icon: LayoutDashboard,
	},
	{
		href: "/compare",
		label: "Policy Comparison",
		icon: GitCompare,
	},
	{
		href: "/simulate",
		label: "Scenario Simulator",
		icon: SlidersHorizontal,
	},
	{
		href: "/explain",
		label: "Model Explanation",
		icon: FileText,
	},
	{
		href: "/real-data",
		label: "Real Data",
		icon: Database,
	},
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
			<aside className="hidden w-64 flex-col bg-slate-900 text-slate-300 md:flex">
				<div className="flex h-16 items-center border-b border-slate-800 px-6">
					<Zap className="mr-2 h-6 w-6 text-emerald-400" />
					<span className="text-lg font-bold tracking-tight text-white">EcoPredict AI</span>
				</div>

				<div className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
					AI Energy Forecaster
				</div>

				<nav className="flex-1 space-y-1 px-3">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								className={[
									"flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
									isActive
										? "bg-emerald-500/10 text-emerald-400"
										: "hover:bg-slate-800 hover:text-white",
								].join(" ")}
							>
								<Icon className="mr-3 h-5 w-5" />
								{item.label}
							</Link>
						);
					})}
				</nav>

				{/*<div className="border-t border-slate-800 p-4 text-xs text-slate-500">*/}
				{/*	<p>Demo for Hackathon</p>*/}
				{/*	<p className="mt-1">Version 2.0.0</p>*/}
				{/*</div>*/}
			</aside>

			<main className="flex flex-1 flex-col overflow-hidden">
				<header className="flex h-16 items-center border-b border-slate-200 bg-white px-4 md:hidden">
					<Zap className="mr-2 h-6 w-6 text-emerald-500" />
					<span className="text-lg font-bold text-slate-900">EcoPredict AI</span>
				</header>

				<div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>

				{/*<footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 md:px-8">*/}
				{/*	<div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 md:justify-between">*/}
				{/*		<div className="font-medium text-slate-700">EcoPredict AI</div>*/}

				{/*		<div className="flex items-center gap-2">*/}
				{/*			<a*/}
				{/*				href="https://github.com/arckanop/OilShock-ThailandEarthDay"*/}
				{/*				target="_blank"*/}
				{/*				rel="noreferrer"*/}
				{/*				className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-900"*/}
				{/*			>*/}
				{/*				<GitFork className="h-4 w-4" />*/}
				{/*				<span>GitHub</span>*/}
				{/*			</a>*/}
				{/*			<span className="text-slate-400">|</span>*/}
				{/*			<span>Version 2.3.4</span>*/}
				{/*		</div>*/}
				{/*	</div>*/}
				{/*</footer>*/}
			</main>
		</div>
	);
}