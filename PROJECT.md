# Climate Action Lab — project context

## What this project is

Climate Action Lab is a small, local web dashboard for a university **AI for Good / UN SDG 13: Climate Action** presentation. A visitor defines an area's annual oil, electricity, and transport activity, moves percentage sliders, and sees how the selected changes affect modeled CO₂ emissions and spending through 2030 or 2035. The dashboard also explains possible health relevance without pretending to calculate illnesses avoided.

This is a **transparent scenario simulator**, not a trained AI model or an official forecast. It now includes historical national observations from `Data/Goal13.xlsx` for context. Those observations do not calibrate the user-defined area's 2025 activity or predict its future emissions. The core application runs from VS Code or by opening a local HTML file in a browser. It uses HTML, CSS, and vanilla JavaScript, with no backend, packages, API keys, or paid services.

## Current state — October 26, 2026

| Area | Owner | Status |
| --- | --- | --- |
| `Engine/` | Shashank Chandra | Calculation engine, handoff document, and Goal 13 context integration are present. |
| `Data/` | Data teammate | Scenario inputs and a reproducible extraction of Goal 13 country observations are present. Area baseline values remain illustrative. |
| `UI/` | UI teammate | The latest `UI-Design` dashboard is in `UI/index.html`. The earlier Engine integration test remains at `UI/engine-test.html`. |
| `README.md` | Shared project log | Records decisions and every prompt from Shashank Chandra in this chat, signed with his name. |

The repository is [ShashankChandra97/Ai4Good](https://github.com/ShashankChandra97/Ai4Good). Existing work was pushed to `main`. The team develops on separate branches: `engine`, `Data`, and `UI-Design`. The `engine` branch now contains the latest UI branch files, the Data module, and a separate Engine test dashboard. A measured area dataset and a unified UI/Engine model are still pending.

## Intended user experience

1. Enter or choose a **user-defined area** and its baseline annual activity quantities.
2. Move percentage sliders for oil consumption, electricity consumption, and transport activity. There are also sliders for a general annual reduction rate (0–10%) and a policy boost (0–4%); these two rates add in percentage points before compounding.
3. Switch the target year between 2030 and 2035. The Engine also accepts any integer year from 2026 through 2035.
4. See projected annual CO₂, change from the 2025 normalized index, gap to the benchmark, a chart of both pathways, estimated gross spending avoided, and a qualified health-impact explanation. Optionally select a country to inspect measured Goal 13 history alongside the scenario.
5. Read the assumptions and input sources behind the numbers. The area test dashboard has a reset button. The UI team's global dashboard has its own presets, which currently apply to its separate global model.

The dashboard must label simulated values as estimates. In particular, an index of 100 means **2025 activity-derived emissions set to 100**, not 100 tonnes or 100 gigatonnes.

## Folder and file map

| File | Purpose |
| --- | --- |
| `Engine/engine.js` | Validates the Data object, loads it in the browser, calculates scenario outputs and benchmark series. Exposes `window.ClimateEngine`. |
| `Engine/engine.test.js` | Dependency-free Node tests for the main calculation, 2035 benchmark, missing prices, and invalid data. |
| `Engine/README.md` | Detailed Data schema and UI integration example. |
| `Data/scenario-data.js` | Assigns `window.CLIMATE_DATA` with representative baseline quantities, emission factors, and unit prices. |
| `Data/baseline-sectors.csv` | Editable CSV spreadsheet for sector baseline activity and sources. |
| `Data/benchmark-data.csv` | UNEP 2026 benchmark anchors and illustrative linear interpolations (2025–2035). |
| `Data/import-csv.js` | Compiles `baseline-sectors.csv` into `scenario-data.js`. |
| `Data/Goal13.xlsx` | Source workbook of country-level SDG 13 observations. |
| `Data/import-goal13.py` | Extracts selected indicators from the workbook with Python's standard library and validates units, layout, and row counts. |
| `Data/goal13-context.js` | Browser-ready, generated historical country context. |
| `Data/evaluate-goal13.js` | Reproducible one-year holdout check for national GHG references. |
| `Data/README.md` and `Data/SOURCES.md` | Data contract, methodology, and source notes. |
| `UI/index.html` | Latest dashboard from `UI-Design`: global/country emissions, industry breakdown, learning tools, and its own embedded historical dataset and calculations. |
| `UI/engine-test.html` | Separate area-level Engine test page. Loads the Data scripts through the Engine and renders sliders, metrics, chart, Goal 13 context, and raw JSON. |
| `UI/README.md` and `UI/benchmark-data.csv` | UI-team documentation and benchmark table brought from `UI-Design`. |
| `README.md` | Short overview and signed prompt log. |

## How the pieces connect

```text
UI/engine-test.html → Engine/engine.js → Data/scenario-data.js
     sliders       loadData(), simulate()   example area quantities and factors
     chart    ←   totals, sectors, pathway
  country selector → Data/goal13-context.js ← Data/Goal13.xlsx

UI/index.html → embedded global/country and industry data → separate UI-team model
```

The area test page loads `../Engine/engine.js`, calls `await ClimateEngine.loadData()`, then calls `ClimateEngine.simulate(input)` whenever a control changes. `loadData()` inserts classic scripts from `Data/scenario-data.js` and `Data/goal13-context.js`, which are compatible with opening the HTML file directly through `file://`. The Engine can also receive a dataset as the second argument to `simulate()` for tests. The new main UI currently uses its own global/country GHG model and embedded data; it does not call `ClimateEngine`, and its absolute Mt CO₂e figures must not be treated as the area Engine's kg CO₂ outputs. Both pages link to each other for testing.

A typical input is:

```js
const result = ClimateEngine.simulate({
  areaName: 'My area',
  targetYear: 2030,
  annualReductionPercent: 0,
  policyBoostPercent: 0,
  sectorReductions: { oil: 1, electricity: 0, transport: 0 },
  baselines: { oil: 1000 }, // optional override, in the Data file's oil unit
  referenceCountryCode: '840' // optional historical US context; not an area calibration
});
```

The Engine returns `sectors` with per-sector projected and avoided annual quantities; `totals` with baseline/projected/avoided CO₂, money, indices, gap, and `ahead`/`behind`/`on` status; `pathway` for the chart; `health` with a qualitative message; `goal13Context` with selected historical national observations; and `assumptions` for disclosure. Values are unrounded so the UI can choose suitable display precision. See [Engine/README.md](Engine/README.md) for the full call and Data example.

## Data the Engine requires

`Data/scenario-data.js` must assign `window.CLIMATE_DATA` with `baselineYear: 2025`, `benchmark2030: 82`, `benchmark2035: 55`, and an `oil`, `electricity`, and `transport` entry inside `sectors`. Each sector needs:

- `unit`: a label such as `litres/year`, `kWh/year`, or `km/year`.
- `baselineAnnualQuantity`: nonnegative 2025 annual activity in that unit.
- `kgCO2PerUnit`: nonnegative CO₂ emitted per unit of that activity.
- `costPerUnit`: optional spending in the declared currency per activity unit. Without a price for **every** sector, total money savings are `null` to avoid presenting a partial sum as complete.

The Data teammate should add source notes for every quantity, factor, price, geography, and date. Oil and transport must be separate, non-overlapping activities; for example, fuel used for transport must not appear again in the oil baseline. Electricity's factor should match the modeled power source or grid. The area input can override baseline quantities, but the units remain those declared by Data. Baselines and factors must describe a coherent area; otherwise the combined index has no useful interpretation.

## Mathematical model

For sector `s` and year `y` from 2026 onward, where `Bₛ` is the 2025 annual activity, `r` is the sum of the annual reduction and policy boost percentages, and `pₛ` is the sector slider percentage:

```text
modeled activityₛ,y = Bₛ × (1 − r/100)^(y−2025) × (1 − pₛ/100)
```

The sector slider takes effect from 2026; the 2025 baseline itself is unchanged. The Engine compares the modeled activity in each year with a **flat 2025 activity level repeated annually**. It multiplies avoided activity by the supplied `kgCO2PerUnit` and `costPerUnit` values for CO₂ and gross spending estimates. Cumulative values sum those annual differences from 2026 through the target year. Prices and emissions factors are held constant. The model does not include implementation costs, substitution between sectors, inflation, or changes in the grid's carbon intensity.

The scenario index is `100 × projected annual CO₂ / baseline annual CO₂`. It is compared with these normalized benchmark anchors from [UNEP's 2026 Emissions Gap Report](https://www.unep.org/en/publications/report/emissions-gap-report-2026): 2025 = 100, 2030 = 82 (18% below 2025), and 2035 = 55 (45% below 2025). The Engine draws a straight line between the anchors. Intermediate-year points are **illustrative interpolations**, not reported annual targets. An index gap within 0.05 points counts as `on`; below the benchmark is `ahead`, and above it is `behind`.

**Scope caveat:** UNEP's benchmark is for *global greenhouse gases*, while this prototype sums CO₂ estimates for three activities in one user-defined area. The comparison is an educational index analogy. It does not establish whether that area is actually on an official SDG, Paris Agreement, or UNEP-compliant pathway.

`Goal13.xlsx` contains 22,623 data rows across 40 series. The selected national GHG series (`EN_ATM_GHGT_WOLU`) has 286 observations across 99 countries for 2020–2022, with only 90 countries reporting a 2022 value. The generated context also retains each country's latest reported disaster-affected rate (`VC_DSR_DAFF`) for a separately labeled historical view. These country-level data cannot determine a user-defined area's 2025 oil, electricity, or transport use; emission factors; energy prices; or causal health effects. Three years of national GHG figures are too sparse for a validated 2030/2035 forecast. The scenario output remains conditional on the activity inputs and slider assumptions, not a data-trained prediction. The workbook's national GHG totals use CO₂ equivalents for multiple gases; the area calculation uses CO₂ only, so their absolute totals must not be combined or directly compared.

An illustrative holdout check across 89 countries with complete 2020–2022 GHG series predicts 2022 from the previous two years. The median absolute percentage error is 3.95% when holding 2021 emissions constant, versus 6.18% for a straight-line trend. Run `node Data/evaluate-goal13.js` to reproduce this result. That single held-out year does not validate either method as a long-term forecast; the dashboard therefore does not silently extrapolate national history through 2030 or 2035.

Reduced fossil fuel use may reduce harmful air pollution, as described by [WHO](https://www.who.int/publications/i/item/B09460). This Engine does **not** calculate cases of illness avoided or the monetary value of health benefits. Those outcomes require local air-quality changes, population exposure, baseline health rates, and a suitable impact model such as the methodology described by [EPA BenMAP](https://www.epa.gov/benmap).

## Run and verify

The Engine and Data tests can run from the repository root:

```sh
node --test Engine/engine.test.js Data/data.test.js
python3 Data/import-goal13.py
```

Open `UI/index.html` in a browser from VS Code for the latest UI team's global dashboard. Its data and calculations are embedded, so the page opens as a local file. Use its header link to open `UI/engine-test.html` for the area Engine and Goal 13 workbook integration. The test page loads both generated Data scripts; if either is absent or invalid, it labels and uses built-in synthetic values. Move its sliders, switch between 2030 and 2035, and select a country to inspect metrics, historical Goal 13 context, chart, and raw Engine response. The current area Data file remains an example, so it should not be described as measured local activity.

## Current model review

The Engine is useful as a transparent teaching simulator. The built-in UI fallback is synthetic, and the merged Data file models a representative example area with approximate factors and prices. Its 2025 annual quantities are not tied to a documented real location. Before presenting area-specific benefits, the Data team must supply measured or otherwise defensible area quantities and precise factor and price sources. The UI should identify which dataset is active.

Recommended next changes, in priority order:

1. Define three non-overlapping activity buckets. In particular, oil used by transport must not also appear in the oil sector total.
2. Label the UNEP line as a **global reference**, not an official target for the chosen area. The current area index is based on CO₂ from three activities; UNEP's benchmark concerns global greenhouse gases.
3. Show the calculation behind each benefit: units avoided, kg CO₂ per unit, and cost per unit. Distinguish gross spending avoided from net savings after any implementation cost.
4. Make recommendations specific to the modeled inputs, such as showing which one-percentage-point sector change gives the largest modeled CO₂ reduction. Do not attach unsupported impact numbers to named policies.
5. Keep health effects qualitative until the project has local air-quality changes, exposed population, baseline health rates, and an appropriate health-impact function. [EPA's BenMAP explanation](https://www.epa.gov/benmap/how-benmap-ce-estimates-health-and-economic-effects-air-pollution) describes these inputs.

## Working agreement

- Work on your assigned branch (`engine`, `Data`, or `UI-Design`) and in the folder you own. Bring in changes from `main` before integrating work, review the combined result, and then merge into `main` through the team's review process.
- Keep source notes beside the Data inputs and keep the UI's displayed units and labels consistent with those inputs.
- Keep `README.md` as the signed prompt log for every new Shashank Chandra prompt in this project chat. New entries made on `engine` will appear on `main` after that branch is merged.
- Update this document when decisions, file names, or interfaces change so a new teammate can understand the current project without reading the chat.
