/**
 * paystub-calculator.js
 * @description Advanced calculation engine for generating detailed paystubs.
 * This class consumes form data and tax tables to perform all mathematical
 * operations with precision, with specific logic for New Jersey.
 * @dependency A precision math library like math.js must be available in the global scope.
 * All financial values are handled as BigNumber objects to prevent floating-point errors.
 */

// Assuming 'math.js' is loaded globally.
const { bignumber, add, subtract, multiply, divide, larger, smaller, equal } = math;

class PaystubCalculator {
    /**
     * Initializes the calculator with the necessary tax rate tables.
     * @param {object} taxTables - The tax data, typically from tax-tables.js or a JSON file.
     */
    constructor(taxTables) {
        if (!taxTables) {
            throw new Error("Tax tables are required to initialize the PaystubCalculator.");
        }
        this.taxTables = taxTables;
    }

    /**
     * Main calculation method.
     * Orchestrates the entire paystub calculation process.
     * @param {object} formData - An object containing all form data (earnings, deductions, employee info, etc.).
     * @returns {object} A comprehensive results object with all calculated values.
     */
    calculate(formData) {
        // --- 0. Initialize and Extract Data ---
        const { earnings, deductions, ytd, payFrequency, filingStatus, allowances = 0, isNewarkResident = false } = formData;
        const payPeriodsPerYear = { 'Weekly': 52, 'Bi-Weekly': 26, 'Semi-Monthly': 24, 'Monthly': 12 }[payFrequency];
        if (!payPeriodsPerYear) {
            throw new Error(`Invalid pay frequency: ${payFrequency}`);
        }

        const results = {
            current: {},
            ytd: { ...ytd }
        };

        // --- 1. Calculate Gross Pay ---
        const grossPayResult = this.calculateGrossPay(earnings);
        results.current.grossPay = grossPayResult.total;
        results.current.earnings = grossPayResult.breakdown;

        // --- 2. Calculate Pre-Tax Deductions & Taxable Income ---
        const deductionsResult = this.calculateDeductions(results.current.grossPay, deductions);
        results.current.deductions = deductionsResult;
        const taxableIncome = deductionsResult.taxableGross;

        // --- 3. Calculate Taxes ---
        const federalTaxes = this.calculateFederalTaxes(taxableIncome, ytd.gross, filingStatus, allowances, payPeriodsPerYear);
        const njStateTaxes = this.calculateNJStateTaxes(taxableIncome, ytd.gross, filingStatus, payPeriodsPerYear, isNewarkResident);
        
        results.current.taxes = { ...federalTaxes, ...njStateTaxes };
        results.current.totalTaxes = Object.values(results.current.taxes).reduce((sum, tax) => add(sum, tax), bignumber(0));

        // --- 4. Calculate Net Pay (Gross - All Taxes - All Deductions) ---
        const totalDeductions = add(deductionsResult.preTax.total, deductionsResult.postTax.total);
        results.current.netPay = this.calculateNetPay(results.current.grossPay, results.current.totalTaxes, totalDeductions);
        
        // --- 5. Update YTD Totals ---
        results.ytd = this.updateYTDTotals(ytd, results.current);

        return results;
    }

    /**
     * Calculates total gross pay from various earning types.
     * @param {Array<object>} earnings - Array of earning objects { type, rate, hours }.
     * @returns {{total: math.BigNumber, breakdown: Array<object>}}
     */
    calculateGrossPay(earnings = []) {
        let totalGross = bignumber(0);
        const breakdown = earnings.map(earning => {
            const rate = bignumber(earning.rate || 0);
            const hours = bignumber(earning.hours || 0);
            let amount = bignumber(0);

            switch (earning.type.toLowerCase()) {
                case 'regular':
                    amount = multiply(rate, hours);
                    break;
                case 'overtime':
                    amount = multiply(multiply(rate, 1.5), hours);
                    break;
                case 'double-time':
                    amount = multiply(multiply(rate, 2), hours);
                    break;
                case 'salary':
                default:
                    amount = rate;
                    break;
            }
            totalGross = add(totalGross, amount);
            return { ...earning, amount };
        });

        return { total: totalGross, breakdown };
    }

    /**
     * Calculates pre-tax and post-tax deductions and the resulting taxable gross income.
     * @param {math.BigNumber} grossPay - The total gross pay for the period.
     * @param {Array<object>} deductions - Array of deduction objects { description, amount, type: 'pre-tax'|'post-tax' }.
     * @returns {object} An object with deduction breakdowns and taxable gross.
     */
    calculateDeductions(grossPay, deductions = []) {
        const result = {
            preTax: { total: bignumber(0), breakdown: [] },
            postTax: { total: bignumber(0), breakdown: [] },
            taxableGross: bignumber(grossPay)
        };

        deductions.forEach(ded => {
            const amount = bignumber(ded.amount || 0);
            if (ded.type === 'pre-tax') {
                result.preTax.total = add(result.preTax.total, amount);
                result.preTax.breakdown.push(ded);
            } else {
                result.postTax.total = add(result.postTax.total, amount);
                result.postTax.breakdown.push(ded);
            }
        });

        result.taxableGross = subtract(grossPay, result.preTax.total);
        return result;
    }

    /**
     * Calculates all federal taxes for the period.
     * @param {math.BigNumber} taxableGross - Gross pay after pre-tax deductions.
     * @param {math.BigNumber} ytdGross - Year-to-date gross pay.
     * @param {string} filingStatus - e.g., 'Single', 'MarriedJ'.
     * @param {number} allowances - Number of federal allowances.
     * @param {number} payPeriodsPerYear - The number of pay periods in a year.
     * @returns {{fit: math.BigNumber, socialSecurity: math.BigNumber, medicare: math.BigNumber}}
     */
    calculateFederalTaxes(taxableGross, ytdGross, filingStatus, allowances, payPeriodsPerYear) {
        const { federal, fica } = this.taxTables;
        
        // 1. Federal Income Tax (FIT) - Percentage Method
        const annualizedTaxable = multiply(taxableGross, payPeriodsPerYear);
        const standardDeduction = bignumber(federal.standardDeductions[filingStatus] || 0);
        const taxableIncomeAfterDeductions = larger(annualizedTaxable, standardDeduction) ? subtract(annualizedTaxable, standardDeduction) : bignumber(0);
        
        let annualTax = this._calculateBracketedTax(taxableIncomeAfterDeductions, federal.taxBrackets[filingStatus]);
        const fit = larger(annualTax, 0) ? divide(annualTax, payPeriodsPerYear) : bignumber(0);
        
        // 2. Social Security
        const ssLimit = bignumber(fica.socialSecurity.wageLimit);
        const potentialYtdGross = add(ytdGross, taxableGross);
        const taxableSs = larger(potentialYtdGross, ssLimit) 
            ? subtract(ssLimit, ytdGross) 
            : taxableGross;
        const socialSecurity = larger(taxableSs, 0) ? multiply(taxableSs, fica.socialSecurity.rate) : bignumber(0);

        // 3. Medicare
        const medicareThreshold = bignumber(fica.medicare.additionalRateThreshold);
        let medicare = multiply(taxableGross, fica.medicare.rate);
        
        // Additional Medicare Tax
        if (larger(potentialYtdGross, medicareThreshold)) {
            const amountOverThreshold = subtract(potentialYtdGross, medicareThreshold);
            const prevAmountOverThreshold = larger(ytdGross, medicareThreshold) ? subtract(ytdGross, medicareThreshold) : bignumber(0);
            const newTaxableAmount = subtract(amountOverThreshold, prevAmountOverThreshold);
            
            if (larger(newTaxableAmount, 0)) {
                const additionalMedicare = multiply(newTaxableAmount, fica.medicare.additionalRate);
                medicare = add(medicare, additionalMedicare);
            }
        }
        
        return { fit, socialSecurity, medicare };
    }

    /**
     * Calculates all New Jersey state taxes for the period.
     * @param {math.BigNumber} taxableGross - Gross pay after pre-tax deductions.
     * @param {math.BigNumber} ytdGross - Year-to-date gross pay.
     * @param {string} filingStatus - e.g., 'Single'.
     * @param {number} payPeriodsPerYear - The number of pay periods in a year.
     * @param {boolean} isNewarkResident - Flag for applying Newark city tax.
     * @returns {object} An object containing all calculated NJ taxes.
     */
    calculateNJStateTaxes(taxableGross, ytdGross, filingStatus, payPeriodsPerYear, isNewarkResident) {
        const { nj } = this.taxTables;
        const annualizedTaxable = multiply(taxableGross, payPeriodsPerYear);
        
        // NJ State Income Tax
        const annualNjTax = this._calculateBracketedTax(annualizedTaxable, nj.taxBrackets[filingStatus] || nj.taxBrackets['Single']);
        const njStateTax = larger(annualNjTax, 0) ? divide(annualNjTax, payPeriodsPerYear) : bignumber(0);

        const _calcCappedTax = (rate, limit) => {
            const bigLimit = bignumber(limit);
            const potentialYtd = add(ytdGross, taxableGross);
            const taxableAmount = larger(potentialYtd, bigLimit) 
                ? subtract(bigLimit, ytdGross) 
                : taxableGross;
            return larger(taxableAmount, 0) ? multiply(taxableAmount, rate) : bignumber(0);
        };
        
        const njSdi = _calcCappedTax(nj.sdi.rate, nj.sdi.wageLimit);
        const njFli = _calcCappedTax(nj.fli.rate, nj.fli.wageLimit);
        const newarkTax = isNewarkResident ? multiply(taxableGross, 0.01) : bignumber(0);

        return { njStateTax, njSdi, njFli, newarkTax };
    }

    /**
     * Calculates the final net pay.
     * @param {math.BigNumber} grossPay - The total gross pay.
     * @param {math.BigNumber} totalTaxes - The sum of all calculated taxes.
     * @param {math.BigNumber} totalDeductions - The sum of all pre and post-tax deductions.
     * @returns {math.BigNumber} The final net pay.
     */
    calculateNetPay(grossPay, totalTaxes, totalDeductions) {
        const totalReductions = add(totalTaxes, totalDeductions);
        return subtract(grossPay, totalReductions);
    }
    
    /**
     * Updates YTD totals with the current period's values.
     * @param {object} currentYTDs - The year-to-date values before this period.
     * @param {object} currentValues - The calculated values for the current period.
     * @returns {object} The new, updated YTD totals.
     */
    updateYTDTotals(currentYTDs, currentValues) {
        const newYTDs = {};
        const fieldsToUpdate = ['grossPay', 'netPay', 'totalTaxes'];

        Object.keys(currentValues.taxes).forEach(taxKey => fieldsToUpdate.push(taxKey));
        
        fieldsToUpdate.forEach(field => {
            newYTDs[field] = add(currentYTDs[field] || 0, currentValues[field] || 0);
        });

        newYTDs.earnings = (currentYTDs.earnings || []).map(ytdEarning => {
            const currentEarning = currentValues.earnings.find(c => c.type === ytdEarning.type);
            return {
                ...ytdEarning,
                amount: add(ytdEarning.amount, currentEarning ? currentEarning.amount : 0)
            };
        });

        newYTDs.deductions = {
            preTax: { total: add(currentYTDs.deductions?.preTax.total || 0, currentValues.deductions.preTax.total) },
            postTax: { total: add(currentYTDs.deductions?.postTax.total || 0, currentValues.deductions.postTax.total) }
        };

        return newYTDs;
    }

    /**
     * A generic helper to calculate tax based on income brackets.
     * @private
     * @param {math.BigNumber} income - The annualized taxable income.
     * @param {Array<object>} brackets - The array of tax brackets for a given filing status.
     * @returns {math.BigNumber} The total calculated annual tax.
     */
    _calculateBracketedTax(income, brackets = []) {
        let tax = bignumber(0);
        let remainingIncome = bignumber(income);
        
        if (equal(remainingIncome, 0) || larger(0, remainingIncome)) {
            return tax;
        }

        for (const bracket of brackets) {
            const from = bignumber(bracket.from);
            const to = bracket.to === 'Infinity' ? bignumber(Infinity) : bignumber(bracket.to);
            
            if (larger(income, from)) {
                const taxableInBracket = smaller(subtract(to, from), subtract(income, from));
                tax = add(tax, multiply(taxableInBracket, bracket.rate));
            }
        }
        return tax;
    }
}

export default PaystubCalculator;

// module.exports = PaystubCalculator; // For Node or bundlers if needed.
