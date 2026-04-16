"use client";

export type Country = {
	code: string;
	name: string;
	flag: string;
	gdp: string;
	import: string;
	pop: string;
};

export const countries: Country[] = [
	{code: "TH", name: "Thailand", flag: "🇹🇭", gdp: "+2.5%", import: "12%", pop: "71.6 Million"},
	{code: "VN", name: "Vietnam", flag: "🇻🇳", gdp: "+5.05%", import: "8%", pop: "98.2 Million"},
	{code: "SG", name: "Singapore", flag: "🇸🇬", gdp: "+1.1%", import: "95%", pop: "5.6 Million"},
	{code: "MY", name: "Malaysia", flag: "🇲🇾", gdp: "+3.7%", import: "5%", pop: "33.9 Million"},
	{code: "ID", name: "Indonesia", flag: "🇮🇩", gdp: "+5.0%", import: "4%", pop: "277.5 Million"},
	{code: "JP", name: "Japan", flag: "🇯🇵", gdp: "+1.9%", import: "88%", pop: "125.1 Million"},
];

export const highlightMatch = (text: string, query: string) => {
	if (!query) {
		return text;
	}

	const parts = text.split(new RegExp(`(${query})`, "gi"));
	return parts.map((part, index) =>
		part.toLowerCase() === query.toLowerCase() ? (
			<span key={`${part}-${index}`} className="font-bold text-[#00FF88]">
					{part}
				</span>
		) : (
			part
		),
	);
};