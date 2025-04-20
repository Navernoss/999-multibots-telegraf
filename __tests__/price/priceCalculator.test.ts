import {
  conversionRates,
  calculateCost,
  formatCost,
  generateCostMessage,
  stepOptions,
  costDetails,
} from '../../src/price/priceCalculator'

describe('calculateCost', () => {
  it('calculates correct cost details', () => {
    const steps = 1000
    const result = calculateCost(steps)
    expect(result.steps).toBe(steps)
    // stars = steps * costPerStepInStars
    expect(result.stars).toBe(steps * conversionRates.costPerStepInStars)
    // dollars = stars * costPerStarInDollars
    expect(result.dollars).toBe(
      result.stars * conversionRates.costPerStarInDollars
    )
    // rubles = dollars * rublesToDollarsRate
    expect(result.rubles).toBe(
      result.dollars * conversionRates.rublesToDollarsRate
    )
  })
})

describe('formatCost', () => {
  const sample = { steps: 1500, stars: 1500 * conversionRates.costPerStepInStars, dollars: 0, rubles: 0 }
  it('formats cost for Russian locale', () => {
    const msg = formatCost({ ...sample, dollars: 0, rubles: 600 }, true)
    // Should match pattern: '1500 шагов - <stars>⭐ / <rubles>₽'
    expect(msg).toBe(
      `${sample.steps} шагов - ${sample.stars.toFixed(0)}⭐ / ${600}₽`
    )
  })

  it('formats cost for English locale', () => {
    const msg = formatCost({ ...sample, dollars: 4, rubles: 0 }, false)
    expect(msg).toBe(
      `${sample.steps} steps - ${sample.stars.toFixed(0)}⭐ / $${4.toFixed(2)}`
    )
  })
})

describe('generateCostMessage', () => {
  it('generates message with list of costs for Russian locale', () => {
    const subset = costDetails.slice(0, 2)
    const msg = generateCostMessage(subset, true)
    // Should start with Russian base text
    expect(msg).toMatch(/^🔢 Пожалуйста, выберите количество шагов/)
    // Should contain formatted cost lines
    subset.forEach(detail => {
      const line = `${detail.steps} шагов - ${detail.stars.toFixed(0)}⭐ / ${
        detail.rubles.toFixed(0)
      }₽`
      expect(msg).toContain(line)
    })
  })

  it('generates message with list of costs for English locale', () => {
    const subset = costDetails.slice(1, 3)
    const msg = generateCostMessage(subset, false)
    expect(msg).toMatch(/^🔢 Please choose the number of steps/)
    subset.forEach(detail => {
      const line = `${detail.steps} steps - ${detail.stars.toFixed(0)}⭐ / $${
        detail.dollars.toFixed(2)
      }`
      expect(msg).toContain(line)
    })
  })
})

describe('stepOptions and costDetails arrays', () => {
  it('stepOptions and costDetails have same length', () => {
    expect(stepOptions.length).toBe(costDetails.length)
  })
  it('costDetails elements match calculateCost for corresponding steps', () => {
    stepOptions.forEach((s, idx) => {
      const expected = calculateCost(s)
      expect(costDetails[idx]).toEqual(expected)
    })
  })
})