const taxConfig = require('./taxConfig.json');

/**
 * Calculates the federal income tax based on annual wages and filing status.
 * @param {number} annualWages - The total annual wages.
 * @param {string} filingStatus - The filing status ('Single' or 'Married').
 * @returns {number} The calculated annual federal tax.
 */
function calculateFederalTax(annualWages, filingStatus) {
    const statusKey = filingStatus === 'Married' ? 'marriedFilingJointly' : 'single';
    const brackets = taxConfig.federal.taxBrackets[statusKey];
    let totalTax = 0;
    let taxableIncome = annualWages;

    for (let i = brackets.length - 1; i >= 0; i--) {
        const bracket = brackets[i];
        if (taxableIncome > bracket.over) {
            const amountInBracket = taxableIncome - bracket.over;
            totalTax += amountInBracket * bracket.rate;
            taxableIncome = bracket.over;
        }
    }
    return totalTax;
}

/**
 * Calculates the New Jersey state income tax.
 * It first applies deductions for allowances before finding the correct tax bracket.
 * @param {number} annualWages - The total annual wages.
 * @param {number} njAllowances - The number of New Jersey allowances claimed.
 * @returns {number} The calculated annual New Jersey tax.
 */
function calculateNjTax(annualWages, njAllowances) {
    const allowanceValue = taxConfig.newJersey.perAllowanceDeduction;
    const totalDeduction = njAllowances * allowanceValue;
    const taxableIncome = Math.max(0, annualWages - totalDeduction);

    // Assuming Rate A for this calculation as no specific rate was requested.
    const brackets = taxConfig.newJersey.taxBrackets.rateA;
    let totalTax = 0;

    for (const bracket of brackets) {
        if (taxableIncome <= (bracket.max || Infinity)) {
            const taxableInBracket = taxableIncome - bracket.min;
            totalTax += taxableInBracket * bracket.rate;
            break; 
        } else {
            const taxableInBracket = bracket.max - bracket.min;
            totalTax += taxableInBracket * bracket.rate;
        }
    }

    return totalTax;
}

/**
 * Main exported function to calculate both federal and NJ taxes.
 * @param {object} options - The calculation options.
 * @param {number} options.annualWages - The total annual wages.
 * @param {string} options.filingStatus - The filing status ('Single' or 'Married').
 * @param {number} options.njAllowances - The number of New Jersey allowances claimed.
 * @returns {{federalTax: number, njTax: number}} An object containing the calculated taxes.
 */
function calculateTaxes({ annualWages, filingStatus, njAllowances }) {
    const federalTax = calculateFederalTax(annualWages, filingStatus);
    const njTax = calculateNjTax(annualWages, njAllowances);

    return {
        federalTax: parseFloat(federalTax.toFixed(2)),
        njTax: parseFloat(njTax.toFixed(2))
    };
}

module.exports = {
    calculateTaxes
};
