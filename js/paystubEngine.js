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

