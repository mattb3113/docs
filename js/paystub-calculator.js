/**
 * @file paystub-calculator.js
 * @description A pure calculation engine for generating New Jersey paystub details.
 * This module is responsible for all financial calculations, including earnings,
 * taxes, deductions, and year-to-date totals. It operates on raw data and has
 * no interaction with the DOM or UI.
 *
 * @version 2.0.0
 * @author Gemini
 * @date 2025-06-08
 */

// Import precision math functions to avoid floating-point errors with currency.
import * as precisionMath from './precisionMath.js';

/**
 * @typedef {object} UserInput
 * @property {number} regularRate - The employee's regular hourly rate.
 * @property {number} regularHours - Hours worked at the regular rate.
 * @property {number} [otRate] - The employee's overtime hourly rate. Defaults to 1.5x regularRate.
 * @property {number} [otHours] - Hours worked at the overtime rate.
 * @property {number} [bonus] - Any bonus amount for this pay period.
 * @property {string} payFrequency - e.g., 'weekly', 'bi-weekly', 'semi-monthly', 'monthly'.
 * @property {string} filingStatus - Federal filing status, e.g., 'single', 'married'.
 * @property {object} ytd - Year-to-date totals before this pay period.
 * @property {number} ytd.gross - YTD gross earnings.
 * @property {number} ytd.federalTax - YTD federal income tax withheld.
 * @property {number} ytd.socialSecurity - YTD Social Security tax.
 * @property {number} ytd.medicare - YTD Medicare tax.
 * @property {number} ytd.njStateTax - YTD NJ state income tax.
 * @property {number} ytd.sui - YTD NJ SUI/WF tax.
 * @property {number} ytd.sdi - YTD NJ SDI tax.
 * @property {number} ytd.fli - YTD NJ FLI tax.
 * @property {Array<object>} [deductions] - Optional array of other deductions.
 */

/**
 * @typedef {object} PaystubResult
 * @property {object} earnings - Details of current and YTD earnings.
 * @property {object} taxes - Details of all calculated taxes.
 * @property {object} totals - Summary totals for the current period.
 * @property {object} newYTD - The new year-to-date totals including this pay period.
 */


// --- Helper Functions ---

/**
 * Gets the number of pay periods in a year for a given frequency.
 * @param {string} frequency - The pay frequency.
 * @returns {number} The number of pay periods.
 */
const getPayPeriodsPerYear = (frequency) => {
    switch (frequency) {
        case 'weekly': return 52;
        case 'bi-weekly': return 26;
        case 'semi-monthly': return 24;
        case 'monthly': return 12;
        default:
            console.warn(`Unknown pay frequency: ${frequency}. Defaulting to 1.`);
            return 1;
    }
};

/**
 * Calculates tax on earnings that are subject to an annual wage limit.
 * @param {number} currentGross - The gross pay for the current period.
 * @param {number} ytdGross - The year-to-date gross pay before this period.
 * @param {number} rate - The tax rate.
 * @param {number} limit - The annual wage limit.
 * @returns {number} The calculated tax for the current period.
 */
const calculateTaxWithLimit = (currentGross, ytdGross, rate, limit) => {
    if (ytdGross >= limit) {
        return 0; // The limit has already been reached.
    }
    const remainingTaxable = precisionMath.subtract(limit, ytdGross);
    const taxableForCurrentPeriod = Math.min(currentGross, remainingTaxable);
    return precisionMath.multiply(taxableForCurrentPeriod, rate);
};

// --- Core Calculation Logic ---

/**
 * Calculates current earnings (regular, OT, bonus, gross).
 * @param {UserInput} userInput - The user-provided input data.
 * @returns {{regularPay: number, otPay: number, bonus: number, currentGross: number}}
 */
const _calculateEarnings = (userInput) => {
    const regularRate = userInput.regularRate || 0;
    const regularHours = userInput.regularHours || 0;
    const otHours = userInput.otHours || 0;
    const bonus = userInput.bonus || 0;

    // OT rate defaults to 1.5x regular rate if not specified.
    const otRate = userInput.otRate || precisionMath.multiply(regularRate, 1.5);

    const regularPay = precisionMath.multiply(regularRate, regularHours);
    const otPay = precisionMath.multiply(otRate, otHours);

    // currentGross = regularPay + otPay + bonus
    const grossPay = precisionMath.add(precisionMath.add(regularPay, otPay), bonus);

    return {
        regularPay: regularPay,
        otPay: otPay,
        bonus: bonus,
        currentGross: grossPay,
    };
};

/**
 * Calculates all federal taxes (Income, FICA).
 * @param {number} currentGross - Gross pay for the current period.
 * @param {number} annualizedGross - The projected annual gross income.
 * @param {UserInput} userInput - The user-provided input data.
 * @param {object} taxData - The tax tables data.
 * @returns {{federalIncome: number, socialSecurity: number, medicare: number}}
 */
const _calculateFederalTaxes = (currentGross, annualizedGross, userInput, taxData) => {
    const { filingStatus, ytd, payFrequency } = userInput;
    const { federal, fica } = taxData;

    // 1. Federal Income Tax
    const standardDeduction = federal.standard_deductions[filingStatus] || 0;
    const taxableIncome = Math.max(0, precisionMath.subtract(annualizedGross, standardDeduction));
    const brackets = federal.tax_brackets[filingStatus];
    
    let annualFederalTax = 0;
    let remainingTaxable = taxableIncome;

    // Iterate backwards through the brackets to calculate marginal tax
    for (let i = brackets.length - 1; i >= 0; i--) {
        const bracket = brackets[i];
        if (remainingTaxable > bracket.from) {
            const taxableInBracket = precisionMath.subtract(remainingTaxable, bracket.from);
            annualFederalTax = precisionMath.add(annualFederalTax, precisionMath.multiply(taxableInBracket, bracket.rate));
            remainingTaxable = bracket.from;
        }
    }
    const payPeriods = getPayPeriodsPerYear(payFrequency);
    const federalIncome = precisionMath.divide(annualFederalTax, payPeriods);


    // 2. FICA Taxes (Social Security & Medicare)
    const ytdGross = ytd.gross || 0;
    const socialSecurity = calculateTaxWithLimit(
        currentGross,
        ytdGross,
        fica.social_security.rate,
        fica.social_security.wage_limit
    );

    let medicare = precisionMath.multiply(currentGross, fica.medicare.rate);
    // Check for additional Medicare tax
    if (annualizedGross > fica.medicare.additional_rate_threshold) {
         const ytdPlusCurrent = precisionMath.add(ytdGross, currentGross);
         const amountOverThreshold = precisionMath.subtract(ytdPlusCurrent, fica.medicare.additional_rate_threshold);
         if (amountOverThreshold > 0) {
            const prevAmountOverThreshold = Math.max(0, precisionMath.subtract(ytdGross, fica.medicare.additional_rate_threshold));
            const newTaxableAmount = precisionMath.subtract(amountOverThreshold, prevAmountOverThreshold);
            if (newTaxableAmount > 0) {
                 const additionalMedicare = precisionMath.multiply(newTaxableAmount, fica.medicare.additional_rate);
                 medicare = precisionMath.add(medicare, additionalMedicare);
            }
         }
    }
    
    return { federalIncome, socialSecurity, medicare };
};

/**
 * Calculates all New Jersey state taxes.
 * @param {number} currentGross - Gross pay for the current period.
 * @param {number} annualizedGross - The projected annual gross income.
 * @param {UserInput} userInput - The user-provided input data.
 * @param {object} taxData - The tax tables data.
 * @returns {{njIncome: number, sui: number, sdi: number, fli: number}}
 */
const _calculateNewJerseyTaxes = (currentGross, annualizedGross, userInput, taxData) => {
    const { ytd, payFrequency } = userInput;
    const { new_jersey } = taxData;
    const ytdGross = ytd.gross || 0;

    // 1. NJ State Income Tax (using the 'single' bracket as per data structure)
    const brackets = new_jersey.income_tax_brackets.single;
    let annualNjTax = 0;
    let remainingTaxable = annualizedGross;
    
    for (let i = brackets.length - 1; i >= 0; i--) {
        const bracket = brackets[i];
        if (remainingTaxable > bracket.from) {
            const taxableInBracket = precisionMath.subtract(remainingTaxable, bracket.from);
            annualNjTax = precisionMath.add(annualNjTax, precisionMath.multiply(taxableInBracket, bracket.rate));
            remainingTaxable = bracket.from;
        }
    }
    const payPeriods = getPayPeriodsPerYear(payFrequency);
    const njIncome = precisionMath.divide(annualNjTax, payPeriods);
    
    // 2. Other NJ Taxes with wage limits
    const sui = calculateTaxWithLimit(currentGross, ytdGross, new_jersey.unemployment_insurance_workforce_development.rate, new_jersey.unemployment_insurance_workforce_development.wage_limit);
    const sdi = calculateTaxWithLimit(currentGross, ytdGross, new_jersey.disability_insurance.rate, new_jersey.disability_insurance.wage_limit);
    const fli = calculateTaxWithLimit(currentGross, ytdGross, new_jersey.family_leave_insurance.rate, new_jersey.family_leave_insurance.wage_limit);

    return { njIncome, sui, sdi, fli };
};


/**
 * The main calculation function. It orchestrates the entire paystub calculation process.
 * @param {UserInput} userInput - An object containing all form data.
 * @param {object} taxData - An object containing all the tax tables and rates.
 * @returns {PaystubResult | null} A detailed object with all calculated values, or null if inputs are invalid.
 */
export async function calculatePaystub(userInput, taxData) {
    if (!userInput || !taxData) {
        console.error("Invalid input or tax data provided to calculator.");
        return null;
    }

    // --- 1. Calculate Earnings ---
    const { regularPay, otPay, bonus, currentGross } = _calculateEarnings(userInput);

    // --- 2. Annualize Gross Pay for Tax Calculations ---
    const payPeriods = getPayPeriodsPerYear(userInput.payFrequency);
    const annualizedGross = precisionMath.multiply(currentGross, payPeriods);

    // --- 3. Calculate Taxes ---
    const { federalIncome, socialSecurity, medicare } = _calculateFederalTaxes(currentGross, annualizedGross, userInput, taxData);
    const { njIncome, sui, sdi, fli } = _calculateNewJerseyTaxes(currentGross, annualizedGross, userInput, taxData);

    // --- 4. Calculate Totals ---
    let totalTaxes = 0;
    totalTaxes = precisionMath.add(totalTaxes, federalIncome);
    totalTaxes = precisionMath.add(totalTaxes, socialSecurity);
    totalTaxes = precisionMath.add(totalTaxes, medicare);
    totalTaxes = precisionMath.add(totalTaxes, njIncome);
    totalTaxes = precisionMath.add(totalTaxes, sui);
    totalTaxes = precisionMath.add(totalTaxes, sdi);
    totalTaxes = precisionMath.add(totalTaxes, fli);
    
    // In a real app, you would add other pre and post-tax deductions here.
    const totalDeductions = totalTaxes;
    const netPay = precisionMath.subtract(currentGross, totalDeductions);

    // --- 5. Calculate New YTD Totals ---
    const ytd = userInput.ytd || {};
    const newYTD = {
        gross: precisionMath.add(ytd.gross || 0, currentGross),
        federalTax: precisionMath.add(ytd.federalTax || 0, federalIncome),
        socialSecurity: precisionMath.add(ytd.socialSecurity || 0, socialSecurity),
        medicare: precisionMath.add(ytd.medicare || 0, medicare),
        njStateTax: precisionMath.add(ytd.njStateTax || 0, njIncome),
        sui: precisionMath.add(ytd.sui || 0, sui),
        sdi: precisionMath.add(ytd.sdi || 0, sdi),
        fli: precisionMath.add(ytd.fli || 0, fli),
    };

    // --- 6. Assemble and Return the Final Paystub Object ---
    return {
        earnings: {
            regularPay,
            otPay,
            bonus,
            currentGross,
        },
        taxes: {
            federal: {
                income: federalIncome,
                socialSecurity,
                medicare,
            },
            nj: {
                income: njIncome,
                sui, // State Unemployment Insurance / Workforce Development
                sdi, // State Disability Insurance
                fli, // Family Leave Insurance
            },
        },
        totals: {
            grossPay: currentGross,
            totalDeductions,
            netPay,
        },
        newYTD: newYTD,
    };
}
