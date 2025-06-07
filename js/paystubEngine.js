/*
    BuellDocs Paystub Engine v1.1
    Description: A pure JavaScript module for calculating U.S. and NJ payroll taxes.
                 It relies on a separate precision math library (like math.js) and a JSON data file.
*/
window.paystubEngine = (() => {
    let taxData = null; // Cache for the loaded tax tables

    // --- Data Loading ---
    async function loadTaxData(path = 'data/taxTables.json') {
        if (taxData) return taxData;
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
            taxData = await response.json();
            console.log(`Tax data for year ${taxData.year} loaded successfully.`);
            return taxData;
        } catch (error) {
            console.error('Failed to load tax tables:', error);
            // Fallback to a minimal structure to prevent total failure
            return null;
        }
    }

    // --- Calculation Helpers (assuming math.js is loaded) ---
    const toBig = (v) => math.bignumber(String(v || 0).replace(/[^0-9.-]+/g, ''));
    const { add, subtract, multiply, divide, larger, smaller, abs } = math;

    function calculateBracketedTax(annualIncome, brackets) {
        let tax = toBig(0);
        const income = toBig(annualIncome);
        if (income.isNegative() || income.isZero()) return tax;

        for (const bracket of brackets) {
            const from = toBig(bracket.from);
            const to = bracket.to === 'Infinity' ? toBig(Infinity) : toBig(bracket.to);
            if (larger(income, from)) {
                const taxableInBracket = subtract(smaller(income, to), from);
                tax = add(tax, multiply(taxableInBracket, bracket.rate));
            }
        }
        return tax;
    }

    // --- Core Calculation Functions ---
    function calcFICA(currentGross, ytdGross, fica) {
        const currentGrossB = toBig(currentGross);
        const ytdGrossB = toBig(ytdGross);

        // Social Security
        const ssLimit = toBig(fica.socialSecurity.wageLimit);
        const remainingSsTaxable = larger(ssLimit, ytdGrossB) ? subtract(ssLimit, ytdGrossB) : toBig(0);
        const currentSsTaxable = smaller(currentGrossB, remainingSsTaxable);
        const ssTax = multiply(currentSsTaxable, fica.socialSecurity.rate);

        // Medicare
        const medicareTax = multiply(currentGrossB, fica.medicare.rate);

        return { socialSecurity: ssTax, medicare: medicareTax };
    }

    function calcFederal(grossPerPeriod, payPeriods, filingStatus, federal) {
        const annualGross = multiply(toBig(grossPerPeriod), payPeriods);
        const deduction = toBig(federal.standardDeductions[filingStatus] || 0);
        const taxableIncome = larger(annualGross, deduction) ? subtract(annualGross, deduction) : toBig(0);
        const annualTax = calculateBracketedTax(taxableIncome, federal.taxBrackets[filingStatus] || []);
        return divide(annualTax, toBig(payPeriods));
    }

    function calcNJ(grossPerPeriod, ytdGross, payPeriods, nj) {
        const currentGrossB = toBig(grossPerPeriod);
        const ytdGrossB = toBig(ytdGross);
        
        const annualGross = multiply(currentGrossB, payPeriods);
        const annualTax = calculateBracketedTax(annualGross, nj.taxBrackets.Single);
        const stateTax = divide(annualTax, payPeriods);

        const calcCappedTax = (gross, ytd, rate, limit) => {
            const remaining = larger(toBig(limit), ytd) ? subtract(toBig(limit), ytd) : toBig(0);
            const taxable = smaller(gross, remaining);
            return multiply(taxable, rate);
        };

        const sdi = calcCappedTax(currentGrossB, ytdGrossB, nj.sdi.rate, nj.sdi.wageLimit);
        const fli = calcCappedTax(currentGrossB, ytdGrossB, nj.fli.rate, nj.fli.wageLimit);
        const ui_hc_wf = calcCappedTax(currentGrossB, ytdGrossB, nj.ui_hc_wf.rate, nj.ui_hc_wf.wageLimit);

        return { stateTax, sdi, fli, ui_hc_wf };
    }

    function calculateAllTaxes(inputs) {
        const { grossPerPeriod, ytdGross, payPeriods, filingStatus, otherDeductions, isNj } = inputs;
        const { fica, federal, nj } = taxData;
        
        const grossB = toBig(grossPerPeriod);
        const otherDeductionsB = toBig(otherDeductions);

        const ficaTaxes = calcFICA(grossB, ytdGross, fica);
        const federalTax = calcFederal(grossB, payPeriods, filingStatus, federal);
        const njTaxes = isNj ? calcNJ(grossB, ytdGross, payPeriods, nj) : { stateTax: toBig(0), sdi: toBig(0), fli: toBig(0), ui_hc_wf: toBig(0) };
        
        const totalTaxes = add(ficaTaxes.socialSecurity, ficaTaxes.medicare, federalTax, njTaxes.stateTax, njTaxes.sdi, njTaxes.fli, njTaxes.ui_hc_wf);
        const totalDeductions = add(totalTaxes, otherDeductionsB);
        const netPay = subtract(grossB, totalDeductions);

        return { grossPay: grossB, netPay, totalDeductions, federalTax, ...ficaTaxes, ...njTaxes };
    }

    // --- Public API ---
    return {
        init: loadTaxData,
        calculate: calculateAllTaxes
    };
})();
