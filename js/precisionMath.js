/**
 * @module precisionMath
 * @description Provides functions for precise mathematical operations to avoid floating-point inaccuracies.
 * This is crucial for financial calculations where correctness is paramount.
 */

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} value The number to round.
 * @param {number} decimals The number of decimal places to round to.
 * @returns {number} The rounded number.
 */
export function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

/**
 * Formats a number as a currency string (e.g., 1234.5 -> "1,234.50").
 * @param {number} value The number to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        return "0.00";
    }
    const fixedValue = value.toFixed(2);
    const parts = fixedValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
