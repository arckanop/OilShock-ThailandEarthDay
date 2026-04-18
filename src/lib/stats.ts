// Pure TypeScript statistics library — no external deps.
// All formulas use the standard textbook definitions (Casella & Berger, Ch 5, 12).

export type RegressionResult = {
	slope: number;
	intercept: number;
	r: number;
	rSquared: number;
	pValue: number;
	stdErr: number;
	n: number;
	ci95SlopeLow: number;
	ci95SlopeHigh: number;
};

export type ForecastAccuracy = { rmse: number; mae: number; mape: number; n: number };

export function mean(a: number[]): number {
	if (!a.length) return 0;
	let s = 0;
	for (const v of a) s += v;
	return s / a.length;
}

export function std(a: number[]): number {
	if (a.length < 2) return 0;
	const m = mean(a);
	let s = 0;
	for (const v of a) s += (v - m) * (v - m);
	return Math.sqrt(s / (a.length - 1));
}

/** Pearson product-moment correlation coefficient */
export function pearson(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 2) return 0;
	const mx = mean(x), my = mean(y);
	let num = 0, dx = 0, dy = 0;
	for (let i = 0; i < x.length; i++) {
		const a = x[i] - mx, b = y[i] - my;
		num += a * b;
		dx += a * a;
		dy += b * b;
	}
	const denom = Math.sqrt(dx * dy);
	return denom === 0 ? 0 : num / denom;
}

/** OLS linear regression y = slope*x + intercept */
export function linearRegression(x: number[], y: number[]): RegressionResult {
	const n = x.length;
	if (n < 3) {
		return { slope: 0, intercept: 0, r: 0, rSquared: 0, pValue: 1, stdErr: 0, n, ci95SlopeLow: 0, ci95SlopeHigh: 0 };
	}
	const mx = mean(x), my = mean(y);
	let sxx = 0, sxy = 0, syy = 0;
	for (let i = 0; i < n; i++) {
		sxx += (x[i] - mx) * (x[i] - mx);
		sxy += (x[i] - mx) * (y[i] - my);
		syy += (y[i] - my) * (y[i] - my);
	}
	const slope = sxx === 0 ? 0 : sxy / sxx;
	const intercept = my - slope * mx;
	const r = (sxx === 0 || syy === 0) ? 0 : sxy / Math.sqrt(sxx * syy);
	// Residual sum of squares
	let rss = 0;
	for (let i = 0; i < n; i++) {
		const pred = slope * x[i] + intercept;
		rss += (y[i] - pred) * (y[i] - pred);
	}
	const sigma2 = rss / (n - 2);
	const stdErr = sxx === 0 ? 0 : Math.sqrt(sigma2 / sxx);
	// t-statistic for slope != 0, two-sided p-value via t-distribution
	const tStat = stdErr === 0 ? 0 : slope / stdErr;
	const pValue = twoSidedPValueT(tStat, n - 2);
	const t95 = tCritical95(n - 2);
	return {
		slope, intercept, r, rSquared: r * r, pValue, stdErr, n,
		ci95SlopeLow: slope - t95 * stdErr,
		ci95SlopeHigh: slope + t95 * stdErr,
	};
}

/** Approximate two-sided p-value for t-statistic with df degrees of freedom.
 * Uses the relationship P(|T|>t) = I_{df/(df+t²)}(df/2, 1/2) via continued fraction. */
export function twoSidedPValueT(t: number, df: number): number {
	if (!isFinite(t) || df < 1) return 1;
	const x = df / (df + t * t);
	return regularizedIncompleteBeta(x, df / 2, 0.5);
}

/** Student's t critical value for 95% CI (two-sided) — approximation via Gaussian for df>=30, lookup otherwise */
export function tCritical95(df: number): number {
	if (df >= 30) return 1.96 + 2.3 / df; // small correction
	const table: Record<number, number> = {
		1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
		6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
		15: 2.131, 20: 2.086, 25: 2.060, 29: 2.045,
	};
	const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
	for (const k of keys) if (df <= k) return table[k];
	return 1.96;
}

/** Regularized incomplete beta function I_x(a,b). Numerical Recipes 6.4. */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
	if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
	const lbeta = lngamma(a) + lngamma(b) - lngamma(a + b);
	const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
	if (x < (a + 1) / (a + b + 2)) {
		return front * betaContFrac(x, a, b);
	} else {
		// Symmetry: I_x(a,b) = 1 - I_{1-x}(b,a); use the bt/b form (NR 6.4)
		return 1 - front * (a / b) * betaContFrac(1 - x, b, a);
	}
}

function betaContFrac(x: number, a: number, b: number): number {
	const MAXIT = 200, EPS = 3e-9, FPMIN = 1e-300;
	const qab = a + b, qap = a + 1, qam = a - 1;
	let c = 1, d = 1 - qab * x / qap;
	if (Math.abs(d) < FPMIN) d = FPMIN;
	d = 1 / d;
	let h = d;
	for (let m = 1; m <= MAXIT; m++) {
		const m2 = 2 * m;
		let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
		d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
		c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
		d = 1 / d; h *= d * c;
		aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
		d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
		c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
		d = 1 / d; const del = d * c; h *= del;
		if (Math.abs(del - 1) < EPS) break;
	}
	return h;
}

function lngamma(z: number): number {
	// Lanczos approximation
	const g = 7;
	const c = [
		0.99999999999980993, 676.5203681218851, -1259.1392167224028,
		771.32342877765313, -176.61502916214059, 12.507343278686905,
		-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
	];
	if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lngamma(1 - z);
	z -= 1;
	let x = c[0];
	for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
	const t = z + g + 0.5;
	return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Forecast accuracy metrics */
export function forecastAccuracy(predicted: number[], actual: number[]): ForecastAccuracy {
	const n = Math.min(predicted.length, actual.length);
	if (n === 0) return { rmse: 0, mae: 0, mape: 0, n: 0 };
	let sse = 0, sae = 0, sape = 0, cnt = 0;
	for (let i = 0; i < n; i++) {
		const err = predicted[i] - actual[i];
		sse += err * err;
		sae += Math.abs(err);
		if (actual[i] !== 0) { sape += Math.abs(err / actual[i]); cnt++; }
	}
	return {
		rmse: Math.sqrt(sse / n),
		mae: sae / n,
		mape: cnt > 0 ? (sape / cnt) * 100 : 0,
		n,
	};
}

/** Format p-value for display */
export function formatP(p: number): string {
	if (p < 0.001) return "p < 0.001";
	if (p < 0.01) return `p = ${p.toFixed(3)}`;
	return `p = ${p.toFixed(3)}`;
}

/** Format with significance stars */
export function sigStars(p: number): string {
	if (p < 0.001) return "***";
	if (p < 0.01) return "**";
	if (p < 0.05) return "*";
	return "ns";
}
