/**
 * @module paystub-calculator
 * @description Handles all the logic for calculating earnings, deductions, and taxes.
 */
import { taxTables } from './tax-tables.js';
import { round } from './precisionMath.js';

/**
 * Calculates all financial details for a paystub based on form input.
 * @param {object} formData The data from the input form.
 * @returns {object} An object containing all calculated paystub values.
 */
export function calculatePaystub(formData) {
    const tables = taxTables.getTables();
    if (!tables) {
        throw new Error("Tax tables are not loaded.");
    }

    // Parse numeric inputs from form data
    const regularRate = parseFloat(formData.regularRate) || 0;
    const regularHours = parseFloat(formData.regularHours) || 0;
    const otRate = parseFloat(formData.otRate) || regularRate * 1.5;
    const otHours = parseFloat(formData.otHours) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const ytdGross = parseFloat(formData.ytdGross) || 0;
    const payFrequency = formData.payFrequency;

    // --- Earnings ---
    const regularPay = round(regularRate * regularHours, 2);
    const otPay = round(otRate * otHours, 2);
    const currentGross = round(regularPay + otPay + bonus, 2);

    // --- YTD Calculations ---
    const newYTDGross = round(ytdGross + currentGross, 2);

    // --- Federal Deductions ---
    const annualGross = calculateAnnualizedGross(currentGross, payFrequency);
    const federalTax = calculateFederalIncomeTax(annualGross, formData.filingStatus, tables.federal_income, payFrequency);
    const ytdFederalTax = parseFloat(formData.ytdFederalTax) || 0;
    const newYTDFederalTax = round(ytdFederalTax + federalTax, 2);
    
    const { socialSecurityTax, medicareTax } = calculateFICATaxes(currentGross, newYTDGross, tables.fica);
    const ytdSocialSecurity = parseFloat(formData.ytdSocialSecurity) || 0;
    const newYTDSocialSecurity = round(ytdSocialSecurity + socialSecurityTax, 2);
    const ytdMedicare = parseFloat(formData.ytdMedicare) || 0;
    const newYTDMedicare = round(ytdMedicare + medicareTax, 2);
    
    // --- NJ State Deductions ---
    const njStateTax = calculateNJStateIncomeTax(annualGross, tables.nj_state.income);
    const ytdNJStateTax = parseFloat(formData.ytdNJStateTax) || 0;
    const newYTDNJStateTax = round(ytdNJStateTax + njStateTax / getPayPeriods(payFrequency), 2);

    const { suiTax, sdiTax, fliTax } = calculateNJOtherTaxes(currentGross, newYTDGross, tables.nj_state);
    const ytdSUI = parseFloat(formData.ytdSUI) || 0;
    const newYTDSUI = round(ytdSUI + suiTax, 2);
    const ytdSDI = parseFloat(formData.ytdSDI) || 0;
    const newYTDSDI = round(ytdSDI + sdiTax, 2);
    const ytdFLI = parseFloat(formData.ytdFLI) || 0;
    const newYTDFLI = round(ytdFLI + fliTax, 2);


    // --- Totals ---
    const currentDeductions = round(federalTax + socialSecurityTax + medicareTax + (njStateTax / getPayPeriods(payFrequency)) + suiTax + sdiTax + fliTax, 2);
    const netPay = round(currentGross - currentDeductions, 2);

    return {
        // Earnings
        regularPay,
        otPay,
        bonus,
        currentGross,
        newYTDGross,
        // Federal Deductions
        federalTax,
        socialSecurityTax,
        medicareTax,
        newYTDFederalTax,
        newYTDSocialSecurity,
        newYTDMedicare,
        // NJ State Deductions
        njStateTax: round(njStateTax / getPayPeriods(payFrequency), 2),
        suiTax,
        sdiTax,
        fliTax,
        newYTDNJStateTax,
        newYTDSUI,
        newYTDSDI,
        newYTDFLI,
        // Totals
        currentDeductions,
        netPay
    };
}


function calculateAnnualizedGross(currentGross, payFrequency) {
    return currentGross * getPayPeriods(payFrequency);
}

function getPayPeriods(payFrequency) {
    switch (payFrequency) {
        case 'weekly': return 52;
        case 'bi-weekly': return 26;
        case 'semi-monthly': return 24;
        case 'monthly': return 12;
        default: return 1;
    }
}

function calculateFederalIncomeTax(annualGross, filingStatus, federalTables, payFrequency) {
    const deduction = federalTables.standard_deduction[filingStatus];
    const taxableIncome = Math.max(0, annualGross - deduction);
    const brackets = federalTables.brackets[filingStatus];
    
    let tax = 0;
    for (let i = brackets.length - 1; i >= 0; i--) {
        if (taxableIncome > brackets[i].over) {
            tax += (taxableIncome - brackets[i].over) * brackets[i].rate;
            if (i > 0) {
                 tax -= (taxableIncome - brackets[i].over) * brackets[i-1].rate;
            }
        }
    }
    
    return round(tax / getPayPeriods(payFrequency), 2);
}

function calculateFICATaxes(currentGross, newYTDGross, ficaTables) {
    const ytdBeforeCurrent = newYTDGross - currentGross;
    
    // Social Security
    let socialSecurityTaxable = 0;
    if (ytdBeforeCurrent < ficaTables.social_security.limit) {
        const remainingLimit = ficaTables.social_security.limit - ytdBeforeCurrent;
        socialSecurityTaxable = Math.min(currentGross, remainingLimit);
    }
    const socialSecurityTax = round(socialSecurityTaxable * ficaTables.social_security.rate, 2);
    
    // Medicare
    const medicareTax = round(currentGross * ficaTables.medicare.rate, 2);

    return { socialSecurityTax, medicareTax };
}

function calculateNJStateIncomeTax(annualGross, njBrackets) {
    let tax = 0;
    let previousBracketLimit = 0;

    for (const bracket of njBrackets.brackets) {
        if (annualGross > bracket.over) {
            const taxableInBracket = Math.min(annualGross, (njBrackets.brackets.find(b => b.over > bracket.over) || {over: Infinity}).over) - bracket.over;
            tax += taxableInBracket * bracket.rate;
        }
    }
    return tax;
}

function calculateNJOtherTaxes(currentGross, newYTDGross, njTables) {
    const ytdBeforeCurrent = newYTDGross - currentGross;

    // SUI
    let suiTaxable = 0;
    if (ytdBeforeCurrent < njTables.sui.limit) {
        suiTaxable = Math.min(currentGross, njTables.sui.limit - ytdBeforeCurrent);
    }
    const suiTax = round(suiTaxable * njTables.sui.rate, 2);

    // SDI
    let sdiTaxable = 0;
    if (ytdBeforeCurrent < njTables.sdi.limit) {
        sdiTaxable = Math.min(currentGross, njTables.sdi.limit - ytdBeforeCurrent);
    }
    const sdiTax = round(sdiTaxable * njTables.sdi.rate, 2);

    // FLI
    let fliTaxable = 0;
    if (ytdBeforeCurrent < njTables.fli.limit) {
        fliTaxable = Math.min(currentGross, njTables.fli.limit - ytdBeforeCurrent);
    }
    const fliTax = round(fliTaxable * njTables.fli.rate, 2);

    return { suiTax, sdiTax, fliTax };
}
