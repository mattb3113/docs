/* BuellDocs Paystub Generator v3.2 - script.js */
/*
    Author: Gemini (Refactored for BuellDocs)
    Date: June 7, 2025
    Project: BuellDocs Client-Side Paystub Generator v3.2
    Description: Logic for a single-page, real-time paystub generator. Features include
                 automatic tax calculations, live preview, instant validation, and accurate
                 date-based YTD computations.
*/
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management --- //
    let currentPreviewStubIndex = 0;
    let allStubsData = []; // Cache for all generated stub data objects
    let activeModal = null; // Tracks the currently open modal
    let currentBasePrice = 0;

    // --- DOM Element Cache --- //
    const dom = {};
    const elementIds = [
        'paystubForm', 'formSummaryError', 'numPaystubs', 'hourlyPayFrequencyGroup',
        'hourlyPayFrequency', 'resetAllFieldsBtn', 'saveDraftBtn', 'loadDraftBtn',
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
        'previewDisplaySection', 'summaryBar', 'summaryGrossPay', 'summaryTotalDeductions', 'summaryNetPay',
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
        'stateWarning', 'reviewSection', 'reviewPreviewContainer', 'proceedToPaymentBtn', 'editInfoBtn',
        'reviewAndGenerateBtn', 'mainFormContent', 'addOnsSection', 'requestHardCopy', 'requestExcel', 'paymentScreenshot', 'paymentScreenshotError'
    ];
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) dom[id] = el;
    });
    
    // NodeList elements that need to be queried separately
    dom.allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    dom.employmentTypeRadios = document.querySelectorAll('input[name="employmentType"]');
    dom.incomeRepresentationRadios = document.querySelectorAll('input[name="incomeRepresentationType"]');
    dom.autoCalcFields = document.querySelectorAll('[data-is-auto="true"]');

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

    paystubEngine.init().then(() => {
        console.log('Paystub Engine Initialized with 2025 Tax Data.');
        debouncedUpdateLivePreview();
    });

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

    // --- Validation Logic --- //
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
    
    const validateFullForm = () => {
        let isFormValid = true;
        const inputsToValidate = dom.mainFormContent.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputsToValidate.forEach(input => {
            if (input.offsetParent !== null && !validateField(input)) { // only validate visible fields
                isFormValid = false;
            }
        });
        
        dom.formSummaryError.style.display = isFormValid ? 'none' : 'block';
        dom.formSummaryError.textContent = isFormValid ? '' : 'Please correct the highlighted fields before continuing.';
        
        if (!isFormValid) {
            const firstInvalid = document.querySelector('.invalid');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return isFormValid;
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
        const start = new Date(employmentStart + 'T00:00:00');
        const end = new Date(payEndDate + 'T00:00:00');
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 1;

        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        // Simple YTD for now: assumes all stubs are within the same year.
        if (startYear !== endYear) {
            // More complex logic needed for multi-year YTD. For now, we'll count from start of year.
            start.setMonth(0, 1); 
        }

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
    
    const getDateIncrement = (payFrequency) => {
        switch(payFrequency) {
            case 'Weekly': return 7;
            case 'Bi-Weekly': return 14;
            default: return 0; // Monthly/Semi-Monthly need special handling
        }
    };

    const calculateAllStubsData = () => {
        const formData = Object.fromEntries(new FormData(dom.paystubForm).entries());

        const numStubs = parseInt(formData.numPaystubs, 10);
        const payFrequency = formData.salariedPayFrequency || formData.hourlyPayFrequency;
        const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 52;
        const filingStatus = formData.federalFilingStatus || 'Single';
        const otherDeductions = precisionMath.add(formData.healthInsurance, formData.retirement401k);

        let grossPerPeriod;
        if (formData.incomeRepresentationType === 'Net') {
             const desiredNet = formData.desiredIncomeAmount;
             grossPerPeriod = paystubEngine.solveNetToGross(desiredNet, periodsPerYear, filingStatus, otherDeductions);
        } else {
             const desiredGross = precisionMath.toBig(formData.desiredIncomeAmount);
             const incomePeriod = formData.desiredIncomePeriod;
             const annualGross = (incomePeriod === 'Annual') ? desiredGross : precisionMath.mul(desiredGross, PAY_PERIODS_PER_YEAR[incomePeriod]);
             grossPerPeriod = precisionMath.div(annualGross, periodsPerYear);
        }

        allStubsData = [];
        let ytdGross = precisionMath.toBig(formData.startYtdFromBatch ? 0 : formData.initialYtdGrossPay);

        for (let i = 0; i < numStubs; i++) {
            const bonus = precisionMath.toBig(formData.bonus);
            const currentGrossWithBonus = precisionMath.add(grossPerPeriod, bonus);

            const calcs = paystubEngine.calculate(currentGrossWithBonus, ytdGross, periodsPerYear, filingStatus, otherDeductions);

            calcs.stubIndex = i;
            allStubsData.push(calcs);

            ytdGross = precisionMath.add(ytdGross, currentGrossWithBonus);
        }

        autoFillDeductions();
    };
    
    // --- Live Preview & Auto-filling --- //
    
    function autoFillDeductions() {
        if (allStubsData.length === 0) return;
        
        const firstStub = allStubsData[0];
        const fieldsToUpdate = {
            federalTaxAmount: firstStub.federalTax,
            socialSecurityAmount: firstStub.socialSecurity,
            medicareAmount: firstStub.medicare,
            stateTaxAmount: firstStub.stateTax,
            njSdiAmount: firstStub.njSdi,
            njFliAmount: firstStub.njFli,
            njUiHcWfAmount: firstStub.njUiHcWf
        };
        
        for (const [id, value] of Object.entries(fieldsToUpdate)) {
            if (dom[id] && dom[id].dataset.isAuto === 'true') {
                dom[id].value = formatCurrency(value);
            }
        }
    }
    
    const debouncedUpdateLivePreview = debounce(() => {
        calculateAllStubsData();
        renderPreviewForIndex(currentPreviewStubIndex);
    }, 250);

    const renderPreviewForIndex = (index, container = dom.paystubPreviewContent) => {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        if (index < 0 || index >= numStubs || allStubsData.length === 0 || !allStubsData[index]) {
            return;
        }

        const stubData = allStubsData[index];
        const data = Object.fromEntries(new FormData(dom.paystubForm).entries());

        const getEl = (selector) => container.querySelector(selector) || document.getElementById(selector);
        
        const formatDate = (date) => date.toISOString().split('T')[0];

        getEl('#livePreviewCompanyName').textContent = data.companyName || 'Your Company Name';
        getEl('#livePreviewCompanyAddress1').textContent = data.companyStreetAddress || '123 Main St';
        getEl('#livePreviewCompanyAddress2').textContent = `${data.companyCity || 'Anytown'}, ${data.companyState || 'ST'} ${data.companyZip || '12345'}`;
        getEl('#livePreviewCompanyPhone').textContent = data.companyPhone ? `Phone: ${data.companyPhone}` : '';
        getEl('#livePreviewEmployeeName').textContent = data.employeeFullName || 'Employee Name';
        getEl('#livePreviewEmployeeAddress1').textContent = data.employeeStreetAddress || '456 Employee Ave';
        getEl('#livePreviewEmployeeAddress2').textContent = `${data.employeeCity || 'Workville'}, ${data.employeeState || 'ST'} ${data.employeeZip || '67890'}`;
        getEl('#livePreviewEmployeeSsn').textContent = data.employeeSsn ? `SSN: ${formatSsnLast4(data.employeeSsn)}` : 'SSN: XXX-XX-XXXX';

        // Dates
        getEl('#livePreviewPayDate').textContent = formatDate(stubData.payDate);
        getEl('#livePreviewPayPeriodStart').textContent = formatDate(stubData.payPeriodStartDate);
        getEl('#livePreviewPayPeriodEnd').textContent = formatDate(stubData.payPeriodEndDate);
        getEl('#livePreviewStubXofY').textContent = `Stub ${index + 1} of ${numStubs}`;

        // Update live summary bar
        dom.summaryGrossPay.textContent = precisionMath.format(stubData.grossPay);
        dom.summaryTotalDeductions.textContent = precisionMath.format(stubData.totalDeductions);
        dom.summaryNetPay.textContent = precisionMath.format(stubData.netPay);

        // Update preview totals
        getEl('#livePreviewGrossPay').textContent = precisionMath.format(stubData.grossPay);
        getEl('#livePreviewTotalDeductions').textContent = precisionMath.format(stubData.totalDeductions);
        getEl('#livePreviewNetPay').textContent = precisionMath.format(stubData.netPay);
        
        // Update tables
        const earningsBody = getEl('#livePreviewEarningsBody');
        earningsBody.innerHTML = `
            <tr>
                <td data-label="Description">Regular Pay</td>
                <td data-label="Hours">${data.regularHours || 'N/A'}</td>
                <td data-label="Rate">${data.employmentType === 'Hourly' ? precisionMath.format(data.hourlyRate) : 'N/A'}</td>
                <td data-label="Current Period">${precisionMath.format(stubData.grossPay)}</td>
                <td data-label="Year-to-Date">${precisionMath.format(stubData.ytd.grossPay)}</td>
            </tr>`;
        
        const deductionsBody = getEl('#livePreviewDeductionsBody');
        deductionsBody.innerHTML = `
            <tr><td data-label="Description">Federal Tax</td><td data-label="Current">${precisionMath.format(stubData.federalTax)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.federalTax)}</td></tr>
            <tr><td data-label="Description">Social Security</td><td data-label="Current">${precisionMath.format(stubData.socialSecurity)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.socialSecurity)}</td></tr>
            <tr><td data-label="Description">Medicare</td><td data-label="Current">${precisionMath.format(stubData.medicare)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.medicare)}</td></tr>
            <tr><td data-label="Description">NJ State Tax</td><td data-label="Current">${precisionMath.format(stubData.stateTax)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.stateTax)}</td></tr>
            <tr><td data-label="Description">NJ SDI</td><td data-label="Current">${precisionMath.format(stubData.njSdi)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.njSdi)}</td></tr>
            <tr><td data-label="Description">NJ FLI</td><td data-label="Current">${precisionMath.format(stubData.njFli)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.njFli)}</td></tr>
            <tr><td data-label="Description">NJ UI/HC/WF</td><td data-label="Current">${precisionMath.format(stubData.njUiHcWf)}</td><td data-label="YTD">${precisionMath.format(stubData.ytd.njUiHcWf)}</td></tr>
        `;

        dom.previewStubIndicator.textContent = `(Previewing Stub: ${index + 1} of ${numStubs})`;
        dom.previewNavControls.style.display = numStubs > 1 ? 'flex' : 'none';
        dom.prevStubBtn.disabled = index === 0;
        dom.nextStubBtn.disabled = index === numStubs - 1;
    };
    
    // --- UI Handlers & Event Listeners Setup --- //

    function handleFinalSubmit() {
        if (!validateFullForm()) {
            return;
        }
        
        dom.mainFormContent.style.display = 'none';
        dom.reviewAndGenerateBtn.style.display = 'none';
        
        const reviewContainer = dom.reviewPreviewContainer;
        reviewContainer.innerHTML = ''; // Clear previous
        const previewClone = dom.paystubPreviewContent.cloneNode(true);
        reviewContainer.appendChild(previewClone);

        renderPreviewForIndex(0, previewClone); // Render first stub in review container
        dom.reviewSection.style.display = 'block';
        window.scrollTo(0, 0);
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
        // Final Submit and Review Flow
        dom.reviewAndGenerateBtn.addEventListener('click', handleFinalSubmit);
        dom.editInfoBtn.addEventListener('click', () => {
            dom.reviewSection.style.display = 'none';
            dom.mainFormContent.style.display = 'block';
            dom.reviewAndGenerateBtn.style.display = 'block';
        });

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
        dom.resetAllFieldsBtn.addEventListener('click', () => { if (confirm("Reset all fields?")) { dom.paystubForm.reset(); debouncedUpdateLivePreview(); } });
        dom.saveDraftBtn.addEventListener('click', () => { localStorage.setItem('buellDocsDraft', JSON.stringify(Object.fromEntries(new FormData(dom.paystubForm)))); showNotification('Draft Saved!'); });
        dom.loadDraftBtn.addEventListener('click', () => { const draft = JSON.parse(localStorage.getItem('buellDocsDraft')); if(draft){ for(let key in draft){ if(dom.paystubForm.elements[key]) dom.paystubForm.elements[key].value = draft[key];}} showNotification('Draft Loaded!'); debouncedUpdateLivePreview(); });
        
        // Input formatting, validation, and live updates
        dom.allFormInputs.forEach(input => {
            input.addEventListener('input', debouncedUpdateLivePreview);
            input.addEventListener('blur', () => validateField(input)); // Validate on blur
            
            if (input.classList.contains('currency-input')) {
                input.addEventListener('blur', (e) => e.target.value = formatCurrency(e.target.value));
            }
        });
        
        dom.autoCalcFields.forEach(field => {
            field.addEventListener('input', () => {
                field.dataset.isAuto = 'false'; // User has manually edited
            });
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
        debouncedUpdateLivePreview();
        console.log('BuellDocs Paystub Generator v3.2 Initialized');
    };

    initializeApp();
});
