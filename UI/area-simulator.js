/* User-defined area view for the shared ClimateEngine and Data modules. */
(function () {
  'use strict';

  const el = id => document.getElementById(id);
  const sectors = [
    { key: 'oil', label: 'Stationary oil', id: 'Oil' },
    { key: 'electricity', label: 'Grid electricity', id: 'Electricity' },
    { key: 'transport', label: 'Vehicle travel', id: 'Transport' }
  ];
  const sliders = ['OilReduction', 'ElectricityReduction', 'TransportReduction', 'AnnualReduction', 'PolicyBoost'];
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
  const preciseFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  const number = value => formatter.format(value);
  const precise = value => preciseFormatter.format(value);
  const svgNamespace = 'http://www.w3.org/2000/svg';
  let data;

  function svg(tag, attributes, parent, label) {
    const node = document.createElementNS(svgNamespace, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (label != null) node.textContent = label;
    parent.appendChild(node);
    return node;
  }

  function draw(pathway) {
    const chart = el('areaChart');
    chart.replaceChildren();
    const endYear = pathway[pathway.length - 1].year;
    const maxIndex = Math.max(105, ...pathway.map(point => Math.max(point.scenarioIndex, point.benchmarkIndex)));
    const ceiling = Math.ceil(maxIndex / 25) * 25;
    const x = year => 56 + (year - 2025) / (endYear - 2025) * 604;
    const y = index => 18 + (ceiling - index) / ceiling * 218;
    for (let index = 0; index <= ceiling; index += 25) {
      svg('line', { x1: 56, x2: 660, y1: y(index), y2: y(index), class: 'grid-line' }, chart);
      svg('text', { x: 46, y: y(index) + 4, 'text-anchor': 'end', class: 'axis-text' }, chart, index);
    }
    const years = [2025, 2030, 2035].filter(year => year <= endYear);
    for (const year of years) {
      svg('text', { x: x(year), y: 264, 'text-anchor': 'middle', class: 'axis-text' }, chart, year);
    }
    const points = key => pathway.map(point => `${x(point.year)},${y(point[key])}`).join(' ');
    svg('polyline', { points: points('benchmarkIndex'), class: 'line-benchmark' }, chart);
    svg('polyline', { points: points('scenarioIndex'), class: 'line-scenario' }, chart);
    const last = pathway[pathway.length - 1];
    svg('circle', { cx: x(endYear), cy: y(last.benchmarkIndex), r: 5, class: 'dot-benchmark' }, chart);
    svg('circle', { cx: x(endYear), cy: y(last.scenarioIndex), r: 5, class: 'dot-scenario' }, chart);
  }

  function setSliderLabels() {
    for (const id of sliders) {
      const slider = el(`area${id}`);
      el(`area${id}Value`).textContent = `${precise(Number(slider.value))}%`;
      slider.style.setProperty('--fill', `${Number(slider.value) / Number(slider.max) * 100}%`);
    }
  }

  function clearResults() {
    for (const id of ['areaProjected', 'areaAvoided', 'areaMoney', 'areaIndices', 'areaHealth', 'areaGoal13', 'areaDisaster']) {
      el(id).textContent = '—';
    }
    el('areaStatus').textContent = 'Unavailable';
    el('areaInsight').textContent = 'Correct the inputs to calculate this area.';
    el('areaVerdict').classList.remove('is-ahead', 'is-on', 'is-behind');
    el('areaSectorRows').replaceChildren();
    el('areaChart').replaceChildren();
    el('areaRaw').textContent = '—';
  }

  function render() {
    setSliderLabels();
    if (!data) return;
    try {
      const baselines = {};
      const sectorReductions = {};
      for (const sector of sectors) {
        const input = el(`area${sector.id}Baseline`);
        if (!input.value.trim()) throw new Error(`Enter the 2025 ${sector.label.toLowerCase()} activity.`);
        baselines[sector.key] = Number(input.value);
        sectorReductions[sector.key] = Number(el(`area${sector.id}Reduction`).value);
      }
      const result = ClimateEngine.simulate({
        areaName: el('areaName').value,
        targetYear: Number(el('areaYear').value),
        referenceCountryCode: el('areaCountry').value || undefined,
        baselines,
        sectorReductions,
        annualReductionPercent: Number(el('areaAnnualReduction').value),
        policyBoostPercent: Number(el('areaPolicyBoost').value)
      }, data);
      el('areaError').hidden = true;
      el('areaProjected').textContent = number(result.totals.projectedAnnualKgCO2);
      el('areaAvoided').textContent = number(result.totals.avoidedAnnualKgCO2);
      el('areaMoney').textContent = result.totals.annualMoneySaved == null
        ? 'Price data incomplete' : `${number(result.totals.annualMoneySaved)} ${result.currency || ''}`.trim();
      el('areaIndices').textContent = `${precise(result.totals.scenarioIndex)} / ${precise(result.totals.benchmarkIndex)}`;
      const status = result.totals.status;
      el('areaVerdict').classList.remove('is-ahead', 'is-on', 'is-behind');
      el('areaVerdict').classList.add(`is-${status}`);
      el('areaStatus').textContent = { ahead: 'Below reference', on: 'At reference', behind: 'Above reference' }[status];
      el('areaInsight').textContent = `${result.areaName}: ${result.insight} Gap to the global reference: ${precise(Math.abs(result.totals.gapIndexPoints))} index points.`;
      const rows = sectors.map(sector => {
        const value = result.sectors[sector.key];
        const tr = document.createElement('tr');
        const cells = [
          sector.label,
          `${number(value.baselineAnnualQuantity)} ${value.unit}`,
          `${number(value.avoidedAnnualQuantity)} ${value.unit}`,
          number(value.avoidedAnnualKgCO2),
          value.annualMoneySaved == null ? 'Price unavailable' : `${number(value.annualMoneySaved)} ${result.currency || ''}`.trim()
        ];
        for (const cell of cells) {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        }
        return tr;
      });
      el('areaSectorRows').replaceChildren(...rows);
      el('areaHealth').textContent = `Health: ${result.health.summary}`;
      const context = result.goal13Context;
      if (context) {
        const observations = context.historicalEmissionsMtCO2e.map(point => `${point.year}: ${number(point.mtCO2e)} Mt CO₂e`).join(' · ');
        el('areaGoal13').textContent = `${context.countryName} historical national GHG: ${observations || 'no observations'}.`;
        const affected = context.latestDirectlyAffectedPer100k;
        el('areaDisaster').textContent = affected
          ? `Separately reported disaster-affected rate (${affected.year}): ${number(affected.per100k)} per 100,000 people. This is not a scenario effect.`
          : 'No reported disaster-affected rate for this country in the workbook.';
      } else {
        el('areaGoal13').textContent = 'Choose a country for historical national Goal 13 context.';
        el('areaDisaster').textContent = '';
      }
      el('areaRaw').textContent = JSON.stringify(result, null, 2);
      el('areaChart').setAttribute('aria-label', `${result.areaName}: modeled CO₂ index ${precise(result.totals.scenarioIndex)} and global GHG reference ${precise(result.totals.benchmarkIndex)} in ${result.targetYear}`);
      draw(result.pathway);
    } catch (error) {
      clearResults();
      el('areaError').hidden = false;
      el('areaError').textContent = error.message;
    }
  }

  function reset() {
    el('areaName').value = data.areaName || 'User-defined area';
    el('areaYear').value = '2030';
    el('areaCountry').value = data.goal13.countries.some(country => country.code === '840' && country.emissions.length) ? '840' : '';
    for (const sector of sectors) {
      el(`area${sector.id}Baseline`).value = data.sectors[sector.key].baselineAnnualQuantity;
      el(`area${sector.id}Unit`).textContent = data.sectors[sector.key].unit;
      el(`area${sector.id}Reduction`).value = sector.key === 'oil' ? '1' : '0';
    }
    el('areaAnnualReduction').value = '0';
    el('areaPolicyBoost').value = '0';
    render();
  }

  el('areaControls').addEventListener('input', render);
  el('areaControls').addEventListener('change', render);
  el('areaReset').addEventListener('click', reset);
  ClimateEngine.loadData().then(loaded => {
    data = loaded;
    for (const country of loaded.goal13.countries.filter(item => item.emissions.length)) {
      el('areaCountry').add(new Option(country.name, country.code));
    }
    el('areaDataStatus').textContent = 'Using illustrative area activity from Data/scenario-data.js and observed country history extracted from Data/Goal13.xlsx. Edit the quantities to model your own area.';
    el('areaControls').disabled = false;
    reset();
  }).catch(error => {
    clearResults();
    el('areaDataStatus').textContent = `Area data could not load: ${error.message}`;
    el('areaError').hidden = false;
    el('areaError').textContent = 'The area simulator requires the Engine and Data files. Check that the repository folders are together.';
  });
})();
