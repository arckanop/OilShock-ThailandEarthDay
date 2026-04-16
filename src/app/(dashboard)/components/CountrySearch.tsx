"use client";

export const highlightMatch = (text: string, query: string) => {
	if (!query) return text;

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