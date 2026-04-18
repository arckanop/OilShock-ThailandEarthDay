"use client";

import type {ReactNode} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {
	Database,
	FileText,
	FlaskConical,
	GitCompare,
	LayoutDashboard,
	SlidersHorizontal,
	Zap,
} from "lucide-react";

const navItems = [
	{href: "/", label: "Overview", icon: LayoutDashboard},
	{href: "/hypothesis", label: "Hypothesis & Tests", icon: FlaskConical},
	{href: "/compare", label: "Policy Comparison", icon: GitCompare},
	{href: "/simulate", label: "Scenario Simulator", icon: SlidersHorizontal},
	{href: "/explain", label: "Model Explanation", icon: FileText},
	{href: "/real-data", label: "Real Data", icon: Database},
] as const;

export default function DashboardLayout({children}: { children: ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
			{/* Top navbar */}
			<header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
				<div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-6">
					{/* Logo */}
					<Link href="/" className="flex shrink-0 items-center gap-2">
						<Zap className="h-5 w-5 text-emerald-500"/>
						<span className="text-base font-bold tracking-tight text-slate-900">EcoPredict AI</span>
					</Link>

					<div className="h-5 w-px bg-slate-200"/>

					{/* Nav links */}
					<nav className="flex items-center gap-1 overflow-x-auto">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={[
										"flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "bg-emerald-50 text-emerald-700"
											: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
									].join(" ")}
								>
									<Icon className="h-4 w-4"/>
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>
			</header>


			<main className="mx-auto w-full max-w-screen-xl flex-1 p-4 md:p-8">
				{children}
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-200 bg-white px-8 py-3 text-center text-xs">
				<div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
					<a
						href="https://github.com/arckanop/OilShock-ThailandEarthDay"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition-colors hover:text-slate-800"
					>
						<img src="https://cdn.simpleicons.org/github/64748b" alt="GitHub" className="h-3.5 w-3.5"/>
						Arckanop
					</a>
					<span className="text-slate-300">·</span>
					<a
						href="https://github.com/arckanop/OilShock-ThailandEarthDay/blob/master/LICENSE.md"
						target="_blank"
						rel="noopener noreferrer"
						className="text-slate-500 transition-colors hover:text-emerald-600"
					>
						AGPL-3.0
					</a>
					<span className="text-slate-300">·</span>
					<span className="text-slate-500">Hackathon v2.4.1</span>
				</div>
			</footer>
		</div>
	);
}