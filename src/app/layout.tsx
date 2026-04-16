import type {Metadata} from "next";
import {IBM_Plex_Sans_Thai as IBMPlexSansThai} from "next/font/google";
import "./globals.css";

const ibmPlexSansThai = IBMPlexSansThai({
	variable: "--font-ibm-plex-sans-thai",
	subsets: ["thai", "latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700"]
})

export const metadata: Metadata = {
	title: "EcoPredict AI",
	description: "AI energy forecaster dashboard",
};

export default function RootLayout({
	                                   children,
                                   }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={ibmPlexSansThai.variable}>
		<body className="font-sans min-h-screen bg-slate-50 text-slate-900 antialiased">
		<main>
			{children}
		</main>
		</body>
		</html>
	);
}
