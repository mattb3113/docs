/* BuellDocs Paystub Generator v2 - script.js */
/*
    Author: Gemini (Refactored for BuellDocs)
    Date: June 6, 2025
    Project: BuellDocs Client-Side Paystub Generator v2
    Description: Fully functional JavaScript logic for the paystub generator,
                 including a multi-step form, live preview, calculations,
                 and all UI interactions.
*/
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management --- //
    let currentFormStep = 0;
    let currentPreviewStubIndex = 0;
    let allStubsData = []; // Cache for all generated stub data objects
    let activeModal = null; // Tracks the currently open modal

    // --- DOM Element Cache --- //
    // This is a common pattern to avoid repeated document.getElementById calls
    const dom = {};
    const elementIds = [
        'paystubForm', 'formProgressIndicator', 'formSummaryError', 'numPaystubs', 'hourlyPayFrequencyGroup',
        'hourlyPayFrequency', 'resetAllFieldsBtn', 'saveDraftBtn', 'loadDraftBtn', 'autoCalculateDeductionsBtn',
        'previewPdfWatermarkedBtn', 'copyKeyDataBtn', 'sharePdfEmailLink', 'sharePdfInstructions',
        'desiredIncomeAmount', 'desiredIncomePeriod', 'assumedHourlyHoursGroup', 'assumedHourlyRegularHours',
        'isForNJEmployment', 'netIncomeAdjustmentNote', 'populateDetailsBtn', 'hourlyFields', 'salariedFields',
        'hourlyRate', 'regularHours', 'overtimeHours', 'annualSalary', 'salariedPayFrequency',
        'payPeriodStartDate', 'payPeriodEndDate', 'payDate', 'federalFilingStatus', 'federalTaxAmount',
        'autoCalculateFederalTax', 'stateTaxName', 'stateTaxAmount', 'socialSecurityAmount', 'autoCalculateSocialSecurity',
        'medicareAmount', 'autoCalculateMedicare', 'njDeductionsSection', 'njSdiAmount', 'njFliAmount', 'njUiHcWfAmount',
        'bonus', 'miscEarningName', 'miscEarningAmount', 'healthInsurance', 'retirement401k',
        'customDeductionsContainer', 'addDeductionBtn', 'startYtdFromBatch', 'initialYtdFieldsContainer',
        'initialYtdGrossPay', 'initialYtdFederalTax', 'initialYtdStateTax', 'initialYtdSocialSecurity',
        'initialYtdMedicare', 'initialYtdNjSdi', 'initialYtdNjFli', 'initialYtdNjUiHcWf', 'companyLogo',
        'companyLogoPreviewContainer', 'companyLogoPreview', 'payrollProviderLogo', 'payrollProviderLogoPreviewContainer',
        'payrollProviderLogoPreview', 'includeVoidedCheck', 'employeeSsn', 'userNotes', 'userEmail', 'companyName', 'employeeFullName',
        'previewSection', 'summaryBar', 'summaryGrossPay', 'summaryTotalDeductions', 'summaryNetPay',
        'previewStubIndicator', 'previewNavControls', 'prevStubBtn', 'nextStubBtn', 'paystubPreviewContent',
        'livePreviewCompanyName', 'livePreviewCompanyAddress1', 'livePreviewCompanyAddress2', 'companyStreetAddress', 'companyCity', 'companyState', 'companyZip',
        'livePreviewCompanyPhone', 'companyPhone', 'livePreviewCompanyEin', 'livePreviewStubXofY', 'livePreviewCompanyLogo',
        'livePreviewEmployeeName', 'livePreviewEmployeeAddress1', 'livePreviewEmployeeAddress2', 'employeeStreetAddress', 'employeeCity', 'employeeState', 'employeeZip',
        'livePreviewEmployeeSsn', 'livePreviewPayPeriodStart', 'livePreviewPayPeriodEnd', 'livePreviewPayDate',
        'livePreviewEarningsBody', 'livePreviewDeductionsBody', 'livePreviewGrossPay', 'livePreviewTotalDeductions',
        'livePreviewNetPay', 'livePreviewPayrollProviderLogo', 'livePreviewVoidedCheckContainer',
        'paymentModal', 'closePaymentModalBtn', 'paymentInstructions', 'totalPaymentAmount', 'paymentDiscountNote',
        'cashAppTxId', 'confirmPaymentBtn', 'modalOrderSuccessMessage', 'closeSuccessMessageBtn',
        'successUserEmail', 'successUserEmailInline', 'successTxId', 'successNumStubs', 'successUserNotes',
        'supportEmailAddress', 'turnaroundTime', 'notificationModal', 'closeNotificationModalBtn',
        'notificationModalTitle', 'notificationModalMessage', 'cashAppTxIdError'
    ];
    elementIds.forEach(id => { dom[id] = document.getElementById(id); });
    
    // NodeList elements that need to be queried separately
    dom.formSteps = document.querySelectorAll('.form-step');
    dom.allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    dom.employmentTypeRadios = document.querySelectorAll('input[name="employmentType"]');
    dom.incomeRepresentationRadios = document.querySelectorAll('input[name="incomeRepresentationType"]');


    // --- Constants --- //
    const PAY_PERIODS_PER_YEAR = { 'Weekly': 52, 'Bi-Weekly': 26, 'Semi-Monthly': 24, 'Monthly': 12, 'Annual': 1 };
    const PRICING = { 1: { price: 29.99, note: "" }, 2: { price: 54.99, note: "Save $5" }, 3: { price: 79.99, note: "Save $10" }, 4: { price: 99.99, note: "Save $20" }, 5: { price: 125.00, note: "$25 each - Bulk rate applied!" } };
    
    // Tax & Deduction Constants for 2024/2025 (as per spec)
    const SOCIAL_SECURITY_WAGE_LIMIT_2024 = 168600;
    const SOCIAL_SECURITY_RATE = 0.062;
    const MEDICARE_RATE = 0.0145;
    const NJ_SDI_RATE = 0.00; // Employee rate is 0% for 2024
    const NJ_FLI_RATE = 0.0006; // 0.06% for 2024
    const NJ_UIHCWF_RATE = 0.00425; // 0.425% for 2024
    const NJ_UIHCWF_WAGE_LIMIT_2024 = 42300;
    const FEDERAL_TAX_BRACKETS_2024 = {
        'Single': [ { limit: 11600, rate: 0.10 }, { limit: 47150, rate: 0.12 }, { limit: 100525, rate: 0.22 }, { limit: 191950, rate: 0.24 }, { limit: 243725, rate: 0.32 }, { limit: 609350, rate: 0.35 }, { limit: Infinity, rate: 0.37 } ],
        'Married Filing Jointly': [ { limit: 23200, rate: 0.10 }, { limit: 94300, rate: 0.12 }, { limit: 201050, rate: 0.22 }, { limit: 383900, rate: 0.24 }, { limit: 487450, rate: 0.32 }, { limit: 731100, rate: 0.35 }, { limit: Infinity, rate: 0.37 } ],
        'Head of Household': [ { limit: 16550, rate: 0.10 }, { limit: 63100, rate: 0.12 }, { limit: 100500, rate: 0.22 }, { limit: 191950, rate: 0.24 }, { limit: 243700, rate: 0.32 }, { limit: 609350, rate: 0.35 }, { limit: Infinity, rate: 0.37 } ]
    };
    const STANDARD_DEDUCTION_2024 = { 'Single': 14600, 'Married Filing Jointly': 29200, 'Head of Household': 21900 };
    const W4_ALLOWANCES = { 'Single': 2, 'Married Filing Jointly': 3, 'Head of Household': 3 };
    const W4_ALLOWANCE_VALUE = 4300;
    const NJ_TAX_BRACKETS_2024 = {
         'Single': [
            { limit: 20000, rate: 0.014 },
            { limit: 35000, rate: 0.0175 },
            { limit: 40000, rate: 0.035 },
            { limit: 75000, rate: 0.05525 },
            { limit: 500000, rate: 0.0637 },
            { limit: Infinity, rate: 0.0897 }
        ],
         'Married Filing Jointly': [
            { limit: 20000, rate: 0.014 },
            { limit: 35000, rate: 0.0175 },
            { limit: 40000, rate: 0.035 },
            { limit: 75000, rate: 0.05525 },
            { limit: 500000, rate: 0.0637 },
            { limit: Infinity, rate: 0.0897 }
        ]
    };


    // --- Utility Functions --- //
    
    /**
     * Formats a number into a US currency string (e.g., $1,234.56).
     * @param {number | string} value - The numerical value to format.
     * @returns {string} The formatted currency string.
     */
    const formatCurrency = (value) => {
        const num = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    /**
     * Parses a currency string into a floating-point number.
     * @param {string | number} value - The currency string (e.g., "$1,234.56").
     * @returns {number} The parsed number.
     */
    const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    /** Formats a 10-digit phone number as XXX-XXX-XXXX. */
    const formatPhoneNumber = (value) => {
        const digits = String(value).replace(/\D/g, '').slice(0, 10);
        const parts = [];
        if (digits.length > 0) parts.push(digits.slice(0, 3));
        if (digits.length > 3) parts.push(digits.slice(3, 6));
        if (digits.length > 6) parts.push(digits.slice(6));
        return parts.join('-');
    };

    /** Restricts a value to 5 numeric ZIP digits. */
    const formatZip = (value) => {
        return String(value).replace(/\D/g, '').slice(0, 5);
    };

    /** Restricts a value to the last four digits of an SSN. */
    const formatSsnLast4 = (value) => {
        return String(value).replace(/\D/g, '').slice(0, 4);
    };

    /**
     * Debounces a function to limit the rate at which it gets called.
     * @param {Function} func The function to debounce.
     * @param {number} delay The debounce delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    /**
     * Shows a custom notification modal with a message.
     * @param {string} message The message to display.
     * @param {string} [title='Notice'] The title for the modal.
     */
    const showNotification = (message, title = 'Notice') => {
        dom.notificationModalTitle.textContent = title;
        dom.notificationModalMessage.textContent = message;
        dom.notificationModal.style.display = 'flex';
        activeModal = dom.notificationModal;
    };

    /**
     * Alerts users when a non-New Jersey state is selected.
     * @param {Event} e The change event from the state dropdown.
     */
    const handleStateChange = (e) => {
        if (e.target.value && e.target.value !== 'NJ') {
            showNotification(
                'Auto-calculations are only available for New Jersey. This order will be treated as custom and may incur additional costs.',
                'Custom Order Notice'
            );
        }
    };


    // --- Multi-Step Form Logic --- //
    
    /**
     * Hides all form steps and shows the one at the specified index.
     * @param {number} stepIndex The index of the form step to show.
     */
    const showFormStep = (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= dom.formSteps.length) return;
        
        currentFormStep = stepIndex;
        dom.formSteps.forEach((step, index) => {
            step.style.display = (index === stepIndex) ? 'block' : 'none';
        });
        updateProgressIndicator(stepIndex);
        window.scrollTo(0, 0); // Scroll to top on step change
    };

    /**
     * Updates the visual progress indicator at the top of the form.
     * @param {number} stepIndex The current active step index.
     */
    const updateProgressIndicator = (stepIndex) => {
        if (!dom.formProgressIndicator) return;
        // Lazily create indicators if they don't exist
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

    /**
     * Validates a single form field, updating its UI to show errors.
     * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input The input element to validate.
     * @returns {boolean} True if the field is valid, false otherwise.
     */
    const validateField = (input) => {
        let isValid = true;
        const errorSpanId = input.getAttribute('aria-describedby');
        const errorSpan = errorSpanId ? document.getElementById(errorSpanId) : null;
        const label = document.querySelector(`label[for='${input.id}']`);
        let errorMessage = '';

        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            errorMessage = `${label?.textContent.replace(' *','').trim() || 'This field'} is required.`;
        } else if (input.type === 'email' && input.value && !/^\S+@\S+\.\S+$/.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }

        if (isValid) {
            input.classList.remove('invalid');
            if (errorSpan) errorSpan.textContent = '';
        } else {
            input.classList.add('invalid');
            if (errorSpan) errorSpan.textContent = errorMessage;
        }
        return isValid;
    };
    
    /**
     * Validates all required inputs within the currently visible form step.
     * @returns {boolean} True if the current step is valid, false otherwise.
     */
    const validateCurrentStep = () => {
        const currentStepEl = dom.formSteps[currentFormStep];
        if (!currentStepEl) return true;
        
        let isStepValid = true;
        // Find all inputs that are required and visible
        const inputsToValidate = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputsToValidate.forEach(input => {
            // Check if the input is visible (not in a hidden parent)
            if (input.offsetParent !== null && !validateField(input)) {
                isStepValid = false;
            }
        });
        
        // Update summary error message
        if (!isStepValid) {
            dom.formSummaryError.textContent = 'Please correct the highlighted fields before continuing.';
            dom.formSummaryError.classList.add('active');
        } else {
            dom.formSummaryError.classList.remove('active');
        }
        
        return isStepValid;
    };
    
    /** Handles the click event for all "Next Step" buttons. */
    const handleNextStep = (e) => {
        if (validateCurrentStep()) {
            if (e.target.id === 'generateAndPay') {
                handleMainFormSubmit();
            } else if (currentFormStep < dom.formSteps.length - 1) {
                showFormStep(currentFormStep + 1);
            }
        }
    };
    
    /** Handles the click event for all "Previous Step" buttons. */
    const handlePrevStep = () => {
        dom.formSummaryError.classList.remove('active');
        showFormStep(currentFormStep - 1);
    };


    // --- Core Calculation Logic --- //
    
    /** Calculates federal income tax based on annual taxable income and filing status. */
    const calculateFederalTax = (annualGross, filingStatus) => {
        const deduction = STANDARD_DEDUCTION_2024[filingStatus] || 0;
        const allowances = W4_ALLOWANCES[filingStatus] || 2;
        const taxableIncome = Math.max(0, annualGross - deduction - allowances * W4_ALLOWANCE_VALUE);
        const brackets = FEDERAL_TAX_BRACKETS_2024[filingStatus];
        if (!brackets) return 0;

        let tax = 0;
        let lastLimit = 0;
        for (const bracket of brackets) {
            if (taxableIncome > lastLimit) {
                const taxableInBracket = Math.min(taxableIncome, bracket.limit) - lastLimit;
                tax += taxableInBracket * bracket.rate;
            }
            lastLimit = bracket.limit;
        }
        return tax;
    };

    /** Calculates NJ state tax based on annual taxable income. */
    const calculateNjStateTax = (annualGross, filingStatus) => {
        // NJ tax calculation can be complex with its own deductions. This is a simplified model.
        const brackets = NJ_TAX_BRACKETS_2024[filingStatus] || NJ_TAX_BRACKETS_2024['Single'];
        let tax = 0;
        let lastLimit = 0;
        for (const bracket of brackets) {
            if (annualGross > lastLimit) {
                const taxableInBracket = Math.min(annualGross, bracket.limit) - lastLimit;
                tax += taxableInBracket * bracket.rate;
            }
            lastLimit = bracket.limit;
        }
        return tax;
    };

    /** Gathers all data from the form and calculates pay details for all requested stubs. */
    const calculateAllStubsData = () => {
        const data = {}; // Gather all form data into a single object
        new FormData(dom.paystubForm).forEach((value, key) => data[key] = value);
        
        // Ensure checkboxes are correctly represented
        ['autoCalculateFederalTax', 'autoCalculateSocialSecurity', 'autoCalculateMedicare', 'isForNJEmployment', 'startYtdFromBatch', 'includeVoidedCheck'].forEach(id => {
            data[id] = dom[id] ? dom[id].checked : false;
        });

        const numStubs = parseInt(data.numPaystubs, 10);
        const employmentType = dom.employmentTypeRadios[0].checked ? 'Hourly' : 'Salaried';
        const payFrequency = (employmentType === 'Salaried') ? data.salariedPayFrequency : data.hourlyPayFrequency;
        const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 52;
        
        // Determine annual gross from either salary or hourly info
        let annualGross;
        if (employmentType === 'Salaried') {
            annualGross = parseCurrency(data.annualSalary);
        } else {
            const rate = parseCurrency(data.hourlyRate);
            const hours = parseCurrency(data.regularHours);
            annualGross = rate * hours * periodsPerYear;
        }

        const baseGrossPay = annualGross / periodsPerYear;
        const annualFederalTax = calculateFederalTax(annualGross, data.federalFilingStatus);
        const annualStateTax = data.isForNJEmployment ? calculateNjStateTax(annualGross, data.federalFilingStatus) : 0;

        // Set up initial YTD values
        let ytd = {
            grossPay: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdGrossPay),
            federalTax: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdFederalTax),
            stateTax: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdStateTax),
            socialSecurity: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdSocialSecurity),
            medicare: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdMedicare),
            njSdi: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdNjSdi),
            njFli: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdNjFli),
            njUiHcWf: data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdNjUiHcWf)
        };

        const results = [];
        for (let i = 0; i < numStubs; i++) {
            const current = {};
            current.stubIndex = i;

            // --- Current Period Calculations ---
            current.grossPay = baseGrossPay + parseCurrency(data.bonus) + parseCurrency(data.miscEarningAmount);
            
            // FICA Taxes
            const ssWageBase = ytd.grossPay;
            current.socialSecurity = data.autoCalculateSocialSecurity ? (ssWageBase < SOCIAL_SECURITY_WAGE_LIMIT_2024 ? Math.min(current.grossPay, SOCIAL_SECURITY_WAGE_LIMIT_2024 - ssWageBase) * SOCIAL_SECURITY_RATE : 0) : parseCurrency(data.socialSecurityAmount);
            current.medicare = data.autoCalculateMedicare ? current.grossPay * MEDICARE_RATE : parseCurrency(data.medicareAmount);
            
            // Federal & State
            current.federalTax = data.autoCalculateFederalTax ? annualFederalTax / periodsPerYear : parseCurrency(data.federalTaxAmount);
            current.stateTax = data.isForNJEmployment ? annualStateTax / periodsPerYear : parseCurrency(data.stateTaxAmount);
            
            // NJ Taxes
            const uiWageBase = ytd.grossPay;
            current.njSdi = data.isForNJEmployment ? current.grossPay * NJ_SDI_RATE : 0;
            current.njFli = data.isForNJEmployment ? current.grossPay * NJ_FLI_RATE : 0;
            current.njUiHcWf = data.isForNJEmployment ? (uiWageBase < NJ_UIHCWF_WAGE_LIMIT_2024 ? Math.min(current.grossPay, NJ_UIHCWF_WAGE_LIMIT_2024 - uiWageBase) * NJ_UIHCWF_RATE : 0) : 0;

            // Other Deductions
            current.healthInsurance = parseCurrency(data.healthInsurance);
            current.retirement401k = parseCurrency(data.retirement401k);

            let totalDeductions = current.federalTax + current.stateTax + current.socialSecurity + current.medicare + current.healthInsurance + current.retirement401k;
            if (data.isForNJEmployment) {
                totalDeductions += current.njSdi + current.njFli + current.njUiHcWf;
            }

            current.totalDeductions = totalDeductions;
            current.netPay = current.grossPay - totalDeductions;

            // --- YTD Accumulation ---
            ytd.grossPay += current.grossPay;
            ytd.federalTax += current.federalTax;
            ytd.stateTax += current.stateTax;
            ytd.socialSecurity += current.socialSecurity;
            ytd.medicare += current.medicare;
            ytd.njSdi += current.njSdi;
            ytd.njFli += current.njFli;
            ytd.njUiHcWf += current.njUiHcWf;

            current.ytd = { ...ytd }; // Copy accumulated values for this stub

            results.push(current);
        }
        allStubsData = results;
    };
    
    // --- Live Preview Rendering --- //
    
    const debouncedUpdateLivePreview = debounce(() => {
        calculateAllStubsData();
        renderPreviewForIndex(currentPreviewStubIndex);
    }, 250);

    const renderPreviewForIndex = (index) => {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        if (index < 0 || index >= numStubs || allStubsData.length === 0) {
            currentPreviewStubIndex = 0; // Reset index if it's out of bounds
            if (allStubsData.length > 0) {
                 renderPreviewForIndex(currentPreviewStubIndex);
            }
            return; 
        }

        const stubData = allStubsData[index];
        const formData = new FormData(dom.paystubForm);
        const data = Object.fromEntries(formData.entries());

        // Update preview text fields
        dom.livePreviewCompanyName.textContent = data.companyName || 'Your Company Name';
        dom.livePreviewCompanyAddress1.textContent = data.companyStreetAddress || '123 Main St';
        dom.livePreviewCompanyAddress2.textContent = `${data.companyCity || 'Anytown'}, ${data.companyState || 'ST'} ${data.companyZip || '12345'}`;
        dom.livePreviewCompanyPhone.textContent = data.companyPhone ? `Phone: ${data.companyPhone}` : '';

        dom.livePreviewEmployeeName.textContent = data.employeeFullName || 'Employee Name';
        dom.livePreviewEmployeeAddress1.textContent = data.employeeStreetAddress || '456 Employee Ave';
        dom.livePreviewEmployeeAddress2.textContent = `${data.employeeCity || 'Workville'}, ${data.employeeState || 'ST'} ${data.employeeZip || '67890'}`;
        dom.livePreviewEmployeeSsn.textContent = data.employeeSsn ? `SSN: XXX-XX-${data.employeeSsn}` : 'SSN: XXX-XX-XXXX';
        
        // Dates (increment for each stub)
        const payFrequency = dom.employmentTypeRadios[0].checked ? dom.hourlyPayFrequency.value : dom.salariedPayFrequency.value;
        let intervalDays = 0;
        if (payFrequency === 'Weekly') intervalDays = 7;
        else if (payFrequency === 'Bi-Weekly') intervalDays = 14;
        
        if (data.payPeriodStartDate && data.payPeriodEndDate && data.payDate) {
            const startDate = new Date(data.payPeriodStartDate + 'T00:00:00');
            const endDate = new Date(data.payPeriodEndDate + 'T00:00:00');
            const payDate = new Date(data.payDate + 'T00:00:00');

            if (payFrequency === 'Semi-Monthly' || payFrequency === 'Monthly') {
                 // Complex logic, for now, do simple add
                 startDate.setMonth(startDate.getMonth() + index);
                 endDate.setMonth(endDate.getMonth() + index);
                 payDate.setMonth(payDate.getMonth() + index);
            } else {
                const interval = intervalDays * index;
                startDate.setDate(startDate.getDate() + interval);
                endDate.setDate(endDate.getDate() + interval);
                payDate.setDate(payDate.getDate() + interval);
            }
            dom.livePreviewPayPeriodStart.textContent = startDate.toLocaleDateString();
            dom.livePreviewPayPeriodEnd.textContent = endDate.toLocaleDateString();
            dom.livePreviewPayDate.textContent = payDate.toLocaleDateString();
        }


        // Update amounts
        dom.livePreviewGrossPay.textContent = formatCurrency(stubData.grossPay);
        dom.livePreviewTotalDeductions.textContent = formatCurrency(stubData.totalDeductions);
        dom.livePreviewNetPay.textContent = formatCurrency(stubData.netPay);
        
        // Update global summary bar
        dom.summaryGrossPay.textContent = formatCurrency(stubData.grossPay);
        dom.summaryTotalDeductions.textContent = formatCurrency(stubData.totalDeductions);
        dom.summaryNetPay.textContent = formatCurrency(stubData.netPay);

        // Update Earnings Table
        const earningsBody = dom.livePreviewEarningsBody;
        earningsBody.innerHTML = `
            <tr>
                <td data-label="Description">Regular Earnings</td>
                <td data-label="Hours">${data.regularHours || 'N/A'}</td>
                <td data-label="Rate">${dom.employmentTypeRadios[0].checked ? formatCurrency(data.hourlyRate) : 'N/A'}</td>
                <td data-label="Current Period">${formatCurrency(stubData.grossPay)}</td>
                <td data-label="Year-to-Date">${formatCurrency(stubData.ytd.grossPay)}</td>
            </tr>
        `;

        // Update Deductions Table
        const deductionsBody = dom.livePreviewDeductionsBody;
        deductionsBody.innerHTML = `
            <tr><td data-label="Description">Federal Tax</td><td data-label="Current">${formatCurrency(stubData.federalTax)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.federalTax)}</td></tr>
            <tr><td data-label="Description">Social Security</td><td data-label="Current">${formatCurrency(stubData.socialSecurity)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.socialSecurity)}</td></tr>
            <tr><td data-label="Description">Medicare</td><td data-label="Current">${formatCurrency(stubData.medicare)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.medicare)}</td></tr>
            <tr><td data-label="Description">${data.stateTaxName || 'State Tax'}</td><td data-label="Current">${formatCurrency(stubData.stateTax)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.stateTax)}</td></tr>
        `;
        if (dom.isForNJEmployment.checked) {
            deductionsBody.innerHTML += `
                <tr><td data-label="Description">NJ SDI</td><td data-label="Current">${formatCurrency(stubData.njSdi)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njSdi)}</td></tr>
                <tr><td data-label="Description">NJ FLI</td><td data-label="Current">${formatCurrency(stubData.njFli)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njFli)}</td></tr>
                <tr><td data-label="Description">NJ UI/HC/WF</td><td data-label="Current">${formatCurrency(stubData.njUiHcWf)}</td><td data-label="YTD">${formatCurrency(stubData.ytd.njUiHcWf)}</td></tr>
            `;
        }
        if (stubData.healthInsurance > 0) deductionsBody.innerHTML += `<tr><td data-label="Description">Health Insurance</td><td data-label="Current">${formatCurrency(stubData.healthInsurance)}</td><td data-label="YTD">-</td></tr>`;
        if (stubData.retirement401k > 0) deductionsBody.innerHTML += `<tr><td data-label="Description">Retirement (401k)</td><td data-label="Current">${formatCurrency(stubData.retirement401k)}</td><td data-label="YTD">-</td></tr>`;

        // Update stub indicator and nav controls
        dom.previewStubIndicator.textContent = `(Previewing Stub: ${index + 1} of ${numStubs})`;
        dom.previewNavControls.style.display = numStubs > 1 ? 'flex' : 'none';
        dom.prevStubBtn.disabled = index === 0;
        dom.nextStubBtn.disabled = index === numStubs - 1;
    };
    
    // --- UI Handlers & Event Listeners Setup --- //

    /** Populates pay details from the "Desired Income" section. */
function autoPopulateFromDesiredIncome() {
        if (!validateField(dom.desiredIncomeAmount)) return;

        const amount = parseCurrency(dom.desiredIncomeAmount.value);
        const period = dom.desiredIncomePeriod.value;
        const representation = dom.incomeRepresentationRadios[0].checked ? 'Salaried' : 'Hourly';
        
        let annualGross = 0;
        if (period === 'Annual') annualGross = amount;
        if (period === 'Monthly') annualGross = amount * 12;
        if (period === 'Weekly') annualGross = amount * 52;
        
        if (representation === 'Salaried') {
            dom.employmentTypeRadios[1].checked = true;
            dom.annualSalary.value = formatCurrency(annualGross);
            dom.hourlyRate.value = '0.00';
            dom.regularHours.value = '0';
        } else { // Hourly
            dom.employmentTypeRadios[0].checked = true;
            const hoursPerWeek = parseCurrency(dom.assumedHourlyRegularHours.value) || 40;
            const hourlyRate = (annualGross > 0 && hoursPerWeek > 0) ? annualGross / 52 / hoursPerWeek : 0;
            dom.hourlyRate.value = hourlyRate.toFixed(2);
            dom.regularHours.value = hoursPerWeek;
            dom.annualSalary.value = '$0.00';
}

    /** Auto-calculates deduction fields based on current form data. */
    function autoCalculateDeductions() {
        const data = {};
        new FormData(dom.paystubForm).forEach((value, key) => data[key] = value);

        data.isForNJEmployment = dom.isForNJEmployment.checked;
        data.startYtdFromBatch = dom.startYtdFromBatch ? dom.startYtdFromBatch.checked : true;

        const employmentType = dom.employmentTypeRadios[0].checked ? 'Hourly' : 'Salaried';
        const payFrequency = (employmentType === 'Salaried') ? data.salariedPayFrequency : data.hourlyPayFrequency;
        const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 52;

        let annualGross;
        if (employmentType === 'Salaried') {
            annualGross = parseCurrency(data.annualSalary);
        } else {
            const rate = parseCurrency(data.hourlyRate);
            const hours = parseCurrency(data.regularHours);
            annualGross = rate * hours * periodsPerYear;
        }

        const grossPay = annualGross / periodsPerYear + parseCurrency(data.bonus) + parseCurrency(data.miscEarningAmount);
        const ytdGross = data.startYtdFromBatch ? 0 : parseCurrency(data.initialYtdGrossPay);

        const federalTax = calculateFederalTax(annualGross, data.federalFilingStatus) / periodsPerYear;
        const stateTax = data.isForNJEmployment ? calculateNjStateTax(annualGross, data.federalFilingStatus) / periodsPerYear : 0;
        const socialSecurity = (ytdGross < SOCIAL_SECURITY_WAGE_LIMIT_2024)
            ? Math.min(grossPay, SOCIAL_SECURITY_WAGE_LIMIT_2024 - ytdGross) * SOCIAL_SECURITY_RATE
            : 0;
        const medicare = grossPay * MEDICARE_RATE;
        const njSdi = data.isForNJEmployment ? grossPay * NJ_SDI_RATE : 0;
        const njFli = data.isForNJEmployment ? grossPay * NJ_FLI_RATE : 0;
        const njUiHcWf = data.isForNJEmployment && (ytdGross < NJ_UIHCWF_WAGE_LIMIT_2024)
            ? Math.min(grossPay, NJ_UIHCWF_WAGE_LIMIT_2024 - ytdGross) * NJ_UIHCWF_RATE
            : 0;

        dom.federalTaxAmount.value = federalTax.toFixed(2);
        dom.stateTaxAmount.value = stateTax.toFixed(2);
        dom.socialSecurityAmount.value = socialSecurity.toFixed(2);
        dom.medicareAmount.value = medicare.toFixed(2);
        if (dom.njDeductionsSection) {
            dom.njSdiAmount.value = njSdi.toFixed(2);
            dom.njFliAmount.value = njFli.toFixed(2);
            dom.njUiHcWfAmount.value = njUiHcWf.toFixed(2);
        }

        showNotification('Deduction fields populated based on current pay details.', 'Deductions Calculated');
    }
        
        toggleEmploymentFields();
        showNotification('Pay details have been calculated and populated in Step 3.', 'Auto-Population Complete');
        debouncedUpdateLivePreview();
    }
    
    function toggleEmploymentFields() {
        const type = dom.employmentTypeRadios[0].checked ? 'Hourly' : 'Salaried';
        if (type === 'Salaried') {
            dom.salariedFields.style.display = 'block';
            dom.hourlyFields.style.display = 'none';
            dom.annualSalary.required = true;
            dom.salariedPayFrequency.required = true;
            dom.hourlyRate.required = false;
            dom.regularHours.required = false;
        } else {
            dom.salariedFields.style.display = 'none';
            dom.hourlyFields.style.display = 'block';
            dom.annualSalary.required = false;
            dom.salariedPayFrequency.required = false;
            dom.hourlyRate.required = true;
            dom.regularHours.required = true;
        }
    }
    
    function resetAllFormFields() {
        if (confirm("Are you sure you want to reset all fields? This cannot be undone.")) {
            dom.paystubForm.reset();
            // Manually trigger change events for checkboxes to ensure state is correct
            dom.allFormInputs.forEach(input => {
                if(input.type === 'checkbox' || input.type === 'radio') {
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            toggleEmploymentFields();
            currentPreviewStubIndex = 0;
            debouncedUpdateLivePreview();
            showFormStep(0);
        }
    }

    function saveDraftToLocalStorage() {
        const data = {};
        new FormData(dom.paystubForm).forEach((value, key) => data[key] = value);
        // Manually add checkbox states
         ['autoCalculateFederalTax', 'autoCalculateSocialSecurity', 'autoCalculateMedicare', 'isForNJEmployment', 'startYtdFromBatch', 'includeVoidedCheck'].forEach(id => {
            data[id] = dom[id] ? dom[id].checked : false;
        });

        localStorage.setItem('buellDocsDraft', JSON.stringify(data));
        showNotification('Your draft has been saved to this browser.', 'Draft Saved');
    }

    function loadDraftFromLocalStorage() {
        const draft = localStorage.getItem('buellDocsDraft');
        if (draft) {
            const data = JSON.parse(draft);
            for (const key in data) {
                const el = dom.paystubForm.elements[key];
                if (el) {
                    // Handle radio buttons
                    if (el.length && el[0].type === 'radio') {
                         Array.from(el).find(radio => radio.value === data[key]).checked = true;
                    } else if (el.type === 'checkbox') {
                        el.checked = data[key];
                    } else {
                        el.value = data[key];
                    }
                }
            }
            toggleEmploymentFields();
            debouncedUpdateLivePreview();
            showNotification('Your saved draft has been loaded.', 'Draft Loaded');
        } else {
            showNotification('No saved draft found in this browser.', 'Load Failed');
        }
    }
    
    function handleMainFormSubmit() {
        if (!validateCurrentStep()) return;
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        const pricingInfo = PRICING[numStubs] || PRICING[1];

        dom.totalPaymentAmount.textContent = formatCurrency(pricingInfo.price);
        dom.paymentDiscountNote.textContent = pricingInfo.note;
        
        dom.paymentModal.style.display = 'flex';
        activeModal = dom.paymentModal;
    }

    function handlePaymentConfirmationSubmit() {
        const txIdInput = dom.cashAppTxId;
        if (!validateField(txIdInput)) {
            txIdInput.focus();
            return;
        }

        // Show success message inside the modal
        dom.paymentInstructions.style.display = 'none';
        dom.modalOrderSuccessMessage.style.display = 'block';
        
        // Populate success message details
        dom.successUserEmail.textContent = dom.userEmail.value;
        dom.successUserEmailInline.textContent = dom.userEmail.value;
        dom.successTxId.textContent = txIdInput.value;
        dom.successNumStubs.textContent = dom.numPaystubs.value;
        dom.successUserNotes.textContent = dom.userNotes.value || 'None provided';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.style.display = 'none';
        activeModal = null;
        // If it was the payment modal, reset its state for next time
        if (modal.id === 'paymentModal') {
            dom.paymentInstructions.style.display = 'block';
            dom.modalOrderSuccessMessage.style.display = 'none';
            dom.cashAppTxId.value = '';
            dom.cashAppTxId.classList.remove('invalid');
            if(dom.cashAppTxIdError) dom.cashAppTxIdError.textContent = '';
        }
    }

    /** Sets up all event listeners for the application. */
    const initializeEventListeners = () => {
        // Step Navigation
        document.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', handleNextStep));
        document.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', handlePrevStep));
        
        // Sidebar & Main Action Buttons
        dom.resetAllFieldsBtn.addEventListener('click', resetAllFormFields);
        dom.saveDraftBtn.addEventListener('click', saveDraftToLocalStorage);
        dom.loadDraftBtn.addEventListener('click', loadDraftFromLocalStorage);
        dom.populateDetailsBtn.addEventListener('click', autoPopulateFromDesiredIncome);
        dom.autoCalculateDeductionsBtn.addEventListener('click', () => {
            autoCalculateDeductions();
            debouncedUpdateLivePreview();
        });


        // Form Inputs & Toggles
        dom.allFormInputs.forEach(input => {
            input.addEventListener('input', debouncedUpdateLivePreview);
            if (input.type === 'select-one' || input.type === 'checkbox' || input.name === 'incomeRepresentationType') {
                input.addEventListener('change', debouncedUpdateLivePreview);
            }
            if (input.required) {
                 input.addEventListener('blur', () => validateField(input));
            }
        });

        // Input formatting & restrictions
        if (dom.companyPhone) {
            dom.companyPhone.addEventListener('input', () => {
                dom.companyPhone.value = formatPhoneNumber(dom.companyPhone.value);
            });
        }

        [dom.companyZip, dom.employeeZip].forEach(zipInput => {
            if (zipInput) {
                zipInput.addEventListener('input', () => {
                    zipInput.value = formatZip(zipInput.value);
                });
            }
        });

        if (dom.employeeSsn) {
            dom.employeeSsn.addEventListener('input', () => {
                dom.employeeSsn.value = formatSsnLast4(dom.employeeSsn.value);
            });
        }

        if (dom.annualSalary) {
            dom.annualSalary.addEventListener('input', () => {
                dom.annualSalary.value = dom.annualSalary.value.replace(/[^0-9.]/g, '');
            });
            dom.annualSalary.addEventListener('blur', () => {
                dom.annualSalary.value = formatCurrency(dom.annualSalary.value);
            });
        }

        [dom.companyName, dom.employeeFullName, dom.companyCity, dom.employeeCity, dom.companyState, dom.employeeState].forEach(nameInput => {
            if (nameInput) {
                nameInput.addEventListener('input', () => {
                    nameInput.value = nameInput.value.replace(/[^a-zA-Z\s]/g, '');
                });
            }
        });

        dom.employmentTypeRadios.forEach(radio => radio.addEventListener('change', () => {
             toggleEmploymentFields();
             debouncedUpdateLivePreview();
        }));
        
        // Special toggles
        dom.incomeRepresentationRadios.forEach(radio => radio.addEventListener('change', () => {
            dom.assumedHourlyHoursGroup.style.display = radio.value === 'Hourly' ? 'block' : 'none';
        }));
        dom.startYtdFromBatch.addEventListener('change', () => {
            dom.initialYtdFieldsContainer.style.display = dom.startYtdFromBatch.checked ? 'none' : 'block';
        });

        // State dropdowns
        if (dom.companyState) dom.companyState.addEventListener('change', handleStateChange);
        if (dom.employeeState) dom.employeeState.addEventListener('change', handleStateChange);

        // Preview Navigation
        dom.prevStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex > 0) { currentPreviewStubIndex--; renderPreviewForIndex(currentPreviewStubIndex); }});
        dom.nextStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex < allStubsData.length - 1) { currentPreviewStubIndex++; renderPreviewForIndex(currentPreviewStubIndex); }});
        
        // Modal Closing
        dom.closePaymentModalBtn.addEventListener('click', () => closeModal(dom.paymentModal));
        dom.closeNotificationModalBtn.addEventListener('click', () => closeModal(dom.notificationModal));
        dom.closeSuccessMessageBtn.addEventListener('click', () => closeModal(dom.paymentModal));
        dom.confirmPaymentBtn.addEventListener('click', handlePaymentConfirmationSubmit);

        // Global keydown/click for closing modals
        window.addEventListener('click', (e) => { if (e.target === activeModal) closeModal(activeModal); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeModal) closeModal(activeModal); });
    };

    /** Application entry point */
    const initializeApp = () => {
        initializeEventListeners();
        showFormStep(0);
        toggleEmploymentFields();
        debouncedUpdateLivePreview();
        console.log('BuellDocs Paystub Generator Initialized');
    };

    initializeApp();
});
