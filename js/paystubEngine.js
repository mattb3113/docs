/*
    BuellDocs Paystub Engine
    Provides tax calculations using external tax rate data.
*/

const paystubEngine = (() => {
    let taxData = null;

    const fetchTaxData = async () => {
        const res = await fetch('server/data/tax_rates_2025.json');
        if (!res.ok) throw new Error('Failed to load tax data');
        taxData = await res.json();
    };

    const init = async () => {
        try {
            await fetchTaxData();
        } catch (err) {
            console.error('Paystub engine init failed', err);
            taxData = null;
        }
    };

    const calcProgressive = (amount, brackets) => {
        let tax = precisionMath.toBig(0);
        for (const bracket of brackets) {
            const from = precisionMath.toBig(bracket.from);
            const to = bracket.to === 'Infinity' ? precisionMath.toBig(amount) : precisionMath.toBig(bracket.to);
            if (precisionMath.toBig(amount).gt(from)) {
                const taxable = precisionMath.sub(precisionMath.min(amount, to), from);
                if (taxable.gt(0)) {
                    tax = precisionMath.add(tax, precisionMath.mul(taxable, bracket.rate));
                }
            }
        }
        return tax;
    };

    const calculate = (grossCurrent, ytdGross, periodsPerYear, filingStatus, otherDeductions) => {
        if (!taxData) return {};
        const federal = taxData.federal;
        const nj = taxData.nj;
        const fica = taxData.fica;

        const annualGross = precisionMath.mul(grossCurrent, periodsPerYear);
        const standardDeduction = federal.standardDeductions[filingStatus] || federal.standardDeductions.Single;
        const taxableIncome = precisionMath.max(precisionMath.sub(annualGross, standardDeduction), 0);
        const annualFedTax = calcProgressive(taxableIncome, federal.taxBrackets[filingStatus] || federal.taxBrackets.Single);
        const federalTax = precisionMath.div(annualFedTax, periodsPerYear);

        const annualStateTax = calcProgressive(annualGross, nj.taxBrackets[filingStatus] || nj.taxBrackets.Single);
        const stateTax = precisionMath.div(annualStateTax, periodsPerYear);

        const ssRate = fica.socialSecurity.rate;
        const ssLimit = fica.socialSecurity.wageLimit;
        const ytdBefore = precisionMath.toBig(ytdGross);
        const socialSecurity = ytdBefore.lt(ssLimit)
            ? precisionMath.mul(Math.min(ssLimit - ytdBefore, grossCurrent), ssRate)
            : precisionMath.toBig(0);

        const baseMedicare = precisionMath.mul(grossCurrent, fica.medicare.rate);
        let medicare = baseMedicare;
        const afterGross = precisionMath.add(ytdBefore, grossCurrent);
        if (afterGross.gt(fica.medicare.additionalRateThreshold)) {
            const excess = precisionMath.sub(afterGross, Math.max(fica.medicare.additionalRateThreshold, ytdBefore));
            medicare = precisionMath.add(medicare, precisionMath.mul(excess, fica.medicare.additionalRate));
        }

        const njSdi = ytdBefore.lt(nj.sdi.wageLimit)
            ? precisionMath.mul(Math.min(nj.sdi.wageLimit - ytdBefore, grossCurrent), nj.sdi.rate)
            : precisionMath.toBig(0);
        const njFli = ytdBefore.lt(nj.fli.wageLimit)
            ? precisionMath.mul(Math.min(nj.fli.wageLimit - ytdBefore, grossCurrent), nj.fli.rate)
            : precisionMath.toBig(0);
        const njUiHcWf = ytdBefore.lt(nj.ui_hc_wf.wageLimit)
            ? precisionMath.mul(Math.min(nj.ui_hc_wf.wageLimit - ytdBefore, grossCurrent), nj.ui_hc_wf.rate)
            : precisionMath.toBig(0);

        const totalDeductions = precisionMath.add(federalTax, stateTax, socialSecurity, medicare, njSdi, njFli, njUiHcWf, otherDeductions);
        const netPay = precisionMath.sub(grossCurrent, totalDeductions);

        return {
            grossPay: grossCurrent,
            federalTax,
            stateTax,
            socialSecurity,
            medicare,
            njSdi,
            njFli,
            njUiHcWf,
            totalDeductions,
            netPay
        };
    };

    const solveNetToGross = (desiredNet, periodsPerYear, filingStatus, otherDeductions) => {
        let low = precisionMath.toBig(desiredNet);
        let high = precisionMath.mul(low, 2);
        for (let i = 0; i < 20; i++) {
            const mid = precisionMath.div(precisionMath.add(low, high), 2);
            const calc = calculate(mid, 0, periodsPerYear, filingStatus, otherDeductions);
            if (!calc.netPay) break;
            if (precisionMath.toBig(calc.netPay).gt(desiredNet)) {
                high = mid;
            } else {
                low = mid;
            }
        }
        return high;
    };

    return { init, calculate, solveNetToGross };
})();

=======
    BuellDocs Paystub Engine v1.0
    Description: A pure JavaScript module for calculating U.S. and NJ payroll taxes.
                 It uses the precisionMath module for all calculations.
*/
window.paystubEngine = (() => {
    let taxData = null; // To cache the loaded tax tables

    // --- Data Loading ---
    async function loadTaxData() {
        if (taxData) return taxData;
        try {
            const response = await fetch('../data/taxTables.json');
            if (!response.ok) throw new Error('Network response was not ok');
            taxData = await response.json();
            return taxData;
        } catch (error) {
            console.error('Failed to load tax tables:', error);
            return null;
        }
    }

    // --- Calculation Helpers ---
    const { toBig, add, sub, mul, div } = window.precisionMath;

    function calculateBracketedTax(annualIncome, brackets) {
        let tax = toBig(0);
        const income = toBig(annualIncome);

        for (const bracket of brackets) {
            const from = toBig(bracket.from);
            const to = toBig(bracket.to === 'Infinity' ? Infinity : bracket.to);
            if (income.gt(from)) {
                const taxableInBracket = window.math.min(income, to).minus(from);
                tax = add(tax, mul(taxableInBracket, bracket.rate));
            }
        }
        return tax;
    }

    // --- Core Calculation Functions ---
    function calcFICA(currentGross, ytdGross, fica) {
        const { socialSecurity, medicare } = fica;
        const currentGrossB = toBig(currentGross);
        const ytdGrossB = toBig(ytdGross);

        const ssLimit = toBig(socialSecurity.wageLimit);
        const remainingSsTaxable = window.math.max(0, sub(ssLimit, ytdGrossB));
        const currentSsTaxable = window.math.min(currentGrossB, remainingSsTaxable);
        const ssTax = mul(currentSsTaxable, socialSecurity.rate);

        let medicareTax = mul(currentGrossB, medicare.rate);
        const totalGross = add(ytdGrossB, currentGrossB);
        const medicareThreshold = toBig(medicare.additionalRateThreshold);
        if (totalGross.gt(medicareThreshold)) {
            const prevTaxed = window.math.max(medicareThreshold, ytdGrossB);
            const additionalTaxable = sub(totalGross, prevTaxed);
            medicareTax = add(medicareTax, mul(additionalTaxable, medicare.additionalRate));
        }

        return { socialSecurity: ssTax, medicare: medicareTax };
    }

    function calcFederal(grossPerPeriod, payPeriods, filingStatus, federal) {
        const annualGross = mul(grossPerPeriod, payPeriods);
        const deduction = toBig(federal.standardDeductions[filingStatus] || 0);
        const taxableIncome = window.math.max(0, sub(annualGross, deduction));

        const brackets = federal.taxBrackets[filingStatus] || [];
        const annualTax = calculateBracketedTax(taxableIncome, brackets);

        return div(annualTax, payPeriods);
    }

    function calcNJ(grossPerPeriod, ytdGross, payPeriods, nj) {
        const currentGrossB = toBig(grossPerPeriod);
        const ytdGrossB = toBig(ytdGross);

        const annualGross = mul(currentGrossB, payPeriods);
        const annualTax = calculateBracketedTax(annualGross, nj.taxBrackets.Single);
        const stateTax = div(annualTax, payPeriods);

        const calcCappedTax = (gross, ytd, rate, limit) => {
            const remainingTaxable = window.math.max(0, sub(toBig(limit), ytdGrossB));
            const currentTaxable = window.math.min(gross, remainingTaxable);
            return mul(currentTaxable, rate);
        };

        const sdi = calcCappedTax(currentGrossB, ytdGrossB, nj.sdi.rate, nj.sdi.wageLimit);
        const fli = calcCappedTax(currentGrossB, ytdGrossB, nj.fli.rate, nj.fli.wageLimit);
        const ui_hc_wf = calcCappedTax(currentGrossB, ytdGrossB, nj.ui_hc_wf.rate, nj.ui_hc_wf.wageLimit);

        return { stateTax, sdi, fli, ui_hc_wf };
    }

    function calculateAllTaxes(grossPerPeriod, ytdGross, payPeriods, filingStatus, otherDeductions) {
        const { fica, federal, nj } = taxData;
        const ficaTaxes = calcFICA(grossPerPeriod, ytdGross, fica);
        const federalTax = calcFederal(grossPerPeriod, payPeriods, filingStatus, federal);
        const njTaxes = calcNJ(grossPerPeriod, ytdGross, payPeriods, nj);

        const totalTaxes = add(ficaTaxes.socialSecurity, ficaTaxes.medicare, federalTax, njTaxes.stateTax, njTaxes.sdi, njTaxes.fli, njTaxes.ui_hc_wf);
        const totalDeductions = add(totalTaxes, otherDeductions);
        const netPay = sub(grossPerPeriod, totalDeductions);

        return {
            grossPay: toBig(grossPerPeriod),
            netPay: netPay,
            totalDeductions,
            federalTax,
            ...ficaTaxes,
            ...njTaxes
        };
    }

    return {
        init: loadTaxData,
        calculate: calculateAllTaxes,
        solveNetToGross: (desiredNet, payPeriods, filingStatus, otherDeductions) => {
            if (!taxData) throw new Error("Tax data not loaded. Call init() first.");

            let grossEstimate = mul(desiredNet, 1.5);
            const desiredNetB = toBig(desiredNet);

            for (let i = 0; i < 15; i++) {
                const calcs = calculateAllTaxes(grossEstimate, 0, payPeriods, filingStatus, otherDeductions);
                const currentNet = calcs.netPay;

                const diff = sub(currentNet, desiredNetB);
                if (window.math.abs(diff).lt(0.01)) {
                    return grossEstimate;
                }

                grossEstimate = sub(grossEstimate, diff);
            }
            return grossEstimate;
        }
    };
})();
