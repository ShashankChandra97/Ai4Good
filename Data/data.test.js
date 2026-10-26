const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../Engine/engine.js');
const scenarioData = require('./scenario-data.js');
const goal13 = require('./goal13-context.js');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

test('Goal 13 browser extract matches the source workbook and expected coverage', () => {
  const workbookHash = createHash('sha256').update(readFileSync(path.join(__dirname, 'Goal13.xlsx'))).digest('hex');
  assert.equal(goal13.sha256, workbookHash, 'Regenerate goal13-context.js after updating Goal13.xlsx');
  const observations = goal13.countries.flatMap(country => country.emissions);
  assert.equal(observations.length, 286);
  assert.equal(goal13.countries.filter(country => country.emissions.length).length, 99);
  assert.equal(observations.filter(point => point.year === 2022).length, 90);
});

test('Data contract conforms strictly to Engine requirements', () => {
  assert.equal(scenarioData.baselineYear, 2025, 'baselineYear must be 2025');
  assert.equal(scenarioData.benchmark2030, 82, 'benchmark2030 must be 82');
  assert.equal(scenarioData.benchmark2035, 55, 'benchmark2035 must be 55');
  assert.ok(scenarioData.sectors, 'sectors object must exist');
  assert.ok(scenarioData.sectors.oil, 'oil sector must exist');
  assert.ok(scenarioData.sectors.electricity, 'electricity sector must exist');
  assert.ok(scenarioData.sectors.transport, 'transport sector must exist');

  ['oil', 'electricity', 'transport'].forEach(key => {
    const s = scenarioData.sectors[key];
    assert.ok(typeof s.unit === 'string' && s.unit.length > 0, `${key} unit must be non-empty string`);
    assert.ok(typeof s.baselineAnnualQuantity === 'number' && s.baselineAnnualQuantity >= 0, `${key} quantity must be >= 0`);
    assert.ok(typeof s.kgCO2PerUnit === 'number' && s.kgCO2PerUnit >= 0, `${key} kgCO2PerUnit must be >= 0`);
    if (s.costPerUnit != null) {
      assert.ok(typeof s.costPerUnit === 'number' && s.costPerUnit >= 0, `${key} costPerUnit must be >= 0`);
    }
  });
});

test('Engine simulates successfully using Data/scenario-data.js', () => {
  const result = engine.simulate({ targetYear: 2030, annualReductionPercent: 2, policyBoostPercent: 1 }, scenarioData);
  assert.ok(result.totals.baselineAnnualKgCO2 > 0, 'Baseline emissions must be greater than zero');
  assert.ok(result.totals.projectedAnnualKgCO2 > 0, 'Projected emissions must be greater than zero');
  assert.ok(result.pathway.length === 6, 'Pathway from 2025 to 2030 should have 6 data points');
  assert.equal(result.pathway[0].scenarioIndex, 100, 'Baseline index for 2025 must be exactly 100');
  assert.equal(result.totals.benchmarkIndex, 82, 'Target benchmark index for 2030 must be 82');
  assert.ok(['ahead', 'behind', 'on'].includes(result.totals.status), 'Status must be ahead, behind, or on');
});

test('Engine simulates 2035 target using Data/scenario-data.js', () => {
  const result = engine.simulate({ targetYear: 2035, annualReductionPercent: 4, policyBoostPercent: 2 }, scenarioData);
  assert.equal(result.totals.benchmarkIndex, 55, 'Target benchmark index for 2035 must be 55');
  assert.equal(result.pathway.length, 11, 'Pathway from 2025 to 2035 should have 11 data points');
});

test('Money savings calculate when all sector costs are defined', () => {
  const result = engine.simulate({ targetYear: 2030, sectorReductions: { oil: 5, electricity: 5, transport: 5 } }, scenarioData);
  assert.ok(result.totals.moneyComplete, 'Money should be complete when all sectors have prices');
  assert.ok(result.totals.annualMoneySaved > 0, 'Annual money saved should be positive when reductions exist');
  assert.ok(result.totals.cumulativeMoneySaved > 0, 'Cumulative money saved should be positive');
});
