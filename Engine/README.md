# Engine handoff

`engine.js` is a plain browser script. It exposes `window.ClimateEngine` with `loadData()`, `simulate(input, data?)`, and `benchmarkIndex(year)`. It also runs under Node for testing. No package installation is required.

## Data contract

The Data teammate should create `Data/scenario-data.js` as a classic JavaScript file that assigns `window.CLIMATE_DATA`. This format lets the app open directly from `UI/index.html` using `file://`, without a server or fetch request. Example structure (the numbers below are **schema examples only**, not researched local data):

```js
window.CLIMATE_DATA = {
  areaName: 'Example area',
  baselineYear: 2025,
  benchmark2030: 82,
  benchmark2035: 55,
  currency: 'USD',
  sectors: {
    oil: {
      unit: 'litres/year',
      baselineAnnualQuantity: 100,
      kgCO2PerUnit: 2,
      costPerUnit: 1
    },
    electricity: {
      unit: 'kWh/year',
      baselineAnnualQuantity: 100,
      kgCO2PerUnit: 1,
      costPerUnit: 0.2
    },
    transport: {
      unit: 'km/year',
      baselineAnnualQuantity: 100,
      kgCO2PerUnit: 1,
      costPerUnit: 0.5
    }
  }
};
```

Replace every example value with sourced inputs for the area being modeled and document the source, date, unit, and geographic scope in `Data/`. The three sectors must represent **non-overlapping activities**. For example, transport fuel cannot also be included in the oil sector's baseline. `costPerUnit` may be omitted, but the Engine then returns `null` for total money savings rather than a partial estimate. Cost inputs are spending per unit of activity, not monetary values of health impacts.

## UI integration

Load the Engine script and wait for its data loader:

```html
<script src="../Engine/engine.js"></script>
<script>
  ClimateEngine.loadData().then(() => {
    const result = ClimateEngine.simulate({
      areaName: 'My area',
      targetYear: 2030,
      annualReductionPercent: 0,
      policyBoostPercent: 0,
      sectorReductions: { oil: 1, electricity: 0, transport: 0 }
    });
    console.log(result);
  }).catch(console.error);
</script>
```

`sectorReductions` are percentage sliders for oil, electricity, and transport. `baselines` can override annual quantities for a user-defined area, using the same units as the Data file. The Engine accepts target years 2026–2035, so the UI can offer 2030 and 2035. All result numbers are unrounded; format them in the UI. `pathway` supplies the chart's scenario and benchmark index for each year. `totals.status` is `ahead`, `behind`, or `on`; a gap of at most 0.05 index points counts as `on`.

`loadData()` also loads `Data/goal13-context.js`, generated from `Data/Goal13.xlsx`. Pass `referenceCountryCode` (for example, `'840'` for the United States) to receive `goal13Context` with national GHG observations from 2020–2022 and the latest reported disaster-affected rate. The selector is independent of `areaName` and `baselines`: selecting a country never changes the calculated area impacts. These country observations are historical context, not a trained forecast, local calibration, or a quantified health benefit. For Node tests, attach the generated module as `goal13` on the Data object.

The 2025 normalized emissions index is 100. [UNEP's 2026 Emissions Gap Report](https://www.unep.org/en/publications/report/emissions-gap-report-2026) states reductions of 18% by 2030 and 45% by 2035 relative to 2025, corresponding to indices of 82 and 55. The Engine compares the scenario with those two reported endpoints. Values in the years between them are **illustrative linear interpolations, not official annual targets**. Do not treat index values as tonnes or measured emissions.

The Engine compares activity with a flat 2025 reference repeated each year. It adds annual reduction and policy boost in percentage points, compounds them annually, then applies each sector slider to that year's quantity. CO₂ and spending estimates multiply avoided activity by the supplied factors. This is a scenario calculation, not a forecast. The health panel remains qualitative because local health outcomes require changes in air quality, exposed population, baseline disease rates, and a health impact model. See [WHO's climate and air pollution guidance](https://www.who.int/publications/i/item/B09460) and [EPA's BenMAP methodology](https://www.epa.gov/benmap).

Run `node --test Engine/engine.test.js` from the repository root to verify the Engine without dependencies.
