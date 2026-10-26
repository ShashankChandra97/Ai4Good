const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('./engine.js');

const data = {
  areaName: 'Example area',
  baselineYear: 2025,
  benchmark2030: 82,
  benchmark2035: 55,
  currency: 'USD',
  sectors: {
    oil: { unit: 'litres/year', baselineAnnualQuantity: 100, kgCO2PerUnit: 2, costPerUnit: 1 },
    electricity: { unit: 'kWh/year', baselineAnnualQuantity: 100, kgCO2PerUnit: 1, costPerUnit: 0.2 },
    transport: { unit: 'km/year', baselineAnnualQuantity: 100, kgCO2PerUnit: 1, costPerUnit: 0.5 }
  }
};

test('a 1% oil slider gives transparent annual and cumulative benefits', () => {
  const result = engine.simulate({ targetYear: 2030, sectorReductions: { oil: 1 } }, data);
  assert.equal(result.sectors.oil.avoidedAnnualQuantity, 1);
  assert.equal(result.sectors.oil.cumulativeAvoidedQuantity, 5);
  assert.equal(result.totals.avoidedAnnualKgCO2, 2);
  assert.equal(result.totals.annualMoneySaved, 1);
  assert.equal(result.totals.cumulativeMoneySaved, 5);
  assert.equal(result.totals.scenarioIndex, 99.5);
  assert.equal(result.totals.status, 'behind');
  assert.equal(result.health.quantified, false);
});

test('annual reduction and policy boost add before compounding, including 2035', () => {
  const result = engine.simulate({ targetYear: 2035, annualReductionPercent: 3, policyBoostPercent: 2 }, data);
  assert.equal(result.combinedAnnualPercent, 5);
  assert.ok(Math.abs(result.totals.scenarioIndex - 100 * 0.95 ** 10) < 1e-10);
  assert.equal(result.totals.benchmarkIndex, 55);
  assert.equal(engine.benchmarkIndex(2030), 82);
  assert.equal(result.pathway.length, 11);
  assert.equal(result.pathway[0].scenarioIndex, 100);
  assert.equal(result.totals.status, 'behind');
});

test('missing price inputs never produce a partial total labeled as savings', () => {
  const incomplete = structuredClone(data);
  delete incomplete.sectors.transport.costPerUnit;
  const result = engine.simulate({ targetYear: 2030, sectorReductions: { transport: 1 } }, incomplete);
  assert.equal(result.totals.annualMoneySaved, null);
  assert.equal(result.totals.moneyComplete, false);
});

test('invalid or missing data is rejected instead of returning invented impacts', () => {
  assert.throws(() => engine.simulate({ targetYear: 2030 }), /Climate data is missing/);
  assert.throws(() => engine.simulate({ targetYear: 2036 }, data), /targetYear/);
  assert.throws(() => engine.simulate({ sectorReductions: { oil: 101 } }, data), /sectorReductions.oil/);
});
