# Climate Action Lab

An interactive decision-support tool for **UN SDG 13: Climate Action**, built for investors, managers and anyone who
wants to act on the goal. It shows where greenhouse gas emissions are (by country and industry), applies a
user-defined reduction scenario, quantifies the environmental impact in tonnes, and generates data-driven
recommendations.

**Open locally, no build setup:** the global dashboard's styles, code, and data live in `index.html`. The integrated area simulator additionally loads `area-simulator.js`, `../Engine/engine.js`, and the Engine's Data scripts. Keep the repository folders together when opening `index.html`, including through `file://`.

The main page now includes a **Model your area** section using `ClimateEngine.simulate()` and Data folder inputs. It offers editable 2025 activity, oil/electricity/transport percentage sliders, annual and policy sliders, 2030/2035, an area pathway, sector benefit breakdown, qualitative health context, historical Goal 13 observations, and a raw Engine response. The global/country dashboard above it still uses its own embedded data and model. Its Mt CO₂e geography results are separate from the area Engine's kg CO₂ results. `engine-test.html` remains available from the area section for backend debugging.

## Run locally
1. Open the `climate-action-lab` folder in VS Code (**File → Open Folder**).
2. Right-click `index.html` → **Reveal in Finder** (Mac) / **Reveal in File Explorer** (Windows), then double-click it.
   Or use **Open with Live Server** if installed.

## Features
- **Executive summary** for investors and management: world emissions, the cut needed, the remaining gap under your
  scenario, and the industry with the biggest gap. Updates live.
- **Scenario simulator** (global index, 2025 = 100): reduction rate, target year, policy boost, presets, reset, SVG chart.
- **Area simulator** (Engine-backed): local activity inputs, five percentage sliders, 2030/2035, CO₂ and gross spending estimates, sector detail, global reference index, and Goal 13 history.
- **Geographic drill-down:** world → continent → country, plus a search box. Each view includes:
  - a statistical trend: log-linear regression with a 95% confidence interval and R², flagged when weak;
  - environmental impact in MtCO₂e: trend projection, your scenario, target-aligned level, gap, and cumulative
    emissions avoided vs trend, with a car-equivalence;
  - **industry breakdown** across 10 sectors; select one to apply the whole tool to that industry;
  - **recommendations:** required pace vs trend, industries to prioritize, where the gap is concentrated, and
    per-person context;
  - **CSV export** of the current view.
- **Learning tools:** guided tour, 5-step learning path, SDG 13 target and indicator explorer, self-checking
  challenges, quiz.
- **Community partners:** investor and business networks, UN and science bodies, data platforms, solutions groups,
  and Dallas / UT Dallas organizations.
- **Light ("Meadow") and dark ("Forest night") themes** using the official SDG colors; Beginner / Expert modes.
- **Timestamps:** "scenario last updated" refreshes on every change; data publication, verification and retrieval
  dates are shown in the Data status card and the footer.

## Model and statistics
- **Scenario:** `E(t) = base × (1 − r)^(t − 2025)`, where `r` = base rate + policy boost (an additive assumption).
- **Benchmark:** UNEP *Emissions Gap Report 2026*: −18% by 2030 and −45% by 2035 vs 2025. Years in between are
  linearly interpolated. For geographies and industries, the same percentage is applied to their own baseline
  (illustrative only).
- **Trend:** OLS on ln(emissions):
  - totals use 2015–2024 (Our World in Data);
  - industries use 2009–2018 (latest sector data);
  - the annual rate is `e^b − 1`, with a 95% CI using the t-distribution.
- **Baseline:** the latest observed year (2024) stands in for 2025.
- **Industry baseline:** each sector's 2018 share of non-land-use emissions × the 2024 total excluding land use.
  Land use = 2024 total incl. minus excl. land use.
- **Emissions avoided:** Σ (trend − scenario) for 2026 through the target year.

## Data (update the dates in `DATA_META` in index.html when refreshing)
| Data | Source | Coverage |
|---|---|---|
| Benchmark | UNEP Emissions Gap Report 2026 (published 21 Oct 2026) | World, 2030 / 2035 |
| Country totals and source mix | Our World in Data CO₂ & GHG dataset (Jones et al.), CC BY 4.0 | 199 countries, 2000–2024 |
| Industry split | Climate Watch / CAIT 2021 release, via OWID datasets repo | 191 countries, 2009–2018 |
| Car equivalence | US EPA: 4.6 t CO₂ per typical passenger vehicle per year | |

Retrieved and verified 26 Oct 2026. `benchmark-data.csv` lists the benchmark anchors and interpolated values.

## Limitations
- Scenario results are illustrative, not forecasts, and not official UN projections.
- Applying a global % to countries or industries ignores NDCs and fair-share considerations.
- Industry values are estimates (2018 shares, 2009–2018 trends).
- Land-use emissions differ widely between datasets.
- Recommendations are rule-based on data patterns; they are not causal estimates of specific policies.
- No machine learning is used.
