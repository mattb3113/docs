/* BuellDocs Paystub Generator v3.1 - script.js */
/*
    Author: Gemini (Refactored for BuellDocs)
    Date: June 7, 2025
    Project: BuellDocs Client-Side Paystub Generator v3.1
    Description: Fully functional and refactored JavaScript logic for the paystub 
                 generator, including a multi-step form, live preview, calculations,
                 and all specified UI/UX improvements and bug fixes.
*/
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management --- //
    let currentFormStep = 0;
    let currentPreviewStubIndex = 0;
    let allStubsData = []; // Cache for all generated stub data objects
    let activeModal = null; // Tracks the currently open modal
    let currentBasePrice = 0;

    // --- DOM Element Cache --- //
    const dom = {};
    const elementIds = [
        'paystubForm', 'formProgressIndicator', 'formSummaryError', 'numPaystubs', 'hourlyPayFrequencyGroup',
        'hourlyPayFrequency', 'resetAllFieldsBtn', 'saveDraftBtn', 'loadDraftBtn', 'estimateAllDeductionsBtn',
        'previewPdfWatermarkedBtn',
        'desiredIncomeAmount', 'desiredIncomePeriod', 'assumedHourlyHoursGroup', 'assumedHourlyRegularHours',
        'isForNJEmployment', 'netIncomeAdjustmentNote', 'populateDetailsBtn', 'hourlyFields', 'salariedFields',
        'hourlyRate', 'regularHours', 'overtimeHours', 'annualSalary', 'salariedPayFrequency',
        'employmentStartDate', 'payPeriodStartDate', 'payPeriodEndDate', 'payDate', 'federalFilingStatus', 'federalTaxAmount',
        'stateTaxAmount', 'socialSecurityAmount', 'medicareAmount', 'njDeductionsSection', 'njSdiAmount', 
        'njFliAmount', 'njUiHcWfAmount', 'bonus', 'healthInsurance', 'retirement401k',
        'startYtdFromBatch', 'initialYtdFieldsContainer', 'initialYtdGrossPay', 'initialYtdFederalTax', 
        'initialYtdStateTax', 'initialYtdSocialSecurity', 'initialYtdMedicare', 'initialYtdNjSdi', 
        'initialYtdNjFli', 'initialYtdNjUiHcWf', 'companyLogo', 'companyLogoPreviewContainer', 'companyLogoPreview', 
        'payrollProviderLogo', 'payrollProviderLogoPreviewContainer', 'payrollProviderLogoPreview', 
        'includeVoidedCheck', 'employeeSsn', 'userNotes', 'userEmail', 'companyName', 'employeeFullName',
        'previewSection', 'summaryBar', 'summaryGrossPay', 'summaryTotalDeductions', 'summaryNetPay',
        'previewStubIndicator', 'previewNavControls', 'prevStubBtn', 'nextStubBtn', 'paystubPreviewContent',
        'livePreviewCompanyName', 'livePreviewCompanyAddress1', 'livePreviewCompanyAddress2', 'companyStreetAddress', 
        'companyCity', 'companyState', 'companyZip', 'livePreviewCompanyPhone', 'companyPhone', 'livePreviewCompanyEin', 
        'livePreviewStubXofY', 'livePreviewCompanyLogo', 'livePreviewEmployeeName', 'livePreviewEmployeeAddress1', 
        'livePreviewEmployeeAddress2', 'employeeStreetAddress', 'employeeCity', 'employeeState', 'livePreviewEmployeeSsn',
        'livePreviewPayPeriodStart', 'livePreviewPayPeriodEnd', 'livePreviewPayDate', 'livePreviewEarningsBody', 
        'livePreviewDeductionsBody', 'livePreviewGrossPay', 'livePreviewTotalDeductions', 'livePreviewNetPay', 
        'livePreviewPayrollProviderLogo', 'livePreviewVoidedCheckContainer', 'paymentModal', 'closePaymentModalBtn', 
        'paymentInstructions', 'totalPaymentAmount', 'paymentDiscountNote', 'cashAppTxId', 'confirmPaymentBtn', 
        'modalOrderSuccessMessage', 'closeSuccessMessageBtn', 'successUserEmailInline', 'notificationModal', 
        'closeNotificationModalBtn', 'notificationModalTitle', 'notificationModalMessage', 'cashAppTxIdError',
        'stateWarning', 'reviewPreviewContainer', 'proceedToPaymentBtn', 'addOnsSection', 'requestHardCopy', 'requestExcel', 'paymentScreenshot', 'paymentScreenshotError'
    ];
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) dom[id] = el;
    });
    
    // NodeList elements that need to be queried separately
    dom.formSteps = document.querySelectorAll('.form-step');
    dom.allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    dom.employmentTypeRadios = document.querySelectorAll('input[name="employmentType"]');
    dom.incomeRepresentationRadios = document.querySelectorAll('input[name="incomeRepresentationType"]');

    // --- Constants --- //
    const PAY_PERIODS_PER_YEAR = { 'Weekly': 52, 'Bi-Weekly': 26, 'Semi-Monthly': 24, 'Monthly': 12, 'Annual': 1 };
    const PRICING = { 1: { price: 29.99, note: "" }, 2: { price: 54.99, note: "Save $5" }, 3: { price: 79.99, note: "Save $10" }, 4: { price: 99.99, note: "Save $20" }, 5: { price: 125.00, note: "$25 each - Bulk rate applied!" } };
    const HARD_COPY_PRICE = 19.99;
    const EXCEL_PRICE = 9.99;
    
    // Tax & Deduction Constants for 2024/2025
    const SOCIAL_SECURITY_WAGE_LIMIT_2024 = 168600;
    const SOCIAL_SECURITY_RATE = 0.062;
    const MEDICARE_RATE = 0.0145;
    const NJ_SDI_RATE = 0.00; // Employee rate is 0% for 2024
    const NJ_FLI_RATE = 0.0006;
    const NJ_UIHCWF_RATE = 0.00425;
    const NJ_UIHCWF_WAGE_LIMIT_2024 = 42300;
    const FEDERAL_TAX_BRACKETS_2024_SINGLE = [ { limit: 11600, rate: 0.10 }, { limit: 47150, rate: 0.12 }, { limit: 100525, rate: 0.22 }, { limit: 191950, rate: 0.24 }, { limit: 243725, rate: 0.32 }, { limit: 609350, rate: 0.35 }, { limit: Infinity, rate: 0.37 } ];
    const STANDARD_DEDUCTION_2024_SINGLE = 14600;
    const NJ_TAX_BRACKETS_2024_SINGLE = [ { limit: 20000, rate: 0.014 }, { limit: 35000, rate: 0.0175 }, { limit: 40000, rate: 0.035 }, { limit: 75000, rate: 0.05525 }, { limit: 500000, rate: 0.0637 }, { limit: Infinity, rate: 0.0897 } ];
    const US_STATES = [ 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming' ];

    // --- Utility Functions --- //
    
    const formatCurrency = (value) => {
        const num = parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        return parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
    };

    const formatPhoneNumber = (value) => {
        const digits = String(value).replace(/\D/g, '').slice(0, 10);
        if (!digits) return '';
        const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : digits;
    };

    const formatZip = (value) => String(value).replace(/\D/g, '').slice(0, 5);

    const formatSsnLast4 = (value) => {
        const last4 = String(value).replace(/\D/g, '').slice(-4);
        return last4 ? `XXX-XX-${last4}` : '';
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const showNotification = (message, title = 'Notice') => {
        dom.notificationModalTitle.textContent = title;
        dom.notificationModalMessage.textContent = message;
        dom.notificationModal.style.display = 'flex';
        activeModal = dom.notificationModal;
    };

    // --- Multi-Step Form Logic --- //
    
    const showFormStep = (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= dom.formSteps.length) return;
        
        currentFormStep = stepIndex;
        dom.formSteps.forEach((step, index) => {
            step.style.display = (index === stepIndex) ? 'block' : 'none';
        });
        updateProgressIndicator(stepIndex);
        window.scrollTo(0, 0); 
    };

    const updateProgressIndicator = (stepIndex) => {
        if (!dom.formProgressIndicator) return;
        if (dom.formProgressIndicator.children.length === 0) {
            dom.formSteps.forEach((_, idx) => {
                const indicator = document.createElement('div');
                indicator.className = 'progress-step';
                indicator.textContent = idx + 1;
                dom.formProgressIndicator.appendChild(indicator);
            });
        }
        
        dom.formProgressIndicator.querySelectorAll('.progress-step').forEach((el, i) => {
            el.classList.remove('active', 'completed');
            if (i < stepIndex) {
                el.classList.add('completed');
            } else if (i === stepIndex) {
                el.classList.add('active');
            }
        });
    };

    const validateField = (input) => {
        let isValid = true;
        const errorSpanId = input.getAttribute('aria-describedby');
        const errorSpan = errorSpanId ? document.getElementById(errorSpanId) : null;
        let errorMessage = '';

        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            const label = document.querySelector(`label[for='${input.id}']`);
            errorMessage = `${label?.textContent.replace(' *','').trim() || 'This field'} is required.`;
        } else if (input.type === 'email' && input.value && !/^\S+@\S+\.\S+$/.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        } else if (input.id === 'paymentScreenshot' && input.hasAttribute('required') && input.files.length === 0) {
            isValid = false;
            errorMessage = 'A payment screenshot is required.';
        }


        if (errorSpan) {
            errorSpan.textContent = errorMessage;
        }
        input.classList.toggle('invalid', !isValid);
        
        return isValid;
    };
    
    const validateStepInputs = (stepIndex) => {
        const currentStepEl = dom.formSteps[stepIndex];
        if (!currentStepEl) return true;
        
        let isStepValid = true;
        const inputsToValidate = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputsToValidate.forEach(input => {
            if (input.offsetParent !== null && !validateField(input)) {
                isStepValid = false;
            }
        });
        
        dom.formSummaryError.style.display = isStepValid ? 'none' : 'block';
        dom.formSummaryError.textContent = isStepValid ? '' : 'Please correct the highlighted fields before continuing.';
        
        return isStepValid;
    };

    const handleNextStep = (e) => {
        if (validateStepInputs(currentFormStep)) {
             if (e.target.id === 'generateAndPay') {
                handleMainFormSubmit();
            } else {
                showFormStep(currentFormStep + 1);
            }
        }
    };
    
    const handlePrevStep = () => {
        dom.formSummaryError.style.display = 'none';
        showFormStep(currentFormStep - 1);
    };

    // --- Core Calculation Logic --- //
    
    const calculateTax = (annualTaxable, brackets) => {
        let tax = 0;
        let lastLimit = 0;
        for (const bracket of brackets) {
            if (annualTaxable > lastLimit) {
                const taxableInBracket = Math.min(annualTaxable, bracket.limit) - lastLimit;
                tax += taxableInBracket * bracket.rate;
            }
            lastLimit = bracket.limit;
        }
        return tax;
    };

    const getElapsedPayPeriods = (employmentStart, payEndDate, payFrequency) => {
        const start = new Date(employmentStart);
        const end = new Date(payEndDate);
        if (isNaN(start) || isNaN(end) || start > end) return 1;

        const dayMs = 24 * 60 * 60 * 1000;
        const daysDiff = (end - start) / dayMs;

        switch (payFrequency) {
            case 'Weekly': return Math.floor(daysDiff / 7) + 1;
            case 'Bi-Weekly': return Math.floor(daysDiff / 14) + 1;
            case 'Semi-Monthly': {
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                let periods = months * 2;
                if (end.getDate() >= 15) periods++;
                if (start.getDate() < 15) periods++;
                return Math.max(1, periods);
            }
            case 'Monthly': return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
            default: return 1;
        }
    };

    const calculateAllStubsData = () => {
        const formData = Object.fromEntries(new FormData(dom.paystubForm).entries());
        
        const numStubs = parseInt(formData.numPaystubs, 10);
        const employmentType = formData.employmentType;
        const payFrequency = (employmentType === 'Salaried') ? formData.salariedPayFrequency : formData.hourlyPayFrequency;
        const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 52;
        
        let annualGross = 0;
        if (employmentType === 'Salaried') {
            annualGross = parseCurrency(formData.annualSalary);
        } else {
            const rate = parseCurrency(formData.hourlyRate);
            const regularHours = parseFloat(formData.regularHours) || 0;
            const otHours = parseFloat(formData.overtimeHours) || 0;
            const otRate = rate * 1.5;
            const annualRegular = rate * regularHours * periodsPerYear;
            const annualOt = otRate * otHours * periodsPerYear;
            annualGross = annualRegular + otHours > 0 ? annualOt : 0;
        }

        const grossPerPeriod = annualGross / periodsPerYear;
        const bonusPerPeriod = parseCurrency(formData.bonus);
        const totalGrossPerPeriod = grossPerPeriod + bonusPerPeriod;

        const annualTaxable = Math.max(0, annualGross - STANDARD_DEDUCTION_2024_SINGLE - (2 * 4300));
        const annualFederalTax = calculateTax(annualTaxable, FEDERAL_TAX_BRACKETS_2024_SINGLE);
        const annualStateTax = calculateTax(annualGross, NJ_TAX_BRACKETS_2024_SINGLE);

        const fedTaxPerPeriod = annualFederalTax / periodsPerYear;
        const stateTaxPerPeriod = annualStateTax / periodsPerYear;
        
        allStubsData = [];
        for (let i = 0; i < numStubs; i++) {
            const current = {};
            const payDate = new Date(formData.payDate + 'T00:00:00');
            // Logic to increment pay date for subsequent stubs
            
            const periodsElapsed = getElapsedPayPeriods(formData.employmentStartDate, payDate, payFrequency) + i;

            current.grossPay = totalGrossPerPeriod;
            
            const ytdGrossBeforeThisStub = totalGrossPerPeriod * (periodsElapsed - 1);

            current.socialSecurity = (ytdGrossBeforeThisStub < SOCIAL_SECURITY_WAGE_LIMIT_2024) ? Math.min(totalGrossPerPeriod, SOCIAL_SECURITY_WAGE_LIMIT_2024 - ytdGrossBeforeThisStub) * SOCIAL_SECURITY_RATE : 0;
            current.medicare = totalGrossPerPeriod * MEDICARE_RATE;
            current.federalTax = fedTaxPerPeriod;
            current.stateTax = stateTaxPerPeriod;
            
            const ytdUiHcwfBase = ytdGrossBeforeThisStub;
            current.njSdi = totalGrossPerPeriod * NJ_SDI_RATE;
            current.njFli = totalGrossPerPeriod * NJ_FLI_RATE;
            current.njUiHcWf = (ytdUiHcwfBase < NJ_UIHCWF_WAGE_LIMIT_2024) ? Math.min(totalGrossPerPeriod, NJ_UIHCWF_WAGE_LIMIT_2024 - ytdUiHcwfBase) * NJ_UIHCWF_RATE : 0;

            current.healthInsurance = parseCurrency(formData.healthInsurance);
            current.retirement401k = parseCurrency(formData.retirement401k);

            current.totalDeductions = current.federalTax + current.stateTax + current.socialSecurity + current.medicare + current.njSdi + current.njFli + current.njUiHcWf + current.healthInsurance + current.retirement401k;
            current.netPay = current.grossPay - current.totalDeductions;
            
            const startYTDFromBatch = dom.startYtdFromBatch.checked;
            const initialYtd = {
                grossPay: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdGrossPay),
                federalTax: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdFederalTax),
                stateTax: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdStateTax),
                socialSecurity: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdSocialSecurity),
                medicare: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdMedicare),
                njSdi: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdNjSdi),
                njFli: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdNjFli),
                njUiHcWf: startYTDFromBatch ? 0 : parseCurrency(formData.initialYtdNjUiHcWf),
            };

            current.ytd = {
                grossPay: initialYtd.grossPay + (current.grossPay * (i + 1)),
                federalTax: initialYtd.federalTax + (current.federalTax * (i + 1)),
                stateTax: initialYtd.stateTax + (current.stateTax * (i + 1)),
                socialSecurity: initialYtd.socialSecurity + (current.socialSecurity * (i + 1)),
                medicare: initialYtd.medicare + (current.medicare * (i + 1)),
                njSdi: initialYtd.njSdi + (current.njSdi * (i + 1)),
                njFli: initialYtd.njFli + (current.njFli * (i + 1)),
                njUiHcWf: initialYtd.njUiHcWf + (current.njUiHcWf * (i + 1))
            };
            allStubsData.push(current);
        }
    };
    
    // --- Live Preview Rendering --- //
    
    const debouncedUpdateLivePreview = debounce(() => {
        calculateAllStubsData();
        renderPreviewForIndex(currentPreviewStubIndex);
    }, 300);

    const renderPreviewForIndex = (index, container = dom.paystubPreviewContent) => {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        if (index < 0 || index >= numStubs || allStubsData.length === 0 || !allStubsData[index]) {
            return;
        }

        const stubData = allStubsData[index];
        const data = Object.fromEntries(new FormData(dom.paystubForm).entries());

        const getEl = (selector) => container.querySelector(selector) || document.getElementById(selector);

        getEl('#livePreviewCompanyName').textContent = data.companyName || 'Your Company Name';
        getEl('#livePreviewCompanyAddress1').textContent = data.companyStreetAddress || '123 Main St';
        getEl('#livePreviewCompanyAddress2').textContent = `${data.companyCity || 'Anytown'}, ${data.companyState || 'ST'} ${data.companyZip || '12345'}`;
        getEl('#livePreviewCompanyPhone').textContent = data.companyPhone ? `Phone: ${data.companyPhone}` : '';
        getEl('#livePreviewEmployeeName').textContent = data.employeeFullName || 'Employee Name';
        getEl('#livePreviewEmployeeAddress1').textContent = data.employeeStreetAddress || '456 Employee Ave';
        getEl('#livePreviewEmployeeAddress2').textContent = `${data.employeeCity || 'Workville'}, ${data.employeeState || 'ST'} ${data.employeeZip || '67890'}`;
        getEl('#livePreviewEmployeeSsn').textContent = data.employeeSsn ? `SSN: ${data.employeeSsn}` : 'SSN: XXX-XX-XXXX';

        // Update live summary bar
        dom.summaryGrossPay.textContent = formatCurrency(stubData.grossPay);
        dom.summaryTotalDeductions.textContent = formatCurrency(stubData.totalDeductions);
        dom.summaryNetPay.textContent = formatCurrency(stubData.netPay);

        // Update preview totals
        getEl('#livePreviewGrossPay').textContent = formatCurrency(stubData.grossPay);
        getEl('#livePreviewTotalDeductions').textContent = formatCurrency(stubData.totalDeductions);
        getEl('#livePreviewNetPay').textContent = formatCurrency(stubData.netPay);
        
        // Update tables
        const earningsBody = getEl('#livePreviewEarningsBody');
        earningsBody.innerHTML = `
            <tr>
                <td data-label="Description">Regular Pay</td>
                <td data-label="Hours">${data.regularHours || 'N/A'}</td>
                <td data-label="Rate">${data.employmentType === 'Hourly' ? formatCurrency(data.hourlyRate) : 'N/A'}</td>
                <td data-label="Current Period">${formatCurrency(stubData.grossPay)}</td>
                <td data-label="Year-to-Date">${formatCurrency(stubData.ytd.grossPay)}</td>
            </tr>`;
        
        const deductionsBody = getEl('#livePreviewDeductionsBody');
        deductionsBody.innerHTML = `
            <tr><td data-label="Description">Federal Tax</td><td data-label="Current">${formatCurrency(stubData.federalTax)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.federalTax)}</td></tr>
            <tr><td data-label="Description">Social Security</td><td data-label="Current">${formatCurrency(stubData.socialSecurity)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.socialSecurity)}</td></tr>
            <tr><td data-label="Description">Medicare</td><td data-label="Current">${formatCurrency(stubData.medicare)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.medicare)}</td></tr>
            <tr><td data-label="Description">NJ State Tax</td><td data-label="Current">${formatCurrency(stubData.stateTax)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.stateTax)}</td></tr>
            <tr><td data-label="Description">NJ SDI</td><td data-label="Current">${formatCurrency(stubData.njSdi)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njSdi)}</td></tr>
            <tr><td data-label="Description">NJ FLI</td><td data-label="Current">${formatCurrency(stubData.njFli)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njFli)}</td></tr>
            <tr><td data-label="Description">NJ UI/HC/WF</td><td data-label="Current">${formatCurrency(stubData.njUiHcWf)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njUiHcWf)}</td></tr>
        `;

        dom.previewStubIndicator.textContent = `(Previewing Stub: ${index + 1} of ${numStubs})`;
        dom.previewNavControls.style.display = numStubs > 1 ? 'flex' : 'none';
        dom.prevStubBtn.disabled = index === 0;
        dom.nextStubBtn.disabled = index === numStubs - 1;
    };
    
    // --- UI Handlers & Event Listeners Setup --- //

    function estimateAllDeductions() {
        calculateAllStubsData();
        if (allStubsData.length > 0) {
            const firstStub = allStubsData[0];
            dom.federalTaxAmount.value = formatCurrency(firstStub.federalTax);
            dom.socialSecurityAmount.value = formatCurrency(firstStub.socialSecurity);
            dom.medicareAmount.value = formatCurrency(firstStub.medicare);
            dom.stateTaxAmount.value = formatCurrency(firstStub.stateTax);
            dom.njSdiAmount.value = formatCurrency(firstStub.njSdi);
            dom.njFliAmount.value = formatCurrency(firstStub.njFli);
            dom.njUiHcWfAmount.value = formatCurrency(firstStub.njUiHcWf);
            showNotification('Deduction fields have been estimated based on your income details.', 'Deductions Estimated');
            debouncedUpdateLivePreview();
        } else {
            showNotification('Please fill out income details in previous steps first.', 'Error');
        }
    }
    
    function handleMainFormSubmit() {
        for(let i=0; i < dom.formSteps.length; i++) {
            if(!validateStepInputs(i)) {
                showFormStep(i);
                return;
            }
        }
        
        // All steps are valid, proceed to review
        const reviewContainer = dom.reviewPreviewContainer;
        reviewContainer.innerHTML = dom.paystubPreviewContent.innerHTML;
        const watermark = document.createElement('div');
        watermark.className = 'preview-watermark';
        watermark.textContent = 'BUELLDOCS';
        watermark.style.fontSize = 'clamp(30px, 8vw, 50px)'; // Make it slightly smaller for review
        reviewContainer.firstChild.prepend(watermark);

        renderPreviewForIndex(0, reviewContainer.firstChild); // Render first stub in review container
        showFormStep(dom.formSteps.length - 1); // Show the review step
    }

    function handlePaymentConfirmationSubmit() {
        const isTxIdValid = validateField(dom.cashAppTxId);
        const isScreenshotValid = validateField(dom.paymentScreenshot);
        
        if (!isTxIdValid || !isScreenshotValid) {
            return;
        }

        dom.paymentInstructions.style.display = 'none';
        dom.modalOrderSuccessMessage.style.display = 'block';
        dom.successUserEmailInline.textContent = dom.userEmail.value;
    }

    function populateStateDropdowns() {
        [dom.companyState, dom.employeeState].forEach(dropdown => {
            // Put NJ first
            const njOption = document.createElement('option');
            njOption.value = 'New Jersey';
            njOption.textContent = 'New Jersey';
            dropdown.appendChild(njOption);

            US_STATES.filter(s => s !== 'New Jersey').forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                dropdown.appendChild(option);
            });
        });
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.style.display = 'none';
        activeModal = null;
    }

    const initializeEventListeners = () => {
        // Step Navigation
        document.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', handleNextStep));
        document.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', handlePrevStep));
        dom.proceedToPaymentBtn.addEventListener('click', () => {
             const numStubs = parseInt(dom.numPaystubs.value, 10);
             const pricingInfo = PRICING[numStubs] || PRICING[1];
             currentBasePrice = pricingInfo.price;
             dom.totalPaymentAmount.textContent = formatCurrency(currentBasePrice);
             dom.paymentDiscountNote.textContent = pricingInfo.note;
             dom.paymentModal.style.display = 'flex';
             activeModal = dom.paymentModal;
        });

        // Main Action Buttons
        dom.resetAllFieldsBtn.addEventListener('click', () => { if (confirm("Reset all fields?")) dom.paystubForm.reset(); });
        dom.saveDraftBtn.addEventListener('click', () => { localStorage.setItem('buellDocsDraft', JSON.stringify(Object.fromEntries(new FormData(dom.paystubForm)))); showNotification('Draft Saved!'); });
        dom.loadDraftBtn.addEventListener('click', () => { const draft = JSON.parse(localStorage.getItem('buellDocsDraft')); if(draft){ for(let key in draft){ if(dom.paystubForm.elements[key]) dom.paystubForm.elements[key].value = draft[key];}} showNotification('Draft Loaded!'); debouncedUpdateLivePreview(); });
        dom.estimateAllDeductionsBtn.addEventListener('click', estimateAllDeductions);
        
        // Input formatting and live updates
        dom.allFormInputs.forEach(input => {
            input.addEventListener('input', debouncedUpdateLivePreview);
            if (input.classList.contains('currency-input')) {
                input.addEventListener('blur', (e) => e.target.value = formatCurrency(e.target.value));
            }
        });
        dom.companyPhone.addEventListener('input', (e) => e.target.value = formatPhoneNumber(e.target.value));
        dom.companyZip.addEventListener('input', (e) => e.target.value = formatZip(e.target.value));
        if (document.getElementById('employeeZip')) {
             document.getElementById('employeeZip').addEventListener('input', (e) => e.target.value = formatZip(e.target.value));
        }
        dom.employeeSsn.addEventListener('input', (e) => e.target.value = formatSsnLast4(e.target.value));
        
        dom.employeeState.addEventListener('change', (e) => {
            dom.stateWarning.style.display = e.target.value !== 'New Jersey' ? 'block' : 'none';
        });

        // Preview Navigation
        dom.prevStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex > 0) { currentPreviewStubIndex--; renderPreviewForIndex(currentPreviewStubIndex); }});
        dom.nextStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex < allStubsData.length - 1) { currentPreviewStubIndex++; renderPreviewForIndex(currentPreviewStubIndex); }});
        
        // Modal Handlers
        dom.confirmPaymentBtn.addEventListener('click', handlePaymentConfirmationSubmit);
        dom.closePaymentModalBtn.addEventListener('click', () => closeModal(dom.paymentModal));
        dom.closeNotificationModalBtn.addEventListener('click', () => closeModal(dom.notificationModal));
        dom.closeSuccessMessageBtn.addEventListener('click', () => closeModal(dom.paymentModal));
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeModal) closeModal(activeModal); });

        // Add-on pricing
        [dom.requestHardCopy, dom.requestExcel].forEach(addon => {
            addon.addEventListener('change', () => {
                let total = currentBasePrice;
                if (dom.requestHardCopy.checked) total += HARD_COPY_PRICE;
                if (dom.requestExcel.checked) total += EXCEL_PRICE;
                dom.totalPaymentAmount.textContent = formatCurrency(total);
            });
        });
    };

    /** Application entry point */
    const initializeApp = () => {
        populateStateDropdowns();
        initializeEventListeners();
        showFormStep(0);
        debouncedUpdateLivePreview();
        console.log('BuellDocs Paystub Generator v3.1 Initialized');
    };

    initializeApp();
});
