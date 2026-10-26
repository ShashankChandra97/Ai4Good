# Data Module — Climate Action Lab

Welcome to the **Data** component of Climate Action Lab (aligned with UN Sustainable Development Goal 13: Climate Action).

This folder provides:
1. Sourced baseline quantities, emissions factors, and unit costs for the three required non-overlapping sectors (`oil`, `electricity`, `transport`).
2. Sourced UNEP 2026 benchmark anchors (2025=100, 2030=82, 2035=55) and interpolated annual data.
3. An automated CSV importer and validation test suite.
4. Historical national SDG 13 observations from `Goal13.xlsx`, exposed separately from the area scenario.

---

## Folder Contents

| File | Purpose |
| :--- | :--- |
| `scenario-data.js` | **Primary Data Contract file**. Assigns `window.CLIMATE_DATA` for browser (`file://`) and Node environments. Loaded by `Engine/engine.js`. |
| `baseline-sectors.csv` | Editable CSV spreadsheet for sector baseline activity, emissions factors, costs, and sources. |
| `benchmark-data.csv` | Sourced UNEP benchmark anchors and illustrative linear interpolations for 2025–2035. |
| `import-csv.js` | Node script to compile `baseline-sectors.csv` into `scenario-data.js`. |
| `data.test.js` | Automated validation test suite (zero external dependencies). |
| `SOURCES.md` | In-depth citations, methodology, emissions factor references, and boundary rules. |
| `Goal13.xlsx` | Source workbook containing SDG 13 country observations. |
| `import-goal13.py` | Standard-library Python extractor for three checked workbook series. |
| `goal13-context.js` | Generated browser/Node dataset of historical national emissions and disaster rates. |
| `evaluate-goal13.js` | One-year holdout comparison of simple national GHG references. |

---

## How to Import or Customize Your Dataset

You can easily supply your own community, city, or campus dataset in two ways:

### Method A: Edit the CSV (Recommended)
1. Open [`baseline-sectors.csv`](baseline-sectors.csv) in VS Code or Excel.
2. Update the columns for each sector:
   - `sector`: must remain `oil`, `electricity`, and `transport`.
   - `unit`: activity metric (e.g., `litres/year`, `kWh/year`, `km/year`, `gallons/year`, `miles/year`).
   - `baselineAnnualQuantity`: nonnegative number for the 2025 baseline.
   - `kgCO2PerUnit`: carbon intensity factor (kg CO₂ per unit of activity).
   - `costPerUnit`: price in currency per unit of activity.
   - `description`: activity description.
   - `source`: citation or reference document.
3. Save the CSV and run:
   ```bash
   node Data/import-csv.js
   ```
4. Run the tests to verify compatibility:
   ```bash
   node --test Data/data.test.js
   ```

### Method B: Edit `scenario-data.js` Directly
You can also open [`scenario-data.js`](scenario-data.js) directly and update the `window.CLIMATE_DATA` object properties.

---

## Data Schema & Engine Requirements

The `ClimateEngine` validates the data structure using `datasetOrThrow()`. The data object must fulfill:

```javascript
window.CLIMATE_DATA = {
  areaName: 'Metro Campus & Community Area', // Optional or custom label
  baselineYear: 2025,                        // Must be 2025
  benchmark2030: 82,                         // Must be 82 (UNEP 18% reduction)
  benchmark2035: 55,                         // Must be 55 (UNEP 45% reduction)
  currency: 'USD',                           // Currency symbol or code
  sectors: {
    oil: {
      unit: 'litres/year',
      baselineAnnualQuantity: 120000,
      kgCO2PerUnit: 2.68,
      costPerUnit: 1.15
    },
    electricity: {
      unit: 'kWh/year',
      baselineAnnualQuantity: 850000,
      kgCO2PerUnit: 0.37,
      costPerUnit: 0.14
    },
    transport: {
      unit: 'km/year',
      baselineAnnualQuantity: 650000,
      kgCO2PerUnit: 0.17,
      costPerUnit: 0.22
    }
  }
};
```

### Critical Rules
- **Non-Overlapping Sectors**: Liquid fuel for vehicles must only be counted in `transport`; `oil` covers stationary heating and generators only.
- **Normalized Index**: 2025 baseline total emissions index is set to 100. It is an index, not 100 tonnes or 100 gigatonnes.
- **Complete Cost Data**: If any sector's `costPerUnit` is missing or null, the Engine sets total cost savings to `null` to avoid reporting partial savings as complete.

---

## Verification and Testing

Run the test suite from the repository root:
```bash
node --test Data/data.test.js
```
To run both the Engine and Data tests together:
```bash
node --test Engine/engine.test.js Data/data.test.js
```
The tests require no external npm packages. To regenerate the workbook extract after replacing `Goal13.xlsx`, run `python3 Data/import-goal13.py`. The extractor checks the workbook's columns, units, and series row counts; review any changed counts before updating those checks. The output records the source workbook SHA-256 hash.

The extracted GHG observations are national totals in Mt CO₂e without land use and forestry for 2020–2022. They provide historical context only. The area simulator calculates CO₂ from illustrative 2025 oil, electricity, and transport activity and cannot infer those local inputs or validate a 2030/2035 prediction from the national series. Disaster-affected rates are separately labeled historical context and are never treated as health benefits from a slider change.

Run `node Data/evaluate-goal13.js` to see a limited holdout check: use 2020–2021 to estimate each country's 2022 GHG total, then compare with the observed 2022 value. For the 89 countries with complete series, the median absolute percentage error is about 3.95% for an unchanged 2021 value versus 6.18% for a straight-line extrapolation. Even the better one-year reference does not establish accuracy for 2030/2035 or a user-defined area, so neither is silently applied to the scenario calculation.
