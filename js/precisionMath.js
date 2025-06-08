/**
 * @module precisionMath
 * @description Provides functions for performing basic arithmetic operations on numbers
 * with a fixed precision, specifically designed to avoid floating-point inaccuracies
 * common with monetary calculations in JavaScript.
 *
 * Standard floating-point arithmetic can lead to errors like 0.1 + 0.2 !== 0.3.
 * To solve this, we perform calculations using integers by scaling the numbers up
 * by a factor (e.g., 100 to work with cents for USD), performing the operation,
 * and then scaling them back down.
 */
const precisionMath = (() => {
  // The number of decimal places to work with. For USD (dollars and cents), this is 2.
  const PRECISION = 2;
  const FACTOR = Math.pow(10, PRECISION);

  /**
   * Converts a float to an integer for safe calculations.
   * @param {number} num - The number to convert.
   * @returns {number} The integer representation.
   */
  const toInteger = (num) => {
    return Math.round(num * FACTOR);
  };

  /**
   * Converts an integer back to a float after calculations.
   * @param {number} num - The integer to convert.
   * @returns {number} The float representation.
   */
  const toFloat = (num) => {
    return num / FACTOR;
  };

  /**
   * Adds two numbers with precision.
   * @param {number} a - The first number.
   * @param {number} b - The second number.
   * @returns {number} The sum of a and b.
   */
  const add = (a, b) => {
    const intA = toInteger(a);
    const intB = toInteger(b);
    return toFloat(intA + intB);
  };

  /**
   * Subtracts one number from another with precision.
   * @param {number} a - The number to subtract from.
   * @param {number} b - The number to subtract.
   * @returns {number} The difference between a and b.
   */
  const subtract = (a, b) => {
    const intA = toInteger(a);
    const intB = toInteger(b);
    return toFloat(intA - intB);
  };

  /**
   * Multiplies two numbers. This is useful for calculations like
   * (hourly rate * hours worked).
   * @param {number} a - The first number (e.g., monetary value).
   * @param {number} b - The second number (e.g., a scalar quantity).
   * @returns {number} The product of a and b.
   */
  const multiply = (a, b) => {
    // To multiply, we only need to convert one number to an integer,
    // perform the multiplication, and then convert the result back to a float.
    // This avoids excessively large intermediate numbers.
    const result = toInteger(a) * b;
    return toFloat(result);
  };

  /**
   * Divides one number by another.
   * @param {number} a - The dividend (e.g., total amount).
   * @param {number} b - The divisor.
   * @returns {number} The quotient of a and b.
   */
  const divide = (a, b) => {
    // To maintain precision, we scale up the dividend before division.
    const intA = toInteger(a);
    // We do not scale the result back down as the scaling is effectively part of the division.
    return intA / b / FACTOR;
  };
  
  /**
   * Formats a number as a currency string (e.g., 1234.5 -> "$1,234.50").
   * @param {number} num - The number to format.
   * @returns {string} The formatted currency string.
   */
  const format = (num) => {
    const fixedNum = (Math.round(num * 100) / 100).toFixed(2);
    const parts = fixedNum.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$${parts.join('.')}`;
  };


  // Expose the public methods
  return {
    add,
    subtract,
    multiply,
    divide,
    format,
  };
})();
