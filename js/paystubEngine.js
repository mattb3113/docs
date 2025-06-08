/**
 * @file paystubEngine.js
 * Pure calculation engine for generating paystub data.
 * This module is responsible for all financial calculations and has no dependencies on the UI.
 * It uses precisionMath for all monetary calculations to avoid floating-point errors.
 */

import { pAdd, pSubtract, pMultiply, pDivide, pRound } from './precisionMath.js';

/**
 * Finds the applicable tax bracket for a given income.
 * @param {number} annualizedIncome - The annualized income.
 * @param {Array<Object>} brackets - The tax brackets for a specific filing status.
 * @returns {Object} The matching tax bracket.
 */
function findTaxBracket(annualizedIncome, brackets) {
    if (!brackets) return null;
    return brackets.find(bracket => annualizedIncome > bracket.over && (annualizedIncome <= bracket.notOver || bracket.notOver === null));
}

/**
 * Calculates tax based on a progressive bracket system.
 * @param {number} annualizedIncome - The annualized income.
 * @param {Array<Object>} brackets - The tax brackets for a specific filing status.
 * @returns {number} The calculated tax for the period.
 */
function calculateBracketTax(annualizedIncome, brackets) {
    const bracket = findTaxBracket(annualizedIncome, brackets);
    if (!bracket) return 0;

    const taxOnBase = bracket.tax;
    const excessIncome = pSubtract(annualizedIncome, bracket.over);
    const taxOnExcess = pMultiply(excessIncome, bracket.rate);

    return pAdd(taxOnBase, taxOnExcess);
}

/**
 * Calculates all pay components, taxes, and deductions.
 *
 * @param {object} userInput - An object containing all user-provided data.
 * @param {object} taxTables - An object containing all tax rate and bracket information.
 * @returns {object} A comprehensive object representing the calculated paystub.
 */
function calculatePaystub(userInput, taxTables) {
    const payPeriods = taxTables.federal.payPeriods[userInput.payFrequency];

    // 1. Calculate Earnings
    const regularHours = Math.min(userInput.hours.regular, 40);
    const overtimeHours = pSubtract(userInput.hours.regular, regularHours);

    const regularPay = pMultiply(regularHours, userInput.payRate.regular);
    const overtimeRate = pMultiply(userInput.payRate.regular, 1.5);
    const overtimePay = pMultiply(overtimeHours, overtimeRate);

    const holidayPay = pMultiply(userInput.hours.holiday, userInput.payRate.holiday);
    const vacationPay = pMultiply(userInput.hours.vacation, userInput.payRate.vacation);
    const sickPay = pMultiply(userInput.hours.sick, userInput.payRate.sick);

    let grossPay = pAdd(regularPay, overtimePay, holidayPay, vacationPay, sickPay);
    grossPay = pAdd(grossPay, ...userInput.otherEarnings.map(e => e.amount));


    // 2. Calculate Pre-tax Deductions
    // These are subtracted before calculating most taxes.
    const preTaxDeductions = userInput.deductions.filter(d => d.type === 'pre-tax');
    const totalPreTaxDeductions = preTaxDeductions.reduce((total, d) => pAdd(total, d.amount), 0);

    // 3. Calculate Federal Taxes
    const federalTaxableGross = pSubtract(grossPay, totalPreTaxDeductions);
    const annualizedFederalTaxableGross = pMultiply(federalTaxableGross, payPeriods);

    const fedTaxBrackets = taxTables.federal.withholding.incomeTax[userInput.filingStatus.federal].brackets;
    const fedAllowanceValue = taxTables.federal.withholding.allowanceValue;
    const fedWithholdingAllowances = pMultiply(userInput.allowances.federal, fedAllowanceValue);
    const annualizedFedTaxableIncome = pSubtract(annualizedFederalTaxableGross, fedWithholdingAllowances);

    const federalTaxAnnual = calculateBracketTax(annualizedFedTaxableIncome, fedTaxBrackets);
    const federalTaxCurrent = pRound(pDivide(federalTaxAnnual, payPeriods));

    // Social Security & Medicare (FICA)
    const socialSecurityLimit = taxTables.federal.withholding.socialSecurity.limit;
    const potentialSSGross = pAdd(userInput.ytd.gross, federalTaxableGross);
    const taxableSSGross = (potentialSSGross > socialSecurityLimit)
        ? Math.max(0, pSubtract(socialSecurityLimit, userInput.ytd.gross))
        : federalTaxableGross;
    const socialSecurityTax = (taxableSSGross > 0) ? pMultiply(taxableSSGross, taxTables.federal.withholding.socialSecurity.rate) : 0;

    const medicareTax = pMultiply(federalTaxableGross, taxTables.federal.withholding.medicare.rate);

    // 4. Calculate NJ State Taxes
    const njTaxTables = taxTables.state.nj;
    const njTaxableGross = pSubtract(grossPay, totalPreTaxDeductions);
    const annualizedNjTaxableGross = pMultiply(njTaxableGross, payPeriods);
    
    const njAllowanceValue = njTaxTables.withholding.allowanceValue;
    const njWithholdingAllowancesValue = pMultiply(userInput.allowances.state, njAllowanceValue);
    const annualizedNjTaxableIncome = pSubtract(annualizedNjTaxableGross, njWithholdingAllowancesValue);
    
    const njRateTable = njTaxTables.withholding.incomeTax.rateTables[userInput.filingStatus.state];
    const njIncomeTaxAnnual = calculateBracketTax(annualizedNjTaxableIncome, njRateTable ? njRateTable.brackets : []);
    const njIncomeTaxCurrent = pRound(pDivide(njIncomeTaxAnnual, payPeriods));

    // NJ SDI, SUI, FLI
    const calculateStateTaxWithLimit = (ytd, currentGross, rate, limit) => {
        if (ytd >= limit) return 0;
        const potentialGross = pAdd(ytd, currentGross);
        const taxableGross = (potentialGross > limit) ? Math.max(0, pSubtract(limit, ytd)) : currentGross;
        return pMultiply(taxableGross, rate);
    };

    const suiTax = calculateStateTaxWithLimit(userInput.ytd.sui, grossPay, njTaxTables.sui.rate, njTaxTables.sui.limit);
    const sdiTax = calculateStateTaxWithLimit(userInput.ytd.sdi, grossPay, njTaxTables.sdi.rate, njTaxTables.sdi.limit);
    const fliTax = calculateStateTaxWithLimit(userInput.ytd.fli, grossPay, njTaxTables.fli.rate, njTaxTables.fli.limit);

    // 5. Calculate Post-tax Deductions
    const postTaxDeductions = userInput.deductions.filter(d => d.type === 'post-tax');
    const totalPostTaxDeductions = postTaxDeductions.reduce((total, d) => pAdd(total, d.amount), 0);

    // 6. Final Calculations (Totals & Net Pay)
    const totalTaxes = pAdd(federalTaxCurrent, socialSecurityTax, medicareTax, njIncomeTaxCurrent, suiTax, sdiTax, fliTax);
    const totalDeductions = pAdd(totalPreTaxDeductions, totalPostTaxDeductions);
    const netPay = pSubtract(grossPay, totalTaxes, totalDeductions);

    // 7. Assemble final paystub object
    const paystub = {
        // Core Pay Info
        grossPay,
        netPay,
        payPeriods,

        // Earnings Breakdown
        earnings: {
            current: [
                { name: 'Regular', rate: userInput.payRate.regular, hours: regularHours, amount: regularPay },
                { name: 'Overtime', rate: overtimeRate, hours: overtimeHours, amount: overtimePay },
                { name: 'Holiday', rate: userInput.payRate.holiday, hours: userInput.hours.holiday, amount: holidayPay },
                { name: 'Vacation', rate: userInput.payRate.vacation, hours: userInput.hours.vacation, amount: vacationPay },
                { name: 'Sick', rate: userInput.payRate.sick, hours: userInput.hours.sick, amount: sickPay },
                ...userInput.otherEarnings.map(e => ({ name: e.name, amount: e.amount }))
            ].filter(e => e.amount > 0),
            ytd: pAdd(userInput.ytd.gross, grossPay)
        },

        // Taxes Breakdown
        taxes: {
            current: [
                { name: 'Federal Income Tax', amount: federalTaxCurrent },
                { name: 'Social Security', amount: socialSecurityTax },
                { name: 'Medicare', amount: medicareTax },
                { name: 'NJ State Income Tax', amount: njIncomeTaxCurrent },
                { name: 'NJ SUI', amount: suiTax },
                { name: 'NJ SDI', amount: sdiTax },
                { name: 'NJ FLI', amount: fliTax },
            ].filter(t => t.amount > 0 && t.amount !== null),
            ytd: pAdd(userInput.ytd.taxes, totalTaxes),
            totalCurrent: totalTaxes
        },

        // Deductions Breakdown
        deductions: {
            preTaxCurrent: preTaxDeductions,
            postTaxCurrent: postTaxDeductions,
            ytd: pAdd(userInput.ytd.deductions, totalDeductions),
            totalCurrent: totalDeductions
        },

        // YTD Summary
        ytd: {
            gross: pAdd(userInput.ytd.gross, grossPay),
            taxes: pAdd(userInput.ytd.taxes, totalTaxes),
            deductions: pAdd(userInput.ytd.deductions, totalDeductions),
            net: pAdd(userInput.ytd.net, netPay)
        }
    };

    return paystub;
}

export { calculatePaystub };
