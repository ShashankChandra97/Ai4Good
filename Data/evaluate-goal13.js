/* One-year holdout check for national GHG reference models; not area validation. */
const context = require('./goal13-context.js');

const errors = { unchanged: [], linear: [] };
for (const country of context.countries) {
  const values = [2020, 2021, 2022].map(year =>
    country.emissions.find(point => point.year === year)?.mtCO2e);
  if (values.some(value => value == null) || values[2] <= 0) continue;
  const [year2020, year2021, actual2022] = values;
  errors.unchanged.push(Math.abs(actual2022 - year2021) / actual2022 * 100);
  errors.linear.push(Math.abs(actual2022 - (2 * year2021 - year2020)) / actual2022 * 100);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

console.log(JSON.stringify({
  evaluatedCountries: errors.unchanged.length,
  heldOutYear: 2022,
  medianAbsolutePercentageError: {
    unchanged2021: median(errors.unchanged),
    linear2020to2021: median(errors.linear)
  },
  interpretation: 'One-year country-level check only; it does not validate 2030/2035 or area-level forecasts.'
}, null, 2));
