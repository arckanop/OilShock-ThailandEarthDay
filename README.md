# EcoPredict AI

**Oil Shock Hack! — Thailand Earth Day 2026**

An energy analytics and forecasting dashboard for Thailand, built with Next.js 16 and React 19. Visualises historical electricity data from Ember (2020–2024), generates seasonal-naive demand forecasts, runs statistical hypothesis tests, and compares clean-energy policy scenarios.

---

## Features

| Page | Description |
|------|-------------|
| **Overview** | KPI cards (demand, generation, CO₂, net surplus) + 6-month area chart with next-month forecast |
| **Hypothesis & Tests** | Linear regression, significance tests, and scatter plots across countries |
| **Policy Comparison** | Side-by-side comparison of three energy-transition policies |
| **Scenario Simulator** | Adjustable clean/fossil generation sliders for custom projections |
| **Model Explanation** | Methodology notes for the seasonal-naive forecasting model |
| **Real Data** | Raw Ember dataset explorer |

### Forecasting model

Uses a **seasonal-naive** approach — next month's value is predicted from the same month in the prior year, averaged over the last two occurrences. Model accuracy is shown inline: MAPE, RMSE, MAE, and a linear demand-trend p-value.

---

## Tech stack

- **Framework** — Next.js 16 / React 19 / TypeScript
- **Styling** — Tailwind CSS v4
- **Charts** — Recharts
- **Animations** — Motion (Framer Motion)
- **Icons** — Lucide React
- **Data** — Ember monthly country-level electricity data (JSON, bundled in `public/data/`)

---

## Getting started

```bash
# Install dependencies
yarn install

# Start dev server
yarn dev

# Build for production
yarn build && yarn start
```

---

## Data sources

- [`public/data/countries.json`](public/data/countries.json) — monthly generation & demand per country (Ember)
- [`public/data/emissions.json`](public/data/emissions.json) — CO₂ emissions data
- [`public/data/hypothesis.json`](public/data/hypothesis.json) — pre-computed hypothesis test inputs
- [`public/data/thailandStats.json`](public/data/thailandStats.json) — Thailand-specific aggregates

---

## License

[GNU Affero General Public License v3.0](LICENSE.md)
