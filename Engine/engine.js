/* Climate Action Lab calculation engine. Works as a browser script or in Node tests. */
(function (root) {
  'use strict';

  const BASE_YEAR = 2025;
  const BENCHMARK_2030 = 82;
  const BENCHMARK_2035 = 55;
  const STATUS_TOLERANCE = 0.05; // normalized index points
  const engineScriptUrl = typeof document === 'undefined' ? null : document.currentScript?.src;
  let loadingData;

  function finiteNumber(value, label, minimum = 0) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
      throw new TypeError(`${label} must be a finite number of at least ${minimum}.`);
    }
    return value;
  }

  function percentage(value, label, maximum = 100) {
    const result = finiteNumber(value, label);
    if (result > maximum) throw new RangeError(`${label} must be at most ${maximum}%.`);
    return result;
  }

  function datasetOrThrow(dataset) {
    const selected = dataset || root.CLIMATE_DATA;
    if (!selected || typeof selected !== 'object') {
      throw new Error('Climate data is missing. Load Data/scenario-data.js before simulating.');
    }
    if (selected.baselineYear !== BASE_YEAR) {
      throw new Error(`Data baselineYear must be ${BASE_YEAR}.`);
    }
    if (selected.benchmark2030 !== BENCHMARK_2030) {
      throw new Error(`Data benchmark2030 must be ${BENCHMARK_2030} (normalized index).`);
    }
    if (selected.benchmark2035 !== BENCHMARK_2035) {
      throw new Error(`Data benchmark2035 must be ${BENCHMARK_2035} (normalized index).`);
    }
    if (!selected.sectors || typeof selected.sectors !== 'object') {
      throw new Error('Data must contain a sectors object.');
    }
    for (const key of ['oil', 'electricity', 'transport']) {
      const sector = selected.sectors[key];
      if (!sector || typeof sector !== 'object') throw new Error(`Data is missing the ${key} sector.`);
      if (typeof sector.unit !== 'string' || !sector.unit.trim()) {
        throw new Error(`Data.sectors.${key}.unit must be a non-empty string.`);
      }
      finiteNumber(sector.baselineAnnualQuantity, `Data.sectors.${key}.baselineAnnualQuantity`);
      finiteNumber(sector.kgCO2PerUnit, `Data.sectors.${key}.kgCO2PerUnit`);
      if (sector.costPerUnit != null) finiteNumber(sector.costPerUnit, `Data.sectors.${key}.costPerUnit`);
    }
    return selected;
  }

  /** Load the team's Data file through a classic script, so file:// works without a server. */
  function loadData() {
    if (root.CLIMATE_DATA) return Promise.resolve(datasetOrThrow(root.CLIMATE_DATA));
    if (loadingData) return loadingData;
    if (typeof document === 'undefined') {
      return Promise.reject(new Error('Browser data loading requires a document. Pass a dataset to simulate() in Node.'));
    }
    loadingData = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('../Data/scenario-data.js', engineScriptUrl || document.baseURI).href;
      script.onload = () => {
        try { resolve(datasetOrThrow(root.CLIMATE_DATA)); }
        catch (error) { reject(error); }
      };
      script.onerror = () => reject(new Error('Could not load Data/scenario-data.js. Check that the Data team has added it.'));
      document.head.appendChild(script);
    }).catch(error => {
      loadingData = null;
      throw error;
    });
    return loadingData;
  }

  function benchmarkIndex(year) {
    if (!Number.isInteger(year) || year < BASE_YEAR || year > 2035) {
      throw new RangeError('Benchmark year must be an integer from 2025 to 2035.');
    }
    // The 2025, 2030 and 2035 endpoints are sourced; intervening years are
    // illustrative straight-line interpolations, not official annual values.
    return year <= 2030
      ? 100 + (BENCHMARK_2030 - 100) * (year - BASE_YEAR) / (2030 - BASE_YEAR)
      : BENCHMARK_2030 + (BENCHMARK_2035 - BENCHMARK_2030) * (year - 2030) / 5;
  }

  function simulate(input = {}, dataset) {
    const data = datasetOrThrow(dataset);
    const targetYear = input.targetYear == null ? 2030 : input.targetYear;
    if (!Number.isInteger(targetYear) || targetYear < 2026 || targetYear > 2035) {
      throw new RangeError('targetYear must be an integer from 2026 to 2035.');
    }
    const annualReductionPercent = percentage(input.annualReductionPercent ?? 0, 'annualReductionPercent', 10);
    const policyBoostPercent = percentage(input.policyBoostPercent ?? 0, 'policyBoostPercent', 4);
    const combinedAnnualPercent = annualReductionPercent + policyBoostPercent;
    const reductions = input.sectorReductions || {};
    const baselines = input.baselines || {};
    const sectorNames = ['oil', 'electricity', 'transport'];
    const sectors = {};
    let baselineKgCO2 = 0;
    let targetKgCO2 = 0;
    let annualAvoidedKgCO2 = 0;
    let cumulativeAvoidedKgCO2 = 0;
    let annualMoneySaved = 0;
    let cumulativeMoneySaved = 0;
    let moneyComplete = true;

    for (const key of sectorNames) {
      const source = data.sectors[key];
      const quantity = finiteNumber(baselines[key] ?? source.baselineAnnualQuantity, `baselines.${key}`);
      const reductionPercent = percentage(reductions[key] ?? 0, `sectorReductions.${key}`);
      const factor = source.kgCO2PerUnit;
      const cost = source.costPerUnit;
      const years = targetYear - BASE_YEAR;
      const commonPathQuantity = quantity * (1 - combinedAnnualPercent / 100) ** years;
      const projectedAnnualQuantity = commonPathQuantity * (1 - reductionPercent / 100);
      const avoidedAnnualQuantity = quantity - projectedAnnualQuantity;
      let cumulativeAvoidedQuantity = 0;
      for (let year = BASE_YEAR + 1; year <= targetYear; year++) {
        const modeledQuantity = quantity * (1 - combinedAnnualPercent / 100) ** (year - BASE_YEAR) * (1 - reductionPercent / 100);
        cumulativeAvoidedQuantity += quantity - modeledQuantity;
      }
      baselineKgCO2 += quantity * factor;
      targetKgCO2 += projectedAnnualQuantity * factor;
      annualAvoidedKgCO2 += avoidedAnnualQuantity * factor;
      cumulativeAvoidedKgCO2 += cumulativeAvoidedQuantity * factor;
      if (cost == null) moneyComplete = false;
      else {
        annualMoneySaved += avoidedAnnualQuantity * cost;
        cumulativeMoneySaved += cumulativeAvoidedQuantity * cost;
      }
      sectors[key] = {
        unit: source.unit,
        baselineAnnualQuantity: quantity,
        reductionPercent,
        projectedAnnualQuantity,
        avoidedAnnualQuantity,
        cumulativeAvoidedQuantity,
        avoidedAnnualKgCO2: avoidedAnnualQuantity * factor,
        annualMoneySaved: cost == null ? null : avoidedAnnualQuantity * cost,
        costKnown: cost != null
      };
    }

    if (baselineKgCO2 <= 0) {
      throw new Error('At least one sector must have a positive baseline quantity and CO₂ factor.');
    }

    const pathway = [];
    for (let year = BASE_YEAR; year <= targetYear; year++) {
      const elapsed = year - BASE_YEAR;
      let projectedKgCO2 = 0;
      for (const key of sectorNames) {
        const sector = sectors[key];
        const factor = data.sectors[key].kgCO2PerUnit;
        const sectorReduction = elapsed === 0 ? 0 : sector.reductionPercent / 100;
        projectedKgCO2 += sector.baselineAnnualQuantity * (1 - combinedAnnualPercent / 100) ** elapsed * (1 - sectorReduction) * factor;
      }
      pathway.push({ year, scenarioIndex: projectedKgCO2 / baselineKgCO2 * 100, benchmarkIndex: benchmarkIndex(year) });
    }

    const scenarioIndex = targetKgCO2 / baselineKgCO2 * 100;
    const targetBenchmarkIndex = benchmarkIndex(targetYear);
    const gapIndexPoints = scenarioIndex - targetBenchmarkIndex;
    const status = gapIndexPoints < -STATUS_TOLERANCE ? 'ahead'
      : gapIndexPoints > STATUS_TOLERANCE ? 'behind' : 'on';
    const anyReduction = combinedAnnualPercent > 0 || sectorNames.some(key => sectors[key].reductionPercent > 0);

    return {
      areaName: input.areaName?.trim() || data.areaName || 'User-defined area',
      baselineYear: BASE_YEAR,
      targetYear,
      currency: data.currency || null,
      combinedAnnualPercent,
      assumptions: {
        sectorSliders: 'Each sector slider reduces that sector’s modeled annual quantity by the selected percentage from 2026 onward.',
        annualRate: 'The annual reduction rate and policy boost add as percentage points, then compound once per year.',
        savingsReference: 'Avoided quantities, CO₂, and spending are compared with a flat 2025 annual activity level repeated each year, not with an observed forecast.',
        money: 'Money saved uses constant unit prices and excludes implementation costs, inflation, and discounting.',
        benchmark: '2025=100, 2030=82, and 2035=55 are the benchmark anchors. Values between anchors are illustrative linear interpolations, not official annual targets.',
        coverage: 'The three sector baselines must not overlap; otherwise combined CO₂ and money totals double-count activity.'
      },
      sectors,
      totals: {
        baselineAnnualKgCO2: baselineKgCO2,
        projectedAnnualKgCO2: targetKgCO2,
        avoidedAnnualKgCO2: annualAvoidedKgCO2,
        cumulativeAvoidedKgCO2,
        annualMoneySaved: moneyComplete ? annualMoneySaved : null,
        cumulativeMoneySaved: moneyComplete ? cumulativeMoneySaved : null,
        moneyComplete,
        scenarioIndex,
        percentageChangeFromBaseline: scenarioIndex - 100,
        benchmarkIndex: targetBenchmarkIndex,
        gapIndexPoints,
        status
      },
      health: {
        quantified: false,
        summary: anyReduction
          ? 'Reduced fuel use may also reduce harmful local air pollution where it reduces combustion. Local health outcomes are not estimated.'
          : 'No activity reduction is selected. Local health outcomes are not estimated.',
        dataNeeded: 'Quantified health outcomes require local air quality changes, exposed population, baseline disease rates, and a health impact model.'
      },
      insight: status === 'behind'
        ? 'The modeled emissions index is above the illustrative benchmark. Try larger reductions in oil, electricity, or transport.'
        : status === 'ahead'
          ? 'The modeled emissions index is below the illustrative benchmark under the selected assumptions.'
          : 'The modeled emissions index is approximately on the illustrative benchmark under the selected assumptions.',
      pathway
    };
  }

  const api = { loadData, simulate, benchmarkIndex };
  root.ClimateEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
