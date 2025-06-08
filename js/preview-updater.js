/**
 * @module preview-updater
 * @description Updates the live preview of the paystub and check with calculated data.
 */

import { formatCurrency } from './precisionMath.js';

const PREVIEW_MAPPING = {
    // Company & Employee Info
    'company-name-preview': 'companyName',
    'company-address-preview': 'companyAddress',
    'employee-name-preview': 'employeeName',
    'employee-address-preview': 'employeeAddress',
    // Pay Period Info
    'pay-period-start-preview': 'payPeriodStart',
    'pay-date-preview': 'payDate',
    // Earnings (Current)
    'regular-pay-current': 'regularPay',
    'ot-pay-current': 'otPay',
    'bonus-current': 'bonus',
    'gross-pay-current': 'currentGross',
    // Earnings (YTD)
    'gross-pay-ytd': 'newYTDGross',
    // Federal Deductions (Current)
    'fed-tax-current': 'federalTax',
    'ss-tax-current': 'socialSecurityTax',
    'medicare-tax-current': 'medicareTax',
    // Federal Deductions (YTD)
    'fed-tax-ytd': 'newYTDFederalTax',
    'ss-tax-ytd': 'newYTDSocialSecurity',
    'medicare-tax-ytd': 'newYTDMedicare',
    // NJ State Deductions (Current)
    'nj-tax-current': 'njStateTax',
    'nj-sui-current': 'suiTax',
    'nj-sdi-current': 'sdiTax',
    'nj-fli-current': 'fliTax',
    // NJ State Deductions (YTD)
    'nj-tax-ytd': 'newYTDNJStateTax',
    'nj-sui-ytd': 'newYTDSUI',
    'nj-sdi-ytd': 'newYTDSDI',
    'nj-fli-ytd': 'newYTDFLI',
    // Totals
    'total-deductions-current': 'currentDeductions',
    'net-pay-current': 'netPay',
    'net-pay-ytd': 'netPay', // This might need its own calculation if required
    // Check fields
    'check-pay-date': 'payDate',
    'check-employee-name': 'employeeName',
    'check-amount-numeric': 'netPay',
    'check-company-name': 'companyName',
    'check-micr-line': (formData, calcData) => `C012345678A ${formData.employeeSSN}C ${formData.checkNumber || '0001'}`
};

/**
 * Updates the entire preview section with new data.
 * @param {object} formData The original data from the form.
 * @param {object} calculatedData The results from the paystub calculator.
 */
export function updatePreview(formData, calculatedData) {
    const data = { ...formData, ...calculatedData };

    for (const id in PREVIEW_MAPPING) {
        const element = document.getElementById(id);
        if (element) {
            const keyOrFn = PREVIEW_MAPPING[id];
            let value;

            if (typeof keyOrFn === 'function') {
                value = keyOrFn(formData, calculatedData);
            } else {
                 value = data[keyOrFn];
            }
            
            if (typeof value === 'number') {
                element.textContent = formatCurrency(value);
            } else {
                element.textContent = value || '';
            }
        }
    }
    
    // Special handling for the written amount on the check
    const checkAmountWritten = document.getElementById('check-amount-written');
    if (checkAmountWritten && typeof calculatedData.netPay === 'number') {
        checkAmountWritten.textContent = numberToWords(calculatedData.netPay) + ' Dollars';
    }
}


// --- Utility for number to words ---
// (A simplified version for demonstration)
function numberToWords(n) {
    if (n < 0 || n >= 1000000) return "N/A";
    if (n === 0) return "Zero";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertHundreds(num) {
        let str = "";
        if (num >= 100) {
            str += ones[Math.floor(num / 100)] + " Hundred ";
            num %= 100;
        }
        if (num >= 11 && num <= 19) {
            return str + teens[num - 10];
        }
        if (num >= 20 || num === 10) {
            str += tens[Math.floor(num / 10)];
            num %= 10;
            if(num > 0) str += "-";
        }
        if (num > 0) {
            str += ones[num];
        }
        return str.trim();
    }

    let words = "";
    const thousands = Math.floor(n / 1000);
    if (thousands > 0) {
        words += convertHundreds(thousands) + " Thousand ";
    }

    const remainder = Math.floor(n % 1000);
    if (remainder > 0) {
        words += convertHundreds(remainder);
    }
    
    const cents = Math.round((n % 1) * 100);
    if (cents > 0) {
        words += ` and ${cents}/100`;
    }

    return words.trim();
}
