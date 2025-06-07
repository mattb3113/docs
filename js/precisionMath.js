/*
    BuellDocs Precision Math Module
    Description: Wraps math.js configured with BigNumber for high-precision,
                 decimal-safe financial calculations.
*/

// Ensure math.js is loaded from a CDN before this script runs.
if (typeof math === 'undefined') {
    console.error('Math.js library not found. Please include it from a CDN.');
} else {
    // Configure math.js to use BigNumber for all calculations
    math.config({
        number: 'BigNumber',
        precision: 64 // Default precision
    });
}

/**
 * Parses a value into a BigNumber, cleaning currency symbols and commas.
 * @param {string|number} value The value to parse.
 * @returns {math.BigNumber} A BigNumber instance.
 */
const toBig = (value) => {
    if (value === null || typeof value === 'undefined') return math.bignumber(0);
    const cleanedValue = String(value).replace(/[^0-9.-]+/g, '');
    return math.bignumber(cleanedValue || 0);
};

/**
 * A safe addition function.
 * @param {...(string|number)} args Numbers to add.
 * @returns {math.BigNumber} The sum as a BigNumber.
 */
const add = (...args) => args.reduce((acc, val) => math.add(acc, toBig(val)), math.bignumber(0));

/**
 * A safe subtraction function.
 * @param {string|number} a The number to subtract from.
 * @param {string|number} b The number to subtract.
 * @returns {math.BigNumber} The difference as a BigNumber.
 */
const sub = (a, b) => math.subtract(toBig(a), toBig(b));

/**
 * A safe multiplication function.
 * @param {...(string|number)} args Numbers to multiply.
 * @returns {math.BigNumber} The product as a BigNumber.
 */
const mul = (...args) => args.reduce((acc, val) => math.multiply(acc, toBig(val)), math.bignumber(1));

/**
 * A safe division function.
 * @param {string|number} a The dividend.
 * @param {string|number} b The divisor.
 * @returns {math.BigNumber} The quotient as a BigNumber.
 */
const div = (a, b) => {
    const bigB = toBig(b);
    if (bigB.isZero()) return math.bignumber(0);
    return math.divide(toBig(a), bigB);
};

/**
 * Formats a BigNumber into a standard currency string (e.g., "$1,234.56").
 * @param {math.BigNumber|number|string} value The number to format.
 * @returns {string} The formatted currency string.
 */
const format = (value) => {
    const num = toBig(value).toNumber();
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Export the functions for use in other modules
window.precisionMath = {
    toBig,
    add,
    sub,
    mul,
    div,
    format
};
