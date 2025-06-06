/* BuellDocs Paystub Generator v2 - script.js */
/*
    Author: Gemini
    Date: June 5, 2025
    Project: BuellDocs Client-Side Paystub Generator v2
    Description: JavaScript logic for the paystub generator application,
                 including form handling, calculations, live preview, and PDF generation.
*/
/* TODO (Build Process): For production deployment, consider minifying this file to reduce its size and improve load times. */


'use strict';

const DEBUG_MODE = true;
const PREVIEW_PLACEHOLDERS = {
    companyName: "Your Company Name",
    companyAddress1: "123 Main St",
    companyCity: "Anytown",
    companyState: "ST",
    companyZip: "12345",
    companyPhone: "Phone: (555) 123-4567",
    companyEin: "EIN: XX-XXXXXXX",
    employeeName: "Employee Name",
    employeeAddress1: "456 Employee Ave",
    employeeCity: "Workville",
    employeeState: "ST",
    employeeZip: "67890",
    employeeSsn: "SSN: XXX-XX-1234",
    date: "YYYY-MM-DD"
};

document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG_MODE) console.log('Initialization sequence started');
    let currentPreviewStubIndex = 0;
    let currentFormStep = 0;
    let currentFormStep = 1;
    // --- DOM Elements --- //
    const paystubForm = document.getElementById('paystubForm');
    if (!paystubForm && DEBUG_MODE) console.error('Missing form element: paystubForm');
    const formSummaryError = document.getElementById('formSummaryError');
    if (!formSummaryError && DEBUG_MODE) console.error('Missing form element: formSummaryError');
    const numPaystubsSelect = document.getElementById('numPaystubs');
    if (!numPaystubsSelect && DEBUG_MODE) console.error('Missing form element: numPaystubs');
    const hourlyPayFrequencyGroup = document.getElementById('hourlyPayFrequencyGroup');
    const hourlyPayFrequencySelect = document.getElementById('hourlyPayFrequency');
    const employmentTypeRadios = document.querySelectorAll('input[name="employmentType"]');
    const hourlyFieldsDiv = document.getElementById('hourlyFields');
    const salariedFieldsDiv = document.getElementById('salariedFields');

    function checkRequiredElements() {
        const ids = ['paystubForm', 'numPaystubs', 'paystubPreviewContent'];
        for (const id of ids) {
            if (!document.getElementById(id)) {
                console.error(`Missing element: #${id}`);
                return false;
            }
        }
        return true;
    }

    if (!checkRequiredElements()) return;

    // Desired Income Representation Elements
    const desiredIncomeAmountInput = document.getElementById('desiredIncomeAmount');
    const desiredIncomePeriodSelect = document.getElementById('desiredIncomePeriod');
    const incomeRepresentationRadios = document.querySelectorAll('input[name="incomeRepresentationType"]');
    const desiredIncomeTypeRadios = document.querySelectorAll('input[name="desiredIncomeType"]');
    const assumedHourlyHoursGroup = document.getElementById('assumedHourlyHoursGroup');
    const assumedHourlyRegularHoursInput = document.getElementById('assumedHourlyRegularHours');
    const isForNjEmploymentCheckbox = document.getElementById('isForNJEmployment');
    const netIncomeAdjustmentNote = document.getElementById('netIncomeAdjustmentNote');
    const populateDetailsBtn = document.getElementById('populateDetailsBtn');

    const annualSalaryInput = document.getElementById('annualSalary');

    const firstNextBtn = document.querySelector('.form-step .next-step');
    const salaryNextBtn = document.querySelector('[data-step="3"] .next-step');

    function parseCurrencyValue(val) {
        if (typeof val !== 'string') {
            if (DEBUG_MODE) console.error('Invalid data type for currency value', val);
            return NaN;
        }
        if (!val) return NaN;
        const cleaned = val.replace(/[^0-9.]/g, '');
        return parseFloat(cleaned);
    }

    function formatCurrencyInput(val) {
        const num = parseCurrencyValue(val);
        if (isNaN(num)) return '';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    function isValidSalary(val) {
        const num = parseCurrencyValue(val);
        const valid = !isNaN(num) && num > 0;
        console.log('isValidSalary', val, valid);
        return valid;
    }

    function validateDesiredIncome() {
        const amount = parseCurrencyValue(desiredIncomeAmountInput.value);
        if (isNaN(amount) || amount <= 0) {
            showError(desiredIncomeAmountInput, 'Please enter a valid salary amount.');
            if (firstNextBtn) firstNextBtn.disabled = true;
            return false;
        }
        clearError(desiredIncomeAmountInput);
        if (firstNextBtn) firstNextBtn.disabled = false;
        return true;
    }

    desiredIncomeAmountInput.addEventListener('input', validateDesiredIncome);
    desiredIncomeAmountInput.addEventListener('blur', () => {
        if (validateDesiredIncome()) {
            desiredIncomeAmountInput.value = formatCurrencyInput(desiredIncomeAmountInput.value);
        }
    });

    function validateAnnualSalary() {
        if (!annualSalaryInput) return true;
        if (!isValidSalary(annualSalaryInput.value)) {
            showError(annualSalaryInput, 'Please enter a valid salary amount.');
            if (salaryNextBtn) salaryNextBtn.disabled = true;
            return false;
        }
        clearError(annualSalaryInput);
        if (salaryNextBtn) salaryNextBtn.disabled = false;
        return true;
    }

    function enablePopulateBtn() {
        if (populateDetailsBtn) {
            populateDetailsBtn.disabled = false;
            populateDetailsBtn.textContent = 'Calculate & Fill Paystub Details \u2794';
        }
    }

    function clearNetIncomeAdjustmentNote() {
        if (netIncomeAdjustmentNote) {
            netIncomeAdjustmentNote.textContent = '';
            netIncomeAdjustmentNote.style.display = 'none';
        }
    }

[desiredIncomeAmountInput, desiredIncomePeriodSelect, assumedHourlyRegularHoursInput,
     isForNjEmploymentCheckbox, ...incomeRepresentationRadios, ...desiredIncomeTypeRadios].forEach(el => {
        el.addEventListener('input', enablePopulateBtn);
        el.addEventListener('change', enablePopulateBtn);
    });

    // Clear net-to-gross note only when the desired amount or type is altered
    desiredIncomeAmountInput.addEventListener('input', clearNetIncomeAdjustmentNote);
    desiredIncomeTypeRadios.forEach(radio => {
        radio.addEventListener('change', clearNetIncomeAdjustmentNote);
    });

    if (annualSalaryInput) {
        annualSalaryInput.addEventListener('input', () => {
            validateAnnualSalary();
            updateLivePreview();
        });
        annualSalaryInput.addEventListener('blur', () => {
            if (validateAnnualSalary()) {
                annualSalaryInput.value = formatCurrencyInput(annualSalaryInput.value);
            }
            updateLivePreview();
        });
    }

    // Logo Preview Elements
    const companyLogoInput = document.getElementById('companyLogo');
    const companyLogoPreviewContainer = document.getElementById('companyLogoPreviewContainer');
    const companyLogoPreviewImg = document.getElementById('companyLogoPreview');
    const companyLogoPlaceholder = companyLogoPreviewContainer.querySelector('.logo-placeholder-text');

    const payrollProviderLogoInput = document.getElementById('payrollProviderLogo');
    const payrollProviderLogoPreviewContainer = document.getElementById('payrollProviderLogoPreviewContainer');
    const payrollProviderLogoPreviewImg = document.getElementById('payrollProviderLogoPreview');
    const payrollProviderLogoPlaceholder = payrollProviderLogoPreviewContainer.querySelector('.logo-placeholder-text');

    const includeVoidedCheckCheckbox = document.getElementById('includeVoidedCheck');
    const federalTaxAmountInput = document.getElementById('federalTaxAmount');
    const socialSecurityAmountInput = document.getElementById('socialSecurityAmount');
    const medicareAmountInput = document.getElementById('medicareAmount');
    const njSdiAmountInput = document.getElementById('njSdiAmount');
    const njFliAmountInput = document.getElementById('njFliAmount');
    const njUiAmountInput = document.getElementById('njUiHcWfAmount');

    const autoCalculateFederalTaxCheckbox = document.getElementById('autoCalculateFederalTax');
    const autoCalculateSocialSecurityCheckbox = document.getElementById('autoCalculateSocialSecurity');
    const autoCalculateMedicareCheckbox = document.getElementById('autoCalculateMedicare');
    const autoCalculateNjSdiCheckbox = document.getElementById('autoCalculateNjSdi');
    const autoCalculateNjFliCheckbox = document.getElementById('autoCalculateNjFli');
    const autoCalculateNjUiCheckbox = document.getElementById('autoCalculateNjUi');
    function createDeductionRow(name = "", amount = 0) {
        const row = document.createElement("div");
        row.className = "deduction-row grid-col-2";
        row.innerHTML = `<div class="form-group"><label>Description</label><input type="text" name="otherDeductionName[]" class="deduction-name" value="${name}"></div><div class="form-group"><label>Amount</label><input type="number" name="otherDeductionAmount[]" class="deduction-amount amount-input" step="0.01" min="0" value="${amount}"></div><button type="button" class="btn btn-secondary btn-sm remove-deduction-btn">Remove</button>`;
        row.querySelector(".remove-deduction-btn").addEventListener("click", () => { row.remove(); updateLivePreview(); });
        row.querySelectorAll("input").forEach(inp => inp.addEventListener("input", updateLivePreview));
        return row;
    }
    function addCustomDeductionRow(name = "", amount = 0) {
        if (!customDeductionsContainer) return;
        const row = createDeductionRow(name, amount);
        customDeductionsContainer.appendChild(row);
    }
    if (customDeductionsContainer) addCustomDeductionRow();
    if (addDeductionBtn) addDeductionBtn.addEventListener("click", () => addCustomDeductionRow());


    // New Federal Tax Elements
    const federalFilingStatusSelect = document.getElementById('federalFilingStatus');

    // Live Preview Elements
    const livePreviewContent = document.getElementById('paystubPreviewContent');
    if (!livePreviewContent && DEBUG_MODE) console.error('Missing form element: paystubPreviewContent');
    const livePreviewStubIndicator = document.getElementById('previewStubIndicator');
    const livePreviewCompanyLogo = document.getElementById('livePreviewCompanyLogo');
    const livePreviewCompanyName = document.getElementById('livePreviewCompanyName');
    const livePreviewCompanyAddress1 = document.getElementById('livePreviewCompanyAddress1');
    const livePreviewCompanyAddress2 = document.getElementById('livePreviewCompanyAddress2');
    const livePreviewCompanyPhone = document.getElementById('livePreviewCompanyPhone');
    const livePreviewCompanyEin = document.getElementById('livePreviewCompanyEin');
    const livePreviewStubXofY = document.getElementById('livePreviewStubXofY');
    const livePreviewEmployeeName = document.getElementById('livePreviewEmployeeName');
    const livePreviewEmployeeAddress1 = document.getElementById('livePreviewEmployeeAddress1');
    const livePreviewEmployeeAddress2 = document.getElementById('livePreviewEmployeeAddress2');
    const livePreviewEmployeeSsn = document.getElementById('livePreviewEmployeeSsn');
    const livePreviewPayPeriodStart = document.getElementById('livePreviewPayPeriodStart');
    const livePreviewPayPeriodEnd = document.getElementById('livePreviewPayPeriodEnd');
    const livePreviewPayDate = document.getElementById('livePreviewPayDate');
    const livePreviewEarningsBody = document.getElementById('livePreviewEarningsBody');
    const livePreviewDeductionsBody = document.getElementById('livePreviewDeductionsBody');
    const livePreviewGrossPay = document.getElementById('livePreviewGrossPay');
    const livePreviewTotalDeductions = document.getElementById('livePreviewTotalDeductions');
    const livePreviewNetPay = document.getElementById('livePreviewNetPay');
    const livePreviewPayrollProviderLogo = document.getElementById('livePreviewPayrollProviderLogo');
    const livePreviewVoidedCheckContainer = document.getElementById('livePreviewVoidedCheckContainer');
    const summaryGrossPay = document.getElementById('summaryGrossPay');
    const summaryTotalDeductions = document.getElementById('summaryTotalDeductions');
    const summaryNetPay = document.getElementById('summaryNetPay');

    const prevStubBtn = document.getElementById('prevStubBtn');
    const nextStubBtn = document.getElementById('nextStubBtn');
    const previewNavControls = document.querySelector('.preview-nav-controls');


    // Buttons
    const resetAllFieldsBtn = document.getElementById('resetAllFieldsBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const loadDraftBtn = document.getElementById('loadDraftBtn');
    const estimateAllDeductionsBtn = document.getElementById('estimateAllDeductionsBtn');
    const previewPdfWatermarkedBtn = document.getElementById('previewPdfWatermarkedBtn');
    const generateAndPayBtn = document.getElementById('generateAndPayBtn');
    const generateAndPayFinalBtn = document.getElementById('generateAndPay');
    const copyKeyDataBtn = document.getElementById('copyKeyData');
    const sharePdfEmailLink = document.getElementById('sharePdfEmail');
    const sharePdfInstructions = document.getElementById('sharePdfInstructions');

    // Ensure tooltip text is accessible to screen readers
    document.querySelectorAll('.tooltip-icon[data-tooltip]').forEach((icon, idx) => {
        if (!icon.hasAttribute('aria-describedby')) {
            const tooltipId = `tooltipText${idx}`;
            const hiddenSpan = document.createElement('span');
            hiddenSpan.id = tooltipId;
            hiddenSpan.className = 'visually-hidden';
            hiddenSpan.textContent = icon.getAttribute('data-tooltip');
            icon.setAttribute('aria-describedby', tooltipId);
            icon.after(hiddenSpan);
        }
    });

    // Modal Elements
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModalBtn = document.getElementById('closePaymentModalBtn');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    const paymentInstructionsDiv = document.getElementById('paymentInstructions');
    const modalOrderSuccessMessageDiv = document.getElementById('modalOrderSuccessMessage');
    const closeSuccessMessageBtn = document.getElementById('closeSuccessMessageBtn');
    const cashAppTxIdInput = document.getElementById('cashAppTxId');
    const totalPaymentAmountSpan = document.getElementById('totalPaymentAmount');
    const paymentDiscountNoteSpan = document.getElementById('paymentDiscountNote');

    const notificationModal = document.getElementById("notificationModal");
    const notificationModalTitle = document.getElementById("notificationModalTitle");
    const notificationModalMessage = document.getElementById("notificationModalMessage");
    const closeNotificationModalBtn = document.getElementById("closeNotificationModalBtn");
    // Success Message Placeholders
    const successUserEmailSpan = document.getElementById('successUserEmail');
    const successUserEmailInlineSpan = document.getElementById('successUserEmailInline');
    const successTxIdSpan = document.getElementById('successTxId');
    const successNumStubsSpan = document.getElementById('successNumStubs');
    const successUserNotesSpan = document.getElementById('successUserNotes');

    // Accessibility: Modal focus management
    const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let activeModal = null;
    let lastFocusedElement = null;

    function trapFocus(e) {
        if (!activeModal) return;
        const focusableEls = activeModal.querySelectorAll(focusableSelector);
        if (e.key === 'Escape') {
            if (activeModal === paymentModal) {
                closePaymentModal();
            } else if (activeModal === notificationModal) {
                closeNotificationModal();
            }
        } else if (e.key === 'Tab') {
            if (focusableEls.length === 0) return;
            const first = focusableEls[0];
            const last = focusableEls[focusableEls.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }

    function openModal(modal) {
        lastFocusedElement = document.activeElement;
        activeModal = modal;
        modal.style.display = 'flex';
        const focusableEls = modal.querySelectorAll(focusableSelector);
        if (focusableEls.length) focusableEls[0].focus();
        document.addEventListener('keydown', trapFocus);
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.removeEventListener('keydown', trapFocus);
        activeModal = null;
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }

    function openPaymentModal() {
        paymentInstructionsDiv.style.display = 'block';
        modalOrderSuccessMessageDiv.style.display = 'none';
        openModal(paymentModal);
    }

    function closePaymentModal() {
        const wasSuccess = modalOrderSuccessMessageDiv.style.display !== 'none';
        closeModal(paymentModal);
        if (wasSuccess) {
            paymentInstructionsDiv.style.display = 'block';
            modalOrderSuccessMessageDiv.style.display = 'none';
            cashAppTxIdInput.value = '';
            clearError(cashAppTxIdInput);
        }
    }

    function openNotificationModal() {
        openModal(notificationModal);
    }

    function closeNotificationModal() {
        closeModal(notificationModal);
    }

    // Multi-step form setup (v2)
    const formSteps = Array.from(document.querySelectorAll('.form-step'));
    const totalSteps = formSteps.length;
    const formProgressIndicator = document.getElementById('formProgressIndicator');
    const progressSteps = [];
    const stepTitles = [];

    formSteps.forEach((step, idx) => {
        step.dataset.step = idx + 1;
        const indicator = document.createElement('div');
        indicator.className = 'progress-step' + (idx === 0 ? ' active' : '');
        indicator.textContent = idx + 1;
        if (formProgressIndicator) formProgressIndicator.appendChild(indicator);
        progressSteps.push(indicator);
        const heading = step.querySelector('h3');
        stepTitles.push(heading ? heading.textContent.trim() : `Step ${idx + 1}`);
    });

    let currentStepIndex = 0;

    function showActiveStep(index) {
        if (index < 0 || index >= formSteps.length) return;
        currentStepIndex = index;
        formSteps.forEach((step, i) => {
            step.style.display = i === index ? 'block' : 'none';
            step.classList.toggle('active', i === index);
        });
        progressSteps.forEach((el, i) => {
            el.classList.toggle('active', i === index);
            el.classList.toggle('completed', i < index);
        });
        updateProgressIndicator(index + 1);
        updateLivePreview();
    }

    function validateStepInputs(index) {
        const stepEl = formSteps[index];
        if (!stepEl) return true;
        let valid = true;
        stepEl.querySelectorAll('input, select, textarea').forEach(inp => {
            if (!validateField(inp)) valid = false;
        });
        return valid;
    }

    function initStepNavigation() {
        document.querySelectorAll('.next-step').forEach(btn => {
            btn.addEventListener('click', () => {
                if (validateStepInputs(currentStepIndex)) {
                    showActiveStep(Math.min(currentStepIndex + 1, formSteps.length - 1));
                }
            });
        });
        document.querySelectorAll('.prev-step').forEach(btn => {
            btn.addEventListener('click', () => {
                showActiveStep(Math.max(currentStepIndex - 1, 0));
            });
        });
    }

    function updateProgressIndicator(currentStepNumber) {
        const indicators = document.querySelectorAll('.progress-step');
        console.log('Current step:', currentStepNumber);
        indicators.forEach(step => {
            const stepNum = parseInt(step.textContent, 10);
            console.log(`Step ${stepNum} initial classes:`, step.className);
            step.classList.remove('completed', 'active');
            if (stepNum < currentStepNumber) {
                step.classList.add('completed');
            } else if (stepNum === currentStepNumber) {
                step.classList.add('active');
            }
            console.log(`Step ${stepNum} updated classes:`, step.className);
        });
    }

    function getCurrentStep() {
        const steps = document.querySelectorAll('.form-step');
        for (const step of steps) {
            const visible = step.style.display === 'block';
            if (visible && step.classList.contains('active')) {
                return parseInt(step.dataset.step, 10);
            }
        }
        const byClass = document.querySelector('.form-step.active');
        if (byClass) return parseInt(byClass.dataset.step, 10);
        const byDisplay = Array.from(steps).find(s => s.style.display === 'block');
        if (byDisplay) return parseInt(byDisplay.dataset.step, 10);
        return 1;
    }

    function showFormStep(stepIndex) {
        formSteps.forEach((step, i) => {
            step.classList.toggle('active', i === stepIndex);
        });
        progressSteps.forEach((el, i) => {
            const active = i === stepIndex;
            el.classList.toggle('active', active);
            if (active) {
                el.setAttribute('aria-current', 'step');
            } else {
                el.removeAttribute('aria-current');
            }
    function showFormStep(stepNumber) {
        if (isNaN(stepNumber)) return;
        if (stepNumber < 1) stepNumber = 1;
        if (stepNumber > totalSteps) stepNumber = totalSteps;
        currentFormStep = stepNumber;

        formSteps.forEach((step, idx) => {
            const active = idx + 1 === stepNumber;
            step.style.display = active ? 'block' : 'none';
            step.classList.toggle('active', active);
            const prevBtn = step.querySelector('.prev-step');
            if (prevBtn) prevBtn.disabled = stepNumber === 1;
        });

        updateProgressIndicator(stepNumber);

        if (formProgressIndicator) {
            const idx = stepIndex;
            formProgressIndicator.setAttribute('aria-label',
                `Step ${stepIndex + 1} of ${progressSteps.length}: ${stepTitles[idx]}`);
        }
        const stepEl = document.querySelector(`.form-step[data-step="${stepIndex + 1}"]`);
        if (stepEl) {
            const prevBtn = stepEl.querySelector('.prev-step');
            if (prevBtn) prevBtn.disabled = stepIndex === 0;
        }
        const prevBtn = formSteps[stepIndex].querySelector('.prev-step-btn');
            const idx = stepNumber - 1;
            formProgressIndicator.setAttribute(
                'aria-label',
                `Step ${stepNumber} of ${progressSteps.length}: ${stepTitles[idx]}`
            );
        }
        const prevBtn = formSteps[stepIndex].querySelector('.prev-step');
        if (prevBtn) prevBtn.disabled = stepIndex === 0;
        currentFormStep = stepIndex;
        updateProgressIndicator(stepIndex + 1);

        updateLivePreview();
    }

    function validateFormStep(stepIndex) {
        if (DEBUG_MODE) console.log(`Attempting to validate step ${stepIndex}`);
        const stepEl = formSteps[stepIndex];

    function validateStep(stepIndex) {
        console.log('validateStep', stepIndex);
        if (stepIndex === 0) {
            const val = annualSalaryInput ? annualSalaryInput.value : '';
            const valid = isValidSalary(val);
            console.log('Step 1 salary valid', valid);
            if (!valid) {
                alert('Please enter a valid salary.');
                if (annualSalaryInput) annualSalaryInput.classList.add('invalid');
            }
            return valid;
    function validateFormStep(stepNumber) {
        const stepEl = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        let valid = true;
        if (stepEl) {
            const inputs = stepEl.querySelectorAll('input, select, textarea');
            inputs.forEach(inp => { if (!validateField(inp)) valid = false; });
        }
        if (DEBUG_MODE) console.log(`Step ${stepIndex} validation ${valid ? 'passed' : 'failed'}`);
        return valid;
        return true;
    }
    function handleDelegatedStepButtons(e) {
        const nextBtn = e.target.closest('.next-step');
        const prevBtn = e.target.closest('.prev-step');

        if (nextBtn) {
            clearSummaryError();
            if (nextBtn.id === 'generateAndPay') {
                if (validateAllFormFields()) {
                    handleMainFormSubmit();
                } else {
                    showSummaryError('Please review the highlighted fields.');
                }
                return;
            }

            if (validateFormStep(currentFormStep)) {
                currentFormStep = Math.min(currentFormStep + 1, formSteps.length - 1);
                showFormStep(currentFormStep);
            } else {
                showSummaryError('Please review the highlighted fields.');
            }
        }

        if (prevBtn) {
            if (currentFormStep > 0) {
                currentFormStep--;
                showFormStep(currentFormStep);
            }
        } else if (prevBtn) {
            const current = getCurrentStep();
            showFormStep(current - 1);
        }
    }

    const prevButtons = document.querySelectorAll('.prev-step');
    for (let i = 0; i < prevButtons.length; i++) {
        const btn = prevButtons[i];
        btn.addEventListener('click', function () {
            if (DEBUG_MODE) console.log(`Attempting to navigate to previous step from step ${currentFormStep}`);
            if (currentFormStep > 0) {
                currentFormStep--;
                if (DEBUG_MODE) console.log(`Navigating to step ${currentFormStep}`);
                showFormStep(currentFormStep);
            } else {
                const current = getCurrentStep();
                if (validateFormStep(current)) {
                    showFormStep(current + 1);
                }
            }
        });
    }

    function setupDelegatedButtonListeners() {
        document.addEventListener('click', handleDelegatedStepButtons);
    }

    function initializeFirstStep() {
        currentPreviewStubIndex = 0;
        currentFormStep = 0;
        showFormStep(0);
        showFormStep(1);
    }

    function initializeAllInputHandlers() {
        setupActionButtons();
    }

    showFormStep(1);


    // --- Initial State & Configuration --- //
    const PAY_PERIODS_PER_YEAR = {
        'Weekly': 52,
        'Bi-Weekly': 26,
        'Semi-Monthly': 24,
        'Monthly': 12,
        'Annual': 1
    };

    const PRICING = {
        1: { price: 29.99, note: "" },
        2: { price: 54.99, note: "Save $5" },
        3: { price: 79.99, note: "Save $10" },
        4: { price: 99.99, note: "Save $20" },
        5: { price: 125.00, note: "$25 each - Bulk rate applied!" }
    };
    const SOCIAL_SECURITY_WAGE_LIMIT_2024 = 168600; // 2024 limit
    const SOCIAL_SECURITY_RATE = 0.062;
    const MEDICARE_RATE = 0.0145;
    const FEDERAL_TAX_RATE = 0.12; // Simplified flat rate for estimation
    const STATE_TAX_RATE = 0.05;   // Simplified flat rate for estimation

    // New Jersey payroll tax constants - 2024 (update annually)
    const NJ_SDI_RATE = 0.0; // 2024 employee SDI contribution
    const NJ_SDI_WAGE_LIMIT = 160200;
    const NJ_FLI_RATE = 0.0; // 2024 employee FLI contribution
    const NJ_FLI_WAGE_LIMIT = 160200;
    const NJ_UIHCWF_RATE = 0.000425; // 0.0425%
    const NJ_UIHCWF_WAGE_LIMIT = 42300;

    function calculateSocialSecurity(grossPay) {
        return parseFloat((grossPay * SOCIAL_SECURITY_RATE).toFixed(2));
    }

    function calculateMedicare(grossPay) {
        return parseFloat((grossPay * MEDICARE_RATE).toFixed(2));
    }

    const NJ_TAX_BRACKETS_2024 = {
        'Single': [
            { limit: 20000, rate: 0.014 },
            { limit: 35000, rate: 0.0175 },
            { limit: 40000, rate: 0.035 },
            { limit: 75000, rate: 0.05525 },
            { limit: 500000, rate: 0.0637 },
            { limit: 1000000, rate: 0.0897 },
            { limit: Infinity, rate: 0.1075 }
        ],
        'Married Filing Jointly': [
            { limit: 20000, rate: 0.014 },
            { limit: 50000, rate: 0.0175 },
            { limit: 70000, rate: 0.0245 },
            { limit: 80000, rate: 0.035 },
            { limit: 150000, rate: 0.05525 },
            { limit: 500000, rate: 0.0637 },
            { limit: 1000000, rate: 0.0897 },
            { limit: Infinity, rate: 0.1075 }
        ]
    };

    // --- Payroll Tax Calculation Helpers --- //
    function calculateSocialSecurityDeduction(grossPay, ytdGross = 0) {
        const remaining = SOCIAL_SECURITY_WAGE_LIMIT_2024 - ytdGross;
        if (remaining <= 0) return 0;
        const taxable = Math.min(grossPay, remaining);
        return parseFloat((taxable * SOCIAL_SECURITY_RATE).toFixed(2));
    }

    function calculateMedicareDeduction(grossPay) {
        return parseFloat((grossPay * MEDICARE_RATE).toFixed(2));
    }

    // Simplified federal tax brackets for quick estimation
    const FEDERAL_TAX_BRACKETS = {
        'Single': [
            { upto: 10000, rate: 0.10 },
            { upto: 40000, rate: 0.12 },
            { upto: 85000, rate: 0.22 },
            { upto: 160000, rate: 0.24 },
            { upto: Infinity, rate: 0.32 }
        ],
        'Married Filing Jointly': [
            { upto: 20000, rate: 0.10 },
            { upto: 80000, rate: 0.12 },
            { upto: 170000, rate: 0.22 },
            { upto: 320000, rate: 0.24 },
            { upto: Infinity, rate: 0.32 }
        ]
    };

    // Calculate deductions at standard tax rates
    function calculateSocialSecurity(grossPay) {
        const taxable = Math.min(grossPay, SOCIAL_SECURITY_WAGE_LIMIT_2024);
        return taxable * SOCIAL_SECURITY_RATE;
    }

    function calculateMedicare(grossPay) {
        return grossPay * MEDICARE_RATE;
    }

    // --- Event Listeners --- //

    // Toggle Hourly/Salaried Fields
    employmentTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleEmploymentFields);
    });
    incomeRepresentationRadios.forEach(radio => {
        radio.addEventListener('change', toggleRepresentationFields);
    });
    populateDetailsBtn.addEventListener('click', autoPopulateFromDesiredIncome);

    // --- Preview Navigation Helpers --- //

    // Update Hourly Pay Frequency Visibility and preview navigation when number of stubs changes
    numPaystubsSelect.addEventListener('change', () => {
        updateHourlyPayFrequencyVisibility();
        currentPreviewStubIndex = 0;

        const numStubs = parseInt(numPaystubsSelect.value) || 1;
        if (previewNavControls) previewNavControls.style.display = numStubs > 1 ? 'block' : 'none';
        updatePreviewNavButtons(numStubs);
        updateLivePreview();
    });
    // Also trigger on employment type change
    employmentTypeRadios.forEach(radio => radio.addEventListener('change', updateHourlyPayFrequencyVisibility));
    isForNjEmploymentCheckbox.addEventListener('change', handleNjEmploymentChange);
    if (autoCalculateFederalTaxCheckbox) autoCalculateFederalTaxCheckbox.addEventListener('change', updateAutoCalculatedFields);
    if (autoCalculateSocialSecurityCheckbox) autoCalculateSocialSecurityCheckbox.addEventListener('change', handleSocialSecurityAutoCalcChange);
    if (autoCalculateMedicareCheckbox) autoCalculateMedicareCheckbox.addEventListener('change', handleMedicareAutoCalcChange);
    if (autoCalculateNjSdiCheckbox) autoCalculateNjSdiCheckbox.addEventListener('change', updateAutoCalculatedFields);
    if (autoCalculateNjFliCheckbox) autoCalculateNjFliCheckbox.addEventListener('change', updateAutoCalculatedFields);
    if (autoCalculateNjUiCheckbox) autoCalculateNjUiCheckbox.addEventListener('change', updateAutoCalculatedFields);

    // Sequential reveal disabled in favor of multi-step navigation


    // Handle Logo Uploads
    companyLogoInput.addEventListener('change', (e) => handleLogoUpload(e, companyLogoPreviewImg, companyLogoPlaceholder));
    payrollProviderLogoInput.addEventListener('change', (e) => handleLogoUpload(e, payrollProviderLogoPreviewImg, payrollProviderLogoPlaceholder));

    // Handle Remove Logo Buttons
    document.querySelectorAll('.btn-remove-logo').forEach(btn => {
        btn.addEventListener('click', () => {
            const inputId = btn.dataset.targetInput;
            const previewId = btn.dataset.targetPreview;
            const placeholderSelector = btn.dataset.targetPlaceholder;
            const inputEl = document.getElementById(inputId);
            const previewEl = document.getElementById(previewId);
            const placeholderEl = document.querySelector(placeholderSelector);
            if (inputEl) inputEl.value = '';
            if (previewEl) {
                previewEl.src = '#';
                previewEl.style.display = 'none';
            }
            if (placeholderEl) placeholderEl.style.display = 'block';
            updateLivePreview();
        });
    });

    // Form input changes for live preview (debounced)
    const formInputs = paystubForm.querySelectorAll('input, select, textarea');
    const debouncedPreview = debounce(updateLivePreview, 300);
    formInputs.forEach(input => {
        input.addEventListener('input', debouncedPreview);
        if (input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio') {
            input.addEventListener('change', debouncedPreview);
        }
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('invalid')) {
                validateField(input);
            }
        });
    });

    if (nextStubBtn && prevStubBtn) {
        nextStubBtn.addEventListener('click', showNextPreviewStub);
        prevStubBtn.addEventListener('click', showPreviousPreviewStub);
    }

    const debouncedTotalsUpdate = debounce(updatePaystubTotals, 300);
    formInputs.forEach(input => {
        input.addEventListener('input', debouncedTotalsUpdate);
        input.addEventListener('change', debouncedTotalsUpdate);
    });
    // Initial preview update
    updateLivePreview();
    updatePaystubTotals();
    const payCalcInputIds = ['hourlyRate','regularHours','overtimeHours','annualSalary','bonus','miscEarningAmount','federalTaxAmount','stateTaxAmount','socialSecurityAmount','medicareAmount','njSdiAmount','njFliAmount','njUiHcWfAmount','healthInsurance','retirement401k','otherDeductionAmount'];
    const payCalcInputs = payCalcInputIds.map(id => document.getElementById(id)).filter(Boolean);
    const debouncedRefreshTotals = debounce(refreshLiveTotals, 300);
    payCalcInputs.forEach(inp => {
        inp.addEventListener('input', debouncedRefreshTotals);
        inp.addEventListener('change', debouncedRefreshTotals);
    });

    const initialNumStubs = parseInt(numPaystubsSelect.value) || 1;

    if (previewNavControls) previewNavControls.style.display = initialNumStubs > 1 ? 'block' : 'none';
    updatePreviewNavButtons(initialNumStubs);

    currentPreviewStubIndex = 0;
    updatePreviewNavButtons();

    const employeeSsnInput = document.getElementById('employeeSsn');
    if (employeeSsnInput) {
        let ssnRaw = '';
        employeeSsnInput.addEventListener('input', e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
            ssnRaw = digits;
            e.target.dataset.rawValue = ssnRaw;
            e.target.value = digits.replace(/(\d{3})(\d{2})(\d{0,4})/, (m, p1, p2, p3) => p3 ? `${p1}-${p2}-${p3}` : `${p1}-${p2}`);
        });
        employeeSsnInput.addEventListener('blur', e => {
            if (ssnRaw.length >= 4) {
                e.target.value = `***-**-${ssnRaw.slice(-4)}`;
            }
        });
        employeeSsnInput.addEventListener('focus', e => {
            if (ssnRaw) {
                e.target.value = ssnRaw.replace(/(\d{3})(\d{2})(\d{0,4})/, (m, p1, p2, p3) => `${p1}-${p2}-${p3}`);
            }
        });
    }

    const companyPhoneInput = document.getElementById('companyPhone');
    if (companyPhoneInput) {
        companyPhoneInput.addEventListener('input', e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            let formatted = digits;
            if (digits.length > 6) {
                formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
            } else if (digits.length > 3) {
                formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`;
            } else if (digits.length > 0) {
                formatted = `(${digits}`;
            }
            e.target.value = formatted;
        });
    }



    // Sidebar Button Actions
    setupActionButtons();
    function setupSidebarButtonActions() {
        if (resetAllFieldsBtn) resetAllFieldsBtn.addEventListener('click', resetAllFormFields);
        if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraftToLocalStorage);
        if (loadDraftBtn) loadDraftBtn.addEventListener('click', loadDraftFromLocalStorage);
        if (estimateAllDeductionsBtn) estimateAllDeductionsBtn.addEventListener('click', estimateAllStandardDeductions);
        if (previewPdfWatermarkedBtn) previewPdfWatermarkedBtn.addEventListener('click', handleWatermarkedPreview);
        if (copyKeyDataBtn) copyKeyDataBtn.addEventListener('click', copyKeyPaystubData);
        if (generateAndPayBtn) generateAndPayBtn.addEventListener('click', handleMainFormSubmit);
    }
    setupSidebarButtonActions();

    if (generateAndPayFinalBtn) {
        generateAndPayFinalBtn.addEventListener('click', () => {
            clearSummaryError();
            if (validateAllFormFields()) {
                handleMainFormSubmit();
            } else {
                showSummaryError('Please review the highlighted fields.');
            }
        });
    }

    // Modal Interactions

    closePaymentModalBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        if (generateAndPayBtn) generateAndPayBtn.disabled = false;
    });
    closeSuccessMessageBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        // Reset modal to initial state for next time
        paymentInstructionsDiv.style.display = 'block';
        modalOrderSuccessMessageDiv.style.display = 'none';
        cashAppTxIdInput.value = '';
        clearError(cashAppTxIdInput);
        if (generateAndPayBtn) generateAndPayBtn.disabled = false;
    });

    closePaymentModalBtn.addEventListener('click', closePaymentModal);
    closeSuccessMessageBtn.addEventListener('click', closePaymentModal);

    closeNotificationModalBtn.addEventListener("click", closeNotificationModal);
    // Close modal if clicked outside of modal-content
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {

            paymentModal.style.display = 'none';
            if (generateAndPayBtn) generateAndPayBtn.disabled = false;

            closePaymentModal();

        }
        if (event.target === notificationModal) {
            closeNotificationModal();
        }
    });
    // --- Core Logic Functions --- //

    function toggleEmploymentFields() {
        const selectedType = document.querySelector('input[name="employmentType"]:checked').value;
        if (selectedType === 'Hourly') {
            hourlyFieldsDiv.style.display = 'block';
            salariedFieldsDiv.style.display = 'none';
            // Set required for hourly, remove for salaried
            setRequired(document.getElementById('hourlyRate'), true);
            setRequired(document.getElementById('regularHours'), true);
            setRequired(document.getElementById('annualSalary'), false);
            setRequired(document.getElementById('salariedPayFrequency'), false);
        } else { // Salaried
            hourlyFieldsDiv.style.display = 'none';
            salariedFieldsDiv.style.display = 'block';
            setRequired(document.getElementById('hourlyRate'), false);
            setRequired(document.getElementById('regularHours'), false);
            setRequired(document.getElementById('annualSalary'), true);
            setRequired(document.getElementById('salariedPayFrequency'), true);
            const payFreqSelect = document.getElementById('salariedPayFrequency');
            if (payFreqSelect && !payFreqSelect.value) payFreqSelect.value = 'Bi-Weekly';
        }
        updateHourlyPayFrequencyVisibility(); // Update based on new employment type
    }

    function updateHourlyPayFrequencyVisibility() {
        const numStubs = parseInt(numPaystubsSelect.value);
        const employmentType = document.querySelector('input[name="employmentType"]:checked').value;
        if (employmentType === 'Hourly' && numStubs > 1) {
            hourlyPayFrequencyGroup.style.display = 'block';
            setRequired(hourlyPayFrequencySelect, true);
        } else {
            hourlyPayFrequencyGroup.style.display = 'none';
            setRequired(hourlyPayFrequencySelect, false);
        }
        updateLivePreview(); // Update stub indicator
    }

    function toggleRepresentationFields() {
        const selected = document.querySelector('input[name="incomeRepresentationType"]:checked').value;
        if (selected === 'Hourly') {
            assumedHourlyHoursGroup.style.display = 'block';
        } else {
            assumedHourlyHoursGroup.style.display = 'none';
        }
    }

    function populateDetailsFromDesiredIncome() {
        const amount = parseCurrencyValue(desiredIncomeAmountInput.value) || 0;
        const period = desiredIncomePeriodSelect.value;
        const type = document.querySelector('input[name="incomeRepresentationType"]:checked').value;
        const hours = parseFloat(assumedHourlyRegularHoursInput.value) || 40;

        let annualAmount = amount;
        if (period === 'Monthly') annualAmount = amount * 12;
        else if (period === 'Weekly') annualAmount = amount * 52;

        if (type === 'Salaried') {
            document.querySelector('input[name="employmentType"][value="Salaried"]').checked = true;
            toggleEmploymentFields();
            document.getElementById('annualSalary').value = formatCurrencyInput(annualAmount);
        } else {
            document.querySelector('input[name="employmentType"][value="Hourly"]').checked = true;
            toggleEmploymentFields();
            const hourlyRate = annualAmount / (hours * 52);
            document.getElementById('hourlyRate').value = hourlyRate.toFixed(2);
            document.getElementById('regularHours').value = hours;
        }

        if (isForNjEmploymentCheckbox.checked) {
            const stateTaxNameInput = document.getElementById('stateTaxName');
            if (stateTaxNameInput && !stateTaxNameInput.value) {
                stateTaxNameInput.value = 'NJ State Tax';
            }
        }

        updateHourlyPayFrequencyVisibility();
        updateLivePreview();

        if (populateDetailsBtn) {
            populateDetailsBtn.textContent = 'Recalculate from Desired Income';
            populateDetailsBtn.disabled = true;
        }
    }

    function handleLogoUpload(event, previewImgElement, placeholderElement) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Resize large images before converting to Data URL to keep
                    // drafts small for LocalStorage (max ~4MB total)
                    const MAX_DIMENSION = 300; // pixels
                    let { width, height } = img;
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    // Slight compression to further reduce size
                    const dataUrl = canvas.toDataURL('image/png', 0.7);
                    previewImgElement.src = dataUrl;
                    previewImgElement.style.display = 'block';
                    if (placeholderElement) placeholderElement.style.display = 'none';
                    updateLivePreview();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            clearError(event.target);
        } else if (file) {
            showError(event.target, 'Please select a valid image file.');
            previewImgElement.src = '#';
            previewImgElement.style.display = 'none';
            if (placeholderElement) placeholderElement.style.display = 'block';
        } else { // No file selected or selection cancelled
            previewImgElement.src = '#';
            previewImgElement.style.display = 'none';
            if (placeholderElement) placeholderElement.style.display = 'block';
        }
    }

    function gatherFormData() {
        if (!paystubForm) {
            if (DEBUG_MODE) console.error('Missing form element: paystubForm');
            return {};
        }
        const formData = new FormData(paystubForm);
        const data = {};
        for (let [key, value] of formData.entries()) {
            const inputElement = paystubForm.elements[key];
            if (inputElement) {
                if (key === 'employeeSsn') {
                    const raw = inputElement.dataset.rawValue || value;
                    data[key] = raw.trim();
                } else if (inputElement instanceof RadioNodeList) {
                    data[key] = value;
                } else if (inputElement.type === 'radio') {
                    if (inputElement.checked) {
                        data[key] = value;
                    }
                } else if (inputElement.type === 'checkbox') {
                    data[key] = inputElement.checked;
                } else if (key === 'desiredIncomeAmount' || key === 'annualSalary') {
                    data[key] = parseCurrencyValue(value) || 0;
                } else if (inputElement.classList.contains('currency-input')) {
                    data[key] = parseCurrencyValue(value) || 0;
                } else if (inputElement.type === 'number' || inputElement.classList.contains('amount-input')) {
                    data[key] = parseFloat(value) || 0; // Ensure numbers, default to 0 if NaN
                } else {
                    data[key] = value.trim();
                }
            }
        }

        // Gather dynamic other deductions
        const otherNames = formData.getAll('otherDeductionName[]');
        const otherAmounts = formData.getAll('otherDeductionAmount[]');
        data.otherDeductions = otherNames.map((n, idx) => ({
            description: n.trim(),
            amount: parseFloat(otherAmounts[idx]) || 0
        })).filter(d => d.description || d.amount);

        // Add logo data if available
        data.companyLogoDataUrl = companyLogoPreviewImg.style.display !== 'none' ? companyLogoPreviewImg.src : null;
        data.payrollProviderLogoDataUrl = payrollProviderLogoPreviewImg.style.display !== 'none' ? payrollProviderLogoPreviewImg.src : null;
        
        // Ensure numeric fields that might be empty but not 0 are handled
        const numericFields = [
            'hourlyRate', 'regularHours', 'overtimeHours', 'annualSalary', 'bonus', 'miscEarningAmount',
            'federalTaxAmount', 'stateTaxAmount', 'socialSecurityAmount', 'medicareAmount',
            'njSdiAmount', 'njFliAmount', 'njUiHcWfAmount',
            'healthInsurance', 'retirement401k',
            'initialYtdGrossPay', 'initialYtdFederalTax', 'initialYtdStateTax',
            'initialYtdSocialSecurity', 'initialYtdMedicare', 'initialYtdNjSdi',
            'initialYtdNjFli', 'initialYtdNjUiHcWf'
        ];
        numericFields.forEach(field => {
            if (data[field] === undefined || data[field] === null || isNaN(data[field])) {
                 const element = document.getElementById(field);
                 if(element && element.value === '') data[field] = 0; // Treat empty string as 0 for calculation
                 else if (element) data[field] = parseFloat(element.value) || 0;
                 else data[field] = 0;
            }
        });

        return data;
    }

    function calculateGrossPay(data) {
        let gross = 0;
        if (data.employmentType === 'Hourly') {
            const rate = data.hourlyRate || 0;
            const regular = data.regularHours || 0;
            const overtime = data.overtimeHours || 0;
            gross = (rate * regular) + (rate * overtime * 1.5);
        } else {
            const freq = data.salariedPayFrequency;
            const periods = PAY_PERIODS_PER_YEAR[freq] || 1;
            gross = (data.annualSalary || 0) / periods;
        }
        gross += (data.bonus || 0);
        gross += (data.miscEarningAmount || 0);
        return gross;
    }

    function calculateTotalDeductions(data) {
        const fields = [
            'federalTaxAmount','stateTaxAmount','socialSecurityAmount','medicareAmount',
            'njSdiAmount','njFliAmount','njUiHcWfAmount','healthInsurance','retirement401k'
        ];
        let sum = fields.reduce((acc, f) => acc + (parseFloat(data[f]) || 0), 0);
        if (Array.isArray(data.otherDeductions)) {
            sum += data.otherDeductions.reduce((a, d) => a + (parseFloat(d.amount) || 0), 0);
        }
        return sum;
    }

    function calculateNetPay(data) {
        return calculateGrossPay(data) - calculateTotalDeductions(data);
    }

    function updatePayPreviewTotals() {
        const data = gatherFormData();
        const gross = calculateGrossPay(data);
        const deductions = calculateTotalDeductions(data);
        const net = gross - deductions;
        livePreviewGrossPay.textContent = formatCurrency(gross);
        livePreviewTotalDeductions.textContent = formatCurrency(deductions);
        livePreviewNetPay.textContent = formatCurrency(net);
    }

    function calculateCurrentPeriodPay(data, initialYtdData = null) {
        const results = {
            grossPay: 0,
            totalTaxes: 0,
            totalOtherDeductions: 0,
            totalDeductions: 0,
            netPay: 0,
            currentPeriodAmounts: {}, // Store individual earning/deduction amounts for the period
            ytdAmounts: {} // Store YTD amounts for display on the stub
        };

        // --- Calculate Gross Pay ---
        if (data.employmentType === 'Hourly') {
            const regularPay = (data.hourlyRate || 0) * (data.regularHours || 0);
            const overtimePay = (data.overtimeHours || 0) * (data.hourlyRate || 0) * 1.5;
            results.grossPay = regularPay + overtimePay;
            results.currentPeriodAmounts.regularPay = regularPay;
            if (data.overtimeHours > 0) results.currentPeriodAmounts.overtimePay = overtimePay;
        } else { // Salaried
            const payFrequency = data.salariedPayFrequency;
            const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 1; // Default to 1 to avoid division by zero
            const baseSalaryPerPeriod = (data.annualSalary || 0) / periodsPerYear;
            results.grossPay = baseSalaryPerPeriod;
            results.currentPeriodAmounts.salary = baseSalaryPerPeriod;
        }
        results.grossPay += (data.bonus || 0);
        results.grossPay += (data.miscEarningAmount || 0);

        if(data.bonus > 0) results.currentPeriodAmounts.bonus = data.bonus;
        if(data.miscEarningAmount > 0 && data.miscEarningName) results.currentPeriodAmounts[data.miscEarningName || 'miscEarning'] = data.miscEarningAmount;

        const estimatedSocialSecurity = results.grossPay * SOCIAL_SECURITY_RATE;
        const estimatedMedicare = results.grossPay * MEDICARE_RATE;

        let socialSecurityAmount = data.socialSecurityAmount || 0;
        if(data.autoCalculateSocialSecurity) {
            socialSecurityAmount = estimatedSocialSecurity;
        }

        let medicareAmount = data.medicareAmount || 0;
        if(data.autoCalculateMedicare) {
            medicareAmount = estimatedMedicare;
        }

        results.estimatedSocialSecurity = estimatedSocialSecurity;
        results.estimatedMedicare = estimatedMedicare;


        const calculatedSocialSecurity = results.grossPay * SOCIAL_SECURITY_RATE;
        const calculatedMedicare = results.grossPay * MEDICARE_RATE;
        results.calculatedSocialSecurity = calculatedSocialSecurity;
        results.calculatedMedicare = calculatedMedicare;

        const socialSecurityUsed = data.autoCalculateSocialSecurity ? calculatedSocialSecurity : (data.socialSecurityAmount || 0);
        const medicareUsed = data.autoCalculateMedicare ? calculatedMedicare : (data.medicareAmount || 0);

        // --- Calculate Total Taxes for Period ---
        let federalTaxForPeriod = data.federalTaxAmount || 0;
        if (data.autoCalculateFederalTax) {
            const freq = data.employmentType === 'Salaried'
                ? data.salariedPayFrequency
                : (data.hourlyPayFrequency || 'Weekly');
            federalTaxForPeriod = estimateFederalTax(results.grossPay, freq, data.federalFilingStatus || 'Single');
        }
        results.totalTaxes += federalTaxForPeriod;
        results.totalTaxes += (data.stateTaxAmount || 0);
        results.totalTaxes += socialSecurityAmount;
        results.totalTaxes += medicareAmount;
        results.totalTaxes += (data.njSdiAmount || 0);
        results.totalTaxes += (data.njFliAmount || 0);
        results.totalTaxes += (data.njUiHcWfAmount || 0);

        results.currentPeriodAmounts.federalTax = federalTaxForPeriod;
        if (data.stateTaxName) results.currentPeriodAmounts[data.stateTaxName || 'stateTax'] = data.stateTaxAmount || 0;
        else results.currentPeriodAmounts.stateTax = data.stateTaxAmount || 0;
        results.currentPeriodAmounts.socialSecurity = socialSecurityAmount;
        results.currentPeriodAmounts.medicare = medicareAmount;
        results.currentPeriodAmounts.njSdi = data.njSdiAmount || 0;
        results.currentPeriodAmounts.njFli = data.njFliAmount || 0;
        results.currentPeriodAmounts.njUiHcWf = data.njUiHcWfAmount || 0;

        // --- Calculate Total Other Deductions for Period ---
        results.totalOtherDeductions += (data.healthInsurance || 0);
        results.totalOtherDeductions += (data.retirement401k || 0);
        if (Array.isArray(data.otherDeductions)) {
            data.otherDeductions.forEach(d => {
                results.totalOtherDeductions += d.amount || 0;
            });
        }

        if(data.healthInsurance > 0) results.currentPeriodAmounts.healthInsurance = data.healthInsurance;
        if(data.retirement401k > 0) results.currentPeriodAmounts.retirement401k = data.retirement401k;
        if (Array.isArray(data.otherDeductions)) {
            data.otherDeductions.forEach(d => {
                if (d.amount > 0 && d.description) {
                    results.currentPeriodAmounts[d.description] = d.amount;
                }
            });
        }


        // --- Total Deductions & Net Pay ---
        results.totalDeductions = results.totalTaxes + results.totalOtherDeductions;
        results.netPay = results.grossPay - results.totalDeductions;

        // --- Accumulate YTD ---
        // YTD for this stub = Initial YTD (or previous stub's YTD) + Current Period's amounts
        const ytdBase = initialYtdData || {
            grossPay: data.initialYtdGrossPay || 0,
            federalTax: data.initialYtdFederalTax || 0,
            stateTax: data.initialYtdStateTax || 0,
            socialSecurity: data.initialYtdSocialSecurity || 0,
            medicare: data.initialYtdMedicare || 0,
            njSdi: data.initialYtdNjSdi || 0,
            njFli: data.initialYtdNjFli || 0,
            njUiHcWf: data.initialYtdNjUiHcWf || 0,
            healthInsurance: 0, // Assuming YTD for these optional deductions starts fresh or needs specific YTD inputs
            retirement401k: 0,
            bonus: 0,
            miscEarning: 0,
            // Add other deduction YTDs if they were inputted as initial YTD
        };
        if (Array.isArray(data.otherDeductions)) {
            data.otherDeductions.forEach(d => {
                if (initialYtdData && initialYtdData[d.description] != null) {
                    ytdBase[d.description] = initialYtdData[d.description];
                } else {
                    ytdBase[d.description] = 0;
                }
            });
        }
        if(initialYtdData && data.miscEarningName && initialYtdData[data.miscEarningName]) {
             ytdBase[data.miscEarningName] = initialYtdData[data.miscEarningName];
        } else if (data.miscEarningName) {
            ytdBase[data.miscEarningName] = 0;
        }


        results.ytdAmounts.grossPay = (ytdBase.grossPay || 0) + results.grossPay;
        results.ytdAmounts.federalTax = (ytdBase.federalTax || 0) + federalTaxForPeriod;
        results.ytdAmounts.stateTax = (ytdBase.stateTax || 0) + (data.stateTaxAmount || 0);
        results.ytdAmounts.socialSecurity = (ytdBase.socialSecurity || 0) + socialSecurityAmount;
        results.ytdAmounts.medicare = (ytdBase.medicare || 0) + medicareAmount;
        results.ytdAmounts.njSdi = (ytdBase.njSdi || 0) + (data.njSdiAmount || 0);
        results.ytdAmounts.njFli = (ytdBase.njFli || 0) + (data.njFliAmount || 0);
        results.ytdAmounts.njUiHcWf = (ytdBase.njUiHcWf || 0) + (data.njUiHcWfAmount || 0);

        // YTD for other earnings/deductions displayed on stub
        if(data.employmentType === 'Hourly') {
            results.ytdAmounts.regularPay = (ytdBase.regularPay || 0) + results.currentPeriodAmounts.regularPay;
            if(results.currentPeriodAmounts.overtimePay) results.ytdAmounts.overtimePay = (ytdBase.overtimePay || 0) + results.currentPeriodAmounts.overtimePay;
        } else {
            results.ytdAmounts.salary = (ytdBase.salary || 0) + results.currentPeriodAmounts.salary;
        }
        if(results.currentPeriodAmounts.bonus) results.ytdAmounts.bonus = (ytdBase.bonus || 0) + results.currentPeriodAmounts.bonus;

        if(data.miscEarningName && results.currentPeriodAmounts[data.miscEarningName]) {
             results.ytdAmounts[data.miscEarningName] = (ytdBase[data.miscEarningName] || 0) + results.currentPeriodAmounts[data.miscEarningName];
        }

        if(results.currentPeriodAmounts.healthInsurance) results.ytdAmounts.healthInsurance = (ytdBase.healthInsurance || 0) + results.currentPeriodAmounts.healthInsurance;
        if(results.currentPeriodAmounts.retirement401k) results.ytdAmounts.retirement401k = (ytdBase.retirement401k || 0) + results.currentPeriodAmounts.retirement401k;
        
        if (Array.isArray(data.otherDeductions)) {
            data.otherDeductions.forEach(d => {
                if (results.currentPeriodAmounts[d.description]) {
                    results.ytdAmounts[d.description] = (ytdBase[d.description] || 0) + results.currentPeriodAmounts[d.description];
                }
            });
        }


        return results;
    }

    function getNextPayPeriod(currentStartDateStr, currentEndDateStr, currentPayDateStr, frequency) {
        let currentStartDate = new Date(currentStartDateStr + 'T00:00:00'); // Ensure local timezone by not specifying 'Z'
        let currentEndDate = new Date(currentEndDateStr + 'T00:00:00');
        let currentPayDate = new Date(currentPayDateStr + 'T00:00:00');

        let nextStartDate = new Date(currentStartDate);
        let nextEndDate = new Date(currentEndDate);
        let nextPayDate = new Date(currentPayDate);
        const originalPayDayOfMonth = currentPayDate.getDate();


        switch (frequency) {
            case 'Weekly':
                nextStartDate.setDate(currentStartDate.getDate() + 7);
                nextEndDate.setDate(currentEndDate.getDate() + 7);
                nextPayDate.setDate(currentPayDate.getDate() + 7);
                break;
            case 'Bi-Weekly':
                nextStartDate.setDate(currentStartDate.getDate() + 14);
                nextEndDate.setDate(currentEndDate.getDate() + 14);
                nextPayDate.setDate(currentPayDate.getDate() + 14);
                break;
            case 'Monthly':
                nextStartDate.setMonth(currentStartDate.getMonth() + 1);
                nextEndDate.setMonth(currentEndDate.getMonth() + 1);
                
                // Adjust end date if it rolls over to an invalid date (e.g., Jan 31 to Feb 31 -> Feb 28/29)
                if (nextEndDate.getDate() < currentEndDate.getDate() && currentEndDate.getDate() > 28) { // Check if month rolled over and original was end of month
                     nextEndDate = new Date(nextStartDate.getFullYear(), nextStartDate.getMonth() + 1, 0); // Last day of new start date's month
                }


                // Handle pay date carefully for monthly
                nextPayDate = new Date(currentPayDate); // Start from current pay date
                nextPayDate.setMonth(currentPayDate.getMonth() + 1);
                // If the original pay day doesn't exist in the next month (e.g. 31st in Feb), set to last day
                if (nextPayDate.getDate() !== originalPayDayOfMonth) {
                    nextPayDate.setDate(0); // Sets to the last day of the previous month (which is now the target month)
                }
                break;
            case 'Semi-Monthly':
                // Logic: If current end date is on or before 15th, next period is 16th to EOM of current month.
                // If current end date is after 15th, next period is 1st to 15th of next month.
                if (currentEndDate.getDate() <= 15) {
                    nextStartDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth(), 16);
                    nextEndDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() + 1, 0); // Last day of current month
                } else {
                    nextStartDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() + 1, 1); // 1st of next month
                    nextEndDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth() + 1, 15); // 15th of next month
                }
                // Pay date for semi-monthly is typically the period end date
                nextPayDate = new Date(nextEndDate);
                break;
        }

        // Adjust pay date if it falls on a weekend
        const dayOfWeek = nextPayDate.getDay();
        if (dayOfWeek === 6) { // Saturday -> move to preceding Friday
            nextPayDate.setDate(nextPayDate.getDate() - 1);
        } else if (dayOfWeek === 0) { // Sunday -> move to following Monday
            nextPayDate.setDate(nextPayDate.getDate() + 1);
        }

        return {
            startDate: nextStartDate.toISOString().split('T')[0],
            endDate: nextEndDate.toISOString().split('T')[0],
            payDate: nextPayDate.toISOString().split('T')[0]
        };
    }


    function updateLivePreview() {
        const formData = gatherFormData();
        if (!livePreviewContent) {
            if (DEBUG_MODE) console.error('Null preview element: livePreviewContent');
            return;
        }
        if (DEBUG_MODE) console.log('updateLivePreview called with:', formData);

        const defaults = {
            companyName: 'Your Company Name',
            companyStreetAddress: '123 Main St',
            companyCity: 'Anytown',
            companyState: 'ST',
            companyZip: '12345',
            companyPhone: 'Phone: (555) 123-4567',
            companyEin: 'EIN: XX-XXXXXXX',
            employeeFullName: 'Employee Name',
            employeeStreetAddress: '456 Employee Ave',
            employeeCity: 'Workville',
            employeeState: 'ST',
            employeeZip: '67890',
            employeeSsn: 'SSN: XXX-XX-NNNN',
            payPeriodStartDate: 'YYYY-MM-DD',
            payPeriodEndDate: 'YYYY-MM-DD',
            payDate: 'YYYY-MM-DD'
        };
        const numStubs = parseInt(numPaystubsSelect.value) || 1;

        // Initialize running YTDs with any starting values from the form
        let runningYtdData = {
            grossPay: formData.initialYtdGrossPay,
            federalTax: formData.initialYtdFederalTax,
            stateTax: formData.initialYtdStateTax,
            socialSecurity: formData.initialYtdSocialSecurity,
            medicare: formData.initialYtdMedicare,
            njSdi: formData.initialYtdNjSdi,
            njFli: formData.initialYtdNjFli,
            njUiHcWf: formData.initialYtdNjUiHcWf,
        };
        if (formData.employmentType === 'Hourly') {
            runningYtdData.regularPay = 0;
            runningYtdData.overtimePay = 0;
        } else {
            runningYtdData.salary = 0;
        }
        if (formData.bonus > 0) runningYtdData.bonus = 0;
        if (formData.miscEarningName) runningYtdData[formData.miscEarningName] = 0;
        if (formData.healthInsurance > 0) runningYtdData.healthInsurance = 0;
        if (formData.retirement401k > 0) runningYtdData.retirement401k = 0;
        if (Array.isArray(formData.otherDeductions)) {
            formData.otherDeductions.forEach(d => {
                if (d.description) runningYtdData[d.description] = 0;
            });
        }

        let currentPeriodStartDate = formData.payPeriodStartDate;
        let currentPeriodEndDate = formData.payPeriodEndDate;
        let currentPayDate = formData.payDate;
        let calculations = calculateCurrentPeriodPay({
            ...formData,
            payPeriodStartDate: currentPeriodStartDate,
            payPeriodEndDate: currentPeriodEndDate,
            payDate: currentPayDate
        }, runningYtdData);
        runningYtdData = { ...calculations.ytdAmounts };

        // Iterate through stubs up to the one being previewed
        for (let i = 1; i <= currentPreviewStubIndex; i++) {
            const frequencyForDateCalc = formData.employmentType === 'Hourly'
                ? hourlyPayFrequencySelect.value
                : formData.salariedPayFrequency;
            const nextPeriod = getNextPayPeriod(currentPeriodStartDate, currentPeriodEndDate, currentPayDate, frequencyForDateCalc);
            currentPeriodStartDate = nextPeriod.startDate;
            currentPeriodEndDate = nextPeriod.endDate;
            currentPayDate = nextPeriod.payDate;

            calculations = calculateCurrentPeriodPay({
                ...formData,
                payPeriodStartDate: currentPeriodStartDate,
                payPeriodEndDate: currentPeriodEndDate,
                payDate: currentPayDate
            }, runningYtdData);
            runningYtdData = { ...calculations.ytdAmounts };
        }

        const displayDataForStub = {
            ...formData,
            payPeriodStartDate: currentPeriodStartDate,
            payPeriodEndDate: currentPeriodEndDate,
            payDate: currentPayDate
        };
        if (DEBUG_MODE) console.log('displayDataForStub:', displayDataForStub);
        // Update stub indicator
        livePreviewStubIndicator.textContent = `(Previewing Stub: ${currentPreviewStubIndex + 1} of ${numStubs})`;
        livePreviewStubXofY.textContent = `Stub ${currentPreviewStubIndex + 1} of ${numStubs}`;

        // Company Info
        livePreviewCompanyName.textContent = displayDataForStub.companyName || PREVIEW_PLACEHOLDERS.companyName;
        livePreviewCompanyAddress1.textContent = displayDataForStub.companyStreetAddress || PREVIEW_PLACEHOLDERS.companyAddress1;
        livePreviewCompanyAddress2.textContent = `${displayDataForStub.companyCity || PREVIEW_PLACEHOLDERS.companyCity}, ${displayDataForStub.companyState || PREVIEW_PLACEHOLDERS.companyState} ${displayDataForStub.companyZip || PREVIEW_PLACEHOLDERS.companyZip}`;
        livePreviewCompanyPhone.textContent = displayDataForStub.companyPhone ? `Phone: ${displayDataForStub.companyPhone}` : PREVIEW_PLACEHOLDERS.companyPhone;
        livePreviewCompanyEin.textContent = displayDataForStub.companyEin ? `EIN: ${displayDataForStub.companyEin}` : PREVIEW_PLACEHOLDERS.companyEin;
        livePreviewCompanyName.textContent = displayDataForStub.companyName || defaults.companyName;
        livePreviewCompanyAddress1.textContent = displayDataForStub.companyStreetAddress || defaults.companyStreetAddress;
        livePreviewCompanyAddress2.textContent = `${displayDataForStub.companyCity || defaults.companyCity}, ${displayDataForStub.companyState || defaults.companyState} ${displayDataForStub.companyZip || defaults.companyZip}`;
        livePreviewCompanyPhone.textContent = displayDataForStub.companyPhone ? `Phone: ${displayDataForStub.companyPhone}` : defaults.companyPhone;
        livePreviewCompanyEin.textContent = displayDataForStub.companyEin ? `EIN: ${displayDataForStub.companyEin}` : defaults.companyEin;
        if (displayDataForStub.companyLogoDataUrl) {
            livePreviewCompanyLogo.src = displayDataForStub.companyLogoDataUrl;
            livePreviewCompanyLogo.style.display = 'block';
        } else {
            livePreviewCompanyLogo.style.display = 'none';
        }

        // Employee Info
        livePreviewEmployeeName.textContent = displayDataForStub.employeeFullName || PREVIEW_PLACEHOLDERS.employeeName;
        livePreviewEmployeeAddress1.textContent = displayDataForStub.employeeStreetAddress || PREVIEW_PLACEHOLDERS.employeeAddress1;
        livePreviewEmployeeAddress2.textContent = `${displayDataForStub.employeeCity || PREVIEW_PLACEHOLDERS.employeeCity}, ${displayDataForStub.employeeState || PREVIEW_PLACEHOLDERS.employeeState} ${displayDataForStub.employeeZip || PREVIEW_PLACEHOLDERS.employeeZip}`;
        livePreviewEmployeeSsn.textContent = displayDataForStub.employeeSsn ? `SSN: ${maskSSN(displayDataForStub.employeeSsn)}` : PREVIEW_PLACEHOLDERS.employeeSsn;

        livePreviewPayPeriodStart.textContent = displayDataForStub.payPeriodStartDate || PREVIEW_PLACEHOLDERS.date;
        livePreviewPayPeriodEnd.textContent = displayDataForStub.payPeriodEndDate || PREVIEW_PLACEHOLDERS.date;
        livePreviewPayDate.textContent = displayDataForStub.payDate || PREVIEW_PLACEHOLDERS.date;
        livePreviewEmployeeName.textContent = displayDataForStub.employeeFullName || defaults.employeeFullName;
        livePreviewEmployeeAddress1.textContent = displayDataForStub.employeeStreetAddress || defaults.employeeStreetAddress;
        livePreviewEmployeeAddress2.textContent = `${displayDataForStub.employeeCity || defaults.employeeCity}, ${displayDataForStub.employeeState || defaults.employeeState} ${displayDataForStub.employeeZip || defaults.employeeZip}`;
        livePreviewEmployeeSsn.textContent = displayDataForStub.employeeSsn ? `SSN: ${maskSSN(displayDataForStub.employeeSsn)}` : defaults.employeeSsn;

        livePreviewPayPeriodStart.textContent = displayDataForStub.payPeriodStartDate || defaults.payPeriodStartDate;
        livePreviewPayPeriodEnd.textContent = displayDataForStub.payPeriodEndDate || defaults.payPeriodEndDate;
        livePreviewPayDate.textContent = displayDataForStub.payDate || defaults.payDate;

        livePreviewEarningsBody.innerHTML = '';
        if (displayDataForStub.employmentType === 'Hourly') {
            addEarningRow('Regular Pay', displayDataForStub.regularHours, displayDataForStub.hourlyRate, calculations.currentPeriodAmounts.regularPay, calculations.ytdAmounts.regularPay);
            if (displayDataForStub.overtimeHours > 0 && calculations.currentPeriodAmounts.overtimePay) {
                addEarningRow('Overtime Pay', displayDataForStub.overtimeHours, (displayDataForStub.hourlyRate || 0) * 1.5, calculations.currentPeriodAmounts.overtimePay, calculations.ytdAmounts.overtimePay);
            }
        } else {
            const payFrequency = displayDataForStub.salariedPayFrequency;
            const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
            const salaryPerPeriod = (displayDataForStub.annualSalary || 0) / periodsPerYear;
            addEarningRow('Salary', 1, salaryPerPeriod, calculations.currentPeriodAmounts.salary, calculations.ytdAmounts.salary);
        }
        if (displayDataForStub.bonus > 0) {
            addEarningRow('Bonus', '', '', calculations.currentPeriodAmounts.bonus, calculations.ytdAmounts.bonus);
        }
        if (displayDataForStub.miscEarningAmount > 0 && displayDataForStub.miscEarningName) {
            addEarningRow(displayDataForStub.miscEarningName, '', '', calculations.currentPeriodAmounts[displayDataForStub.miscEarningName], calculations.ytdAmounts[displayDataForStub.miscEarningName]);
        }

        livePreviewDeductionsBody.innerHTML = '';
        addDeductionRow('Federal Income Tax', calculations.currentPeriodAmounts.federalTax, calculations.ytdAmounts.federalTax);
        if (displayDataForStub.stateTaxName) addDeductionRow(displayDataForStub.stateTaxName, calculations.currentPeriodAmounts[displayDataForStub.stateTaxName], calculations.ytdAmounts.stateTax);
        else addDeductionRow('State Income Tax', calculations.currentPeriodAmounts.stateTax, calculations.ytdAmounts.stateTax);

        addDeductionRow('Social Security', calculations.currentPeriodAmounts.socialSecurity, calculations.ytdAmounts.socialSecurity);
        addDeductionRow('Medicare', calculations.currentPeriodAmounts.medicare, calculations.ytdAmounts.medicare);
        if (displayDataForStub.njSdiAmount > 0) addDeductionRow('NJ SDI', calculations.currentPeriodAmounts.njSdi, calculations.ytdAmounts.njSdi);
        if (displayDataForStub.njFliAmount > 0) addDeductionRow('NJ FLI', calculations.currentPeriodAmounts.njFli, calculations.ytdAmounts.njFli);
        if (displayDataForStub.njUiHcWfAmount > 0) addDeductionRow('NJ UI/HC/WF', calculations.currentPeriodAmounts.njUiHcWf, calculations.ytdAmounts.njUiHcWf);
        if (displayDataForStub.healthInsurance > 0) addDeductionRow('Health Insurance', calculations.currentPeriodAmounts.healthInsurance, calculations.ytdAmounts.healthInsurance);
        if (displayDataForStub.retirement401k > 0) addDeductionRow('Retirement (401k)', calculations.currentPeriodAmounts.retirement401k, calculations.ytdAmounts.retirement401k);
        if (Array.isArray(displayDataForStub.otherDeductions)) {
            displayDataForStub.otherDeductions.forEach(d => {
                if (d.amount > 0 && d.description) {
                    addDeductionRow(d.description, calculations.currentPeriodAmounts[d.description], calculations.ytdAmounts[d.description]);
                }
            });
        }

        livePreviewGrossPay.textContent = formatCurrency(calculations.grossPay);
        livePreviewTotalDeductions.textContent = formatCurrency(calculations.totalDeductions);
        livePreviewNetPay.textContent = formatCurrency(calculations.netPay);
        summaryGrossPay.textContent = formatCurrency(calculations.grossPay);
        summaryTotalDeductions.textContent = formatCurrency(calculations.totalDeductions);
        summaryNetPay.textContent = formatCurrency(calculations.netPay);

        if (displayDataForStub.payrollProviderLogoDataUrl) {
            livePreviewPayrollProviderLogo.src = displayDataForStub.payrollProviderLogoDataUrl;
            livePreviewPayrollProviderLogo.style.display = 'block';
        } else {
            livePreviewPayrollProviderLogo.style.display = 'none';
        }
        livePreviewVoidedCheckContainer.style.display = displayDataForStub.includeVoidedCheck ? 'block' : 'none';

        updatePreviewNavButtons(numStubs);
        if (DEBUG_MODE) console.log('Live preview updated for stub', currentPreviewStubIndex + 1, { displayDataForStub, calculations });
    }

    function updatePreviewNavButtons(numStubs = parseInt(numPaystubsSelect.value) || 1) {
        if (!prevStubBtn || !nextStubBtn) return;
        prevStubBtn.disabled = currentPreviewStubIndex === 0;
        nextStubBtn.disabled = currentPreviewStubIndex >= numStubs - 1;
    }

    function showNextPreviewStub() {
        const numStubs = parseInt(numPaystubsSelect.value) || 1;
        if (currentPreviewStubIndex < numStubs - 1) {
            currentPreviewStubIndex++;
            updateLivePreview();
        }
        updatePreviewNavButtons(numStubs);
    }

    function showPreviousPreviewStub() {
        const numStubs = parseInt(numPaystubsSelect.value) || 1;
        if (currentPreviewStubIndex > 0) {
            currentPreviewStubIndex--;
            updateLivePreview();
        }
        updatePreviewNavButtons(numStubs);

        // Ensure summary totals reflect latest input
        updatePayPreviewTotals();

    }

    function addEarningRow(description, hours, rate, current, ytd) {
        const row = livePreviewEarningsBody.insertRow();
        row.insertCell().textContent = description;
        row.insertCell().textContent = (hours !== undefined && hours !== '') ? parseFloat(hours).toFixed(2) : '';
        row.insertCell().textContent = (rate !== undefined && rate !== '') ? formatCurrency(rate, false) : ''; // No $ for rate
        row.insertCell().textContent = formatCurrency(current);
        row.insertCell().textContent = formatCurrency(ytd);

        // For responsive table attributes
        row.cells[1].setAttribute('data-label', 'Hours');
        row.cells[2].setAttribute('data-label', 'Rate');
        row.cells[3].setAttribute('data-label', 'Current');
        row.cells[4].setAttribute('data-label', 'YTD');
    }

    function addDeductionRow(description, current, ytd) {
        const row = livePreviewDeductionsBody.insertRow();
        row.insertCell().textContent = description;
        row.insertCell().textContent = formatCurrency(current);
        row.insertCell().textContent = formatCurrency(ytd);
        // For responsive table attributes
        row.cells[1].setAttribute('data-label', 'Current');
        row.cells[2].setAttribute('data-label', 'YTD');
    }

    // Basic pay calculations used for quick live updates
    function calculateGrossPay() {
        return calculateCurrentPeriodPay(gatherFormData()).grossPay;
    }

    function calculateTotalDeductions() {
        return calculateCurrentPeriodPay(gatherFormData()).totalDeductions;
    }

    function calculateNetPay() {
        return calculateCurrentPeriodPay(gatherFormData()).netPay;
    }

    function updatePaystubTotals() {
        const gross = calculateGrossPay();
        const totalDeductions = calculateTotalDeductions();
        const netPay = calculateNetPay();

        livePreviewGrossPay.textContent = formatCurrency(gross);
        livePreviewTotalDeductions.textContent = formatCurrency(totalDeductions);
        livePreviewNetPay.textContent = formatCurrency(netPay);

        // Also update the sticky summary bar at the bottom
        if (summaryGrossPay && summaryTotalDeductions && summaryNetPay) {
            summaryGrossPay.textContent = formatCurrency(gross);
            summaryTotalDeductions.textContent = formatCurrency(totalDeductions);
            summaryNetPay.textContent = formatCurrency(netPay);
        }
    }

    function computeGrossPayFromInputs() {
        const data = gatherFormData();
        let gross = 0;
        if (data.employmentType === 'Hourly') {
            const rate = parseFloat(data.hourlyRate) || 0;
            const reg = parseFloat(data.regularHours) || 0;
            const overtime = parseFloat(data.overtimeHours) || 0;
            gross = (rate * reg) + (rate * overtime * 1.5);
        } else {
            const freq = data.salariedPayFrequency;
            const periods = PAY_PERIODS_PER_YEAR[freq] || 1;
            gross = (parseFloat(data.annualSalary) || 0) / periods;
        }
        gross += parseFloat(data.bonus) || 0;
        gross += parseFloat(data.miscEarningAmount) || 0;
        return gross;
    }

    function computeTotalDeductionsFromInputs() {
        const data = gatherFormData();
        const fields = ['federalTaxAmount','stateTaxAmount','socialSecurityAmount','medicareAmount','njSdiAmount','njFliAmount','njUiHcWfAmount','healthInsurance','retirement401k','otherDeductionAmount'];
        return fields.reduce((sum, f) => sum + (parseFloat(data[f]) || 0), 0);
    }

    function computeNetPayFromInputs() {
        return computeGrossPayFromInputs() - computeTotalDeductionsFromInputs();
    }

    function refreshLiveTotals() {
        livePreviewGrossPay.textContent = formatCurrency(computeGrossPayFromInputs());
        livePreviewTotalDeductions.textContent = formatCurrency(computeTotalDeductionsFromInputs());
        livePreviewNetPay.textContent = formatCurrency(computeNetPayFromInputs());
    }


    function generateAndDownloadPdf(isPreviewMode) {
        clearSummaryError();
        if (!validateAllFormFields()) {
            showSummaryError('Please review the highlighted fields below.');
            const firstError = paystubForm.querySelector('.invalid');
            if (firstError) firstError.focus();
            // Notify the user once about the validation issue
            showNotificationModal('Validation Error', 'Please fix the errors in the form before generating the PDF.'); // Replace with custom modal later
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const formData = gatherFormData();
            const numStubsToGenerate = parseInt(numPaystubsSelect.value) || 1;

        let runningYtdData = { // Initial YTDs from form for the first stub
            grossPay: formData.initialYtdGrossPay,
            federalTax: formData.initialYtdFederalTax,
            stateTax: formData.initialYtdStateTax,
            socialSecurity: formData.initialYtdSocialSecurity,
            medicare: formData.initialYtdMedicare,
            njSdi: formData.initialYtdNjSdi,
            njFli: formData.initialYtdNjFli,
            njUiHcWf: formData.initialYtdNjUiHcWf,
            // Add other YTD fields here if they have initial inputs
            // Example: healthInsurance: formData.initialYtdHealthInsurance (if such a field existed)
        };
         if(formData.employmentType === 'Hourly') {
            runningYtdData.regularPay = 0; // Will be accumulated
            runningYtdData.overtimePay = 0; // Will be accumulated
        } else {
            runningYtdData.salary = 0; // Will be accumulated
        }
        if(formData.bonus > 0) runningYtdData.bonus = 0;
        if(formData.miscEarningName) runningYtdData[formData.miscEarningName] = 0;
        if(formData.healthInsurance > 0) runningYtdData.healthInsurance = 0;
        if(formData.retirement401k > 0) runningYtdData.retirement401k = 0;
        if (Array.isArray(formData.otherDeductions)) {
            formData.otherDeductions.forEach(d => {
                if (d.description) runningYtdData[d.description] = 0;
            });
        }


        let currentPeriodStartDate = formData.payPeriodStartDate;
        let currentPeriodEndDate = formData.payPeriodEndDate;
        let currentPayDate = formData.payDate;

        for (let i = 0; i < numStubsToGenerate; i++) {
            const stubDataForPdf = { ...formData }; // Copy base form data for this stub
            // Update dates for the current stub
            stubDataForPdf.payPeriodStartDate = currentPeriodStartDate;
            stubDataForPdf.payPeriodEndDate = currentPeriodEndDate;
            stubDataForPdf.payDate = currentPayDate;

            const calculations = calculateCurrentPeriodPay(stubDataForPdf, runningYtdData);
            generatePdfPage(doc, stubDataForPdf, calculations, isPreviewMode, i + 1, numStubsToGenerate);

            // Update running YTD for the next stub
            runningYtdData = { ...calculations.ytdAmounts }; // The YTD from the current stub becomes the initial for the next

            if (i < numStubsToGenerate - 1) { // If not the last stub, add new page and calculate next period dates
                doc.addPage();
                let frequencyForDateCalc = formData.employmentType === 'Hourly' ? hourlyPayFrequencySelect.value : formData.salariedPayFrequency;
                const nextPeriod = getNextPayPeriod(currentPeriodStartDate, currentPeriodEndDate, currentPayDate, frequencyForDateCalc);
                currentPeriodStartDate = nextPeriod.startDate;
                currentPeriodEndDate = nextPeriod.endDate;
                currentPayDate = nextPeriod.payDate;
            }
        }

        doc.save(isPreviewMode ? 'BuellDocs_Paystub_Preview.pdf' : 'BuellDocs_Paystub.pdf');
        if (isPreviewMode && sharePdfEmailLink && sharePdfInstructions) {
            sharePdfEmailLink.style.display = 'block';
            sharePdfInstructions.style.display = 'block';
        }
        } catch (err) {
            console.error('Failed to generate PDF', err);
            showNotificationModal('Error', 'Failed to generate PDF. Please try again.');
        }
    }

    function generatePdfPage(doc, data, calculations, isPreviewMode, stubNum, totalStubs) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        // Add company logo in the header if provided
        if (data.companyLogoDataUrl) {
            try {
                const imgProps = doc.getImageProperties(data.companyLogoDataUrl);
                const logoWidth = 35;
                const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
                doc.addImage(data.companyLogoDataUrl, 'PNG', pageWidth - logoWidth - 15, yPos - 5, logoWidth, logoHeight);
            } catch (e) {
                console.error('Error adding company logo to PDF:', e);
            }
        }

        yPos = drawHeader(doc, data, pageWidth, yPos);
        yPos = drawTitle(doc, pageWidth, stubNum, totalStubs, yPos);
        yPos = drawInfoTable(doc, data, yPos);
        yPos = drawEarningsTable(doc, data, calculations, yPos);
        yPos = drawDeductionsTable(doc, data, calculations, yPos);
        yPos = drawSummary(doc, calculations, pageWidth, yPos);
        drawFooter(doc, data, pageHeight, pageWidth, isPreviewMode);

        // Add payroll provider logo near the footer if provided
        if (data.payrollProviderLogoDataUrl) {
            try {
                const imgProps = doc.getImageProperties(data.payrollProviderLogoDataUrl);
                const logoWidth = 25;
                const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
                doc.addImage(data.payrollProviderLogoDataUrl, 'PNG', 15, pageHeight - logoHeight - 10, logoWidth, logoHeight);
            } catch (e) {
                console.error('Error adding payroll provider logo to PDF:', e);
            }
        }

        if (isPreviewMode) drawWatermarks(doc, pageWidth, pageHeight);
    }

    function drawHeader(doc, data, pageWidth, yPos) {
        doc.setFontSize(10);
        doc.setTextColor(174, 142, 93);
        doc.text('BUELLDOCS', 15, yPos);
        yPos += 2;
        return yPos + 10;
    }

    function drawTitle(doc, pageWidth, stubNum, totalStubs, yPos) {
        doc.setFontSize(16);
        doc.setTextColor(50, 50, 50);
        doc.setFont(undefined, 'bold');
        doc.text('EARNINGS STATEMENT', pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
        if (totalStubs > 1) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Stub ${stubNum} of ${totalStubs}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 8;
        } else {
            yPos += 4;
        }
        return yPos;
    }

    function drawInfoTable(doc, data, yPos) {
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const companyInfo = [
            [{ content: 'Company Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Name:', data.companyName || ''],
            ['Address:', `${data.companyStreetAddress || ''}`],
            ['', `${data.companyCity || ''}, ${data.companyState || ''} ${data.companyZip || ''}`],
            ['Phone:', data.companyPhone || ''],
            ['EIN:', data.companyEin || '']
        ];
        const employeeInfo = [
            [{ content: 'Employee Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Name:', data.employeeFullName || ''],
            ['Address:', `${data.employeeStreetAddress || ''}`],
            ['', `${data.employeeCity || ''}, ${data.employeeState || ''} ${data.employeeZip || ''}`],
            ['SSN:', data.employeeSsn ? maskSSN(data.employeeSsn) : '']
        ];
        const payPeriodInfo = [
            [{ content: 'Pay Period Information', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Period Start:', data.payPeriodStartDate || ''],
            ['Period End:', data.payPeriodEndDate || ''],
            ['Pay Date:', data.payDate || '']
        ];

        const infoTableBody = [];
        const maxLength = Math.max(companyInfo.length, employeeInfo.length, payPeriodInfo.length);
        for (let i = 0; i < maxLength; i++) {
            const row = [];
            row.push(companyInfo[i] ? companyInfo[i][0] : '');
            row.push(companyInfo[i] ? companyInfo[i][1] : '');
            row.push(employeeInfo[i] ? employeeInfo[i][0] : '');
            row.push(employeeInfo[i] ? employeeInfo[i][1] : '');
            row.push(payPeriodInfo[i] ? payPeriodInfo[i][0] : '');
            row.push(payPeriodInfo[i] ? payPeriodInfo[i][1] : '');
            infoTableBody.push(row);
        }

        doc.autoTable({
            body: infoTableBody,
            startY: yPos,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 1.5, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 25, fontStyle: 'bold' }, 1: { cellWidth: 'auto' },
                2: { cellWidth: 25, fontStyle: 'bold' }, 3: { cellWidth: 'auto' },
                4: { cellWidth: 25, fontStyle: 'bold' }, 5: { cellWidth: 'auto' }
            },
            didParseCell: function (data) {
                if (data.cell.raw && data.cell.raw.colSpan) {
                    data.cell.colSpan = data.cell.raw.colSpan;
                }
                if (data.cell.raw && data.cell.raw.styles) {
                    Object.assign(data.cell.styles, data.cell.raw.styles);
                }
            }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function drawEarningsTable(doc, data, calculations, yPos) {
        const earningsHeader = [['Description', 'Hours', 'Rate', 'Current Period', 'YTD']];
        const earningsBody = [];
        if (data.employmentType === 'Hourly') {
            earningsBody.push([
                'Regular Pay',
                (data.regularHours || 0).toFixed(2),
                formatCurrency(data.hourlyRate || 0, false),
                formatCurrency(calculations.currentPeriodAmounts.regularPay),
                formatCurrency(calculations.ytdAmounts.regularPay)
            ]);
            if (data.overtimeHours > 0 && calculations.currentPeriodAmounts.overtimePay) {
                earningsBody.push([
                    'Overtime Pay',
                    (data.overtimeHours || 0).toFixed(2),
                    formatCurrency((data.hourlyRate || 0) * 1.5, false),
                    formatCurrency(calculations.currentPeriodAmounts.overtimePay),
                    formatCurrency(calculations.ytdAmounts.overtimePay)
                ]);
            }
        } else {
            const payFrequency = data.salariedPayFrequency;
            const periodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
            const salaryPerPeriod = (data.annualSalary || 0) / periodsPerYear;
            earningsBody.push([
                'Salary',
                '1',
                formatCurrency(salaryPerPeriod, false),
                formatCurrency(calculations.currentPeriodAmounts.salary),
                formatCurrency(calculations.ytdAmounts.salary)
            ]);
        }
        if (data.bonus > 0) {
            earningsBody.push(['Bonus', '', '', formatCurrency(calculations.currentPeriodAmounts.bonus), formatCurrency(calculations.ytdAmounts.bonus)]);
        }
        if (data.miscEarningAmount > 0 && data.miscEarningName) {
            earningsBody.push([data.miscEarningName, '', '', formatCurrency(calculations.currentPeriodAmounts[data.miscEarningName]), formatCurrency(calculations.ytdAmounts[data.miscEarningName])]);
        }

        doc.autoTable({
            head: earningsHeader,
            body: earningsBody,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50], textColor: 255 },
            styles: { overflow: 'linebreak' },
            columnStyles: {
                1: { halign: 'right' }, 2: { halign: 'right' },
                3: { halign: 'right' }, 4: { halign: 'right' }
            },
            didDrawPage: function (data) { yPos = data.cursor.y; }
        });
        return doc.lastAutoTable.finalY + 8;
    }

    function drawDeductionsTable(doc, data, calculations, yPos) {
        const deductionsHeader = [['Description', 'Current Period', 'YTD']];
        const deductionsBody = [];
        deductionsBody.push(['Federal Income Tax', formatCurrency(calculations.currentPeriodAmounts.federalTax), formatCurrency(calculations.ytdAmounts.federalTax)]);
        const stateTaxLabelForPdf = data.stateTaxName || 'State Income Tax';
        deductionsBody.push([
            stateTaxLabelForPdf,
            formatCurrency(
                calculations.currentPeriodAmounts[stateTaxLabelForPdf] ||
                calculations.currentPeriodAmounts.stateTax
            ),
            formatCurrency(calculations.ytdAmounts.stateTax)
        ]);
        deductionsBody.push(['Social Security', formatCurrency(calculations.currentPeriodAmounts.socialSecurity), formatCurrency(calculations.ytdAmounts.socialSecurity)]);
        deductionsBody.push(['Medicare', formatCurrency(calculations.currentPeriodAmounts.medicare), formatCurrency(calculations.ytdAmounts.medicare)]);

        if (data.njSdiAmount > 0) deductionsBody.push(['NJ SDI', formatCurrency(calculations.currentPeriodAmounts.njSdi), formatCurrency(calculations.ytdAmounts.njSdi)]);
        if (data.njFliAmount > 0) deductionsBody.push(['NJ FLI', formatCurrency(calculations.currentPeriodAmounts.njFli), formatCurrency(calculations.ytdAmounts.njFli)]);
        if (data.njUiHcWfAmount > 0) deductionsBody.push(['NJ UI/HC/WF', formatCurrency(calculations.currentPeriodAmounts.njUiHcWf), formatCurrency(calculations.ytdAmounts.njUiHcWf)]);
        if (data.healthInsurance > 0) deductionsBody.push(['Health Insurance', formatCurrency(calculations.currentPeriodAmounts.healthInsurance), formatCurrency(calculations.ytdAmounts.healthInsurance)]);
        if (data.retirement401k > 0) deductionsBody.push(['Retirement (401k)', formatCurrency(calculations.currentPeriodAmounts.retirement401k), formatCurrency(calculations.ytdAmounts.retirement401k)]);
        if (Array.isArray(data.otherDeductions)) {
            data.otherDeductions.forEach(d => {
                if (d.amount > 0 && d.description) {
                    deductionsBody.push([d.description, formatCurrency(calculations.currentPeriodAmounts[d.description]), formatCurrency(calculations.ytdAmounts[d.description])]);
                }
            });
        }

        doc.autoTable({
            head: deductionsHeader,
            body: deductionsBody,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50], textColor: 255 },
            styles: { overflow: 'linebreak' },
            columnStyles: {
                1: { halign: 'right' }, 2: { halign: 'right' }
            },
            didDrawPage: function (data) { yPos = data.cursor.y; }
        });
        return doc.lastAutoTable.finalY + 10;
    }

    function drawSummary(doc, calculations, pageWidth, yPos) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        const summaryX = pageWidth - 60;
        doc.text('Gross Pay:', summaryX, yPos, { align: 'left' });
        doc.text(formatCurrency(calculations.grossPay), pageWidth - 15, yPos, { align: 'right' });
        yPos += 7;
        doc.text('Total Deductions:', summaryX, yPos, { align: 'left' });
        doc.text(formatCurrency(calculations.totalDeductions), pageWidth - 15, yPos, { align: 'right' });
        yPos += 7;
        doc.text('Net Pay:', summaryX, yPos, { align: 'left' });
        doc.text(formatCurrency(calculations.netPay), pageWidth - 15, yPos, { align: 'right' });
        return yPos + 15;
    }

    function drawFooter(doc, data, pageHeight, pageWidth, isPreviewMode) {
        const bottomContentY = pageHeight - 15;
        if (data.includeVoidedCheck && isPreviewMode) {
            drawVoidedCheck(doc, pageWidth - 95, bottomContentY - 45);
        }
        // Logo is added in generatePdfPage if provided
    }

    function drawVoidedCheck(doc, x, y) {
        const width = 80;
        const height = 40;
        doc.setDrawColor(0);
        doc.rect(x, y, width, height);

        doc.setFontSize(7);
        doc.setTextColor(50, 50, 50);
        doc.text('Pay to the Order of:', x + 2, y + 7);
        doc.line(x + 38, y + 6, x + width - 2, y + 6);
        doc.rect(x + width - 28, y + 2, 26, 8);
        doc.text('Date:', x + 2, y + 15);
        doc.line(x + 15, y + 14, x + 40, y + 14);
        doc.text('Memo:', x + 2, y + height - 8);
        doc.line(x + 15, y + height - 9, x + width - 40, y + height - 9);
        doc.line(x + width - 38, y + height - 9, x + width - 2, y + height - 9);
        doc.setFontSize(6);
        doc.text('Signature', x + width - 36, y + height - 11);

        doc.setTextColor(255, 0, 0);
        doc.setFontSize(18);
        doc.text('VOID', x + width / 2, y + height / 2 + 3, null, -30, 'center');
        doc.setTextColor(0, 0, 0);
    }

    function drawWatermarks(doc, pageWidth, pageHeight) {
        doc.setFontSize(50);
        doc.setTextColor(200, 0, 0, 0.2);
        doc.setFont(undefined, 'bold');
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;
        doc.text('PREVIEW', centerX, centerY, null, 45, 'center');
        doc.text('SIMULATION ONLY', centerX, centerY + 20, null, 45, 'center');

        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.setFont(undefined, 'normal');
        const disclaimer = 'For educational or entertainment purposes only. This is a simulated document.';
        doc.text(disclaimer, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }


   function handleMainFormSubmit() {
    async function handleMainFormSubmit() {
        if (generateAndPayBtn) generateAndPayBtn.disabled = true;
        clearSummaryError();
        if (!validateAllFormFields()) {
            showSummaryError('Please review the highlighted fields below.');
            const firstError = paystubForm.querySelector('.invalid');
            if (firstError) firstError.focus();
            showNotificationModal('Validation Error', 'Please correct the errors in the form.');
            if (generateAndPayBtn) generateAndPayBtn.disabled = false;
            return;
        }

        const formData = gatherFormData();
        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.userEmail, formData })
            });
            const data = await response.json();
            if (data.url) {
                window.location = data.url;
            } else {
                showNotificationModal('Payment Error', 'Unable to initiate payment.');
                if (generateAndPayBtn) generateAndPayBtn.disabled = false;
            }
        } catch (err) {
            showNotificationModal('Payment Error', 'Unable to initiate payment.');
            if (generateAndPayBtn) generateAndPayBtn.disabled = false;
        }

        const numStubs = parseInt(numPaystubsSelect.value);
        const pricingInfo = PRICING[numStubs] || PRICING[1];
        const formData = gatherFormData();

        fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData, amount: pricingInfo.price })
        })
            .then(res => res.json())
            .then(data => {
                const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
                return stripe.redirectToCheckout({ sessionId: data.sessionId });
            })
            .catch(err => {
                console.error('Checkout error', err);
                showNotificationModal('Error', 'Unable to initiate payment.');
                if (generateAndPayBtn) generateAndPayBtn.disabled = false;
            });
   }

    // TODO (Future Backend): When a real backend is implemented, ensure all data submitted from the client (especially if it includes any sensitive form details beyond just TXID and email for manual processing) is transmitted over HTTPS and handled securely on the server according to best practices for data protection and encryption at rest.
    function handlePaymentConfirmationSubmit() {
        const txId = cashAppTxIdInput.value.trim();
        if (!txId) {
            showError(cashAppTxIdInput, 'Transaction ID is required.');
            return;
        }
        clearError(cashAppTxIdInput);

        const formData = gatherFormData();
        successUserEmailSpan.textContent = formData.userEmail;
        successUserEmailInlineSpan.textContent = formData.userEmail;
        successTxIdSpan.textContent = txId;
        successNumStubsSpan.textContent = numPaystubsSelect.value;
        successUserNotesSpan.textContent = formData.userNotes || 'None provided';


        paymentInstructionsDiv.style.display = 'none';
        modalOrderSuccessMessageDiv.style.display = 'block';
    }

    function handleWatermarkedPreview() {
        const originalText = previewPdfWatermarkedBtn.textContent;
        previewPdfWatermarkedBtn.textContent = 'Generating Preview...';
        generateAndDownloadPdf(true);
        setTimeout(() => {
            previewPdfWatermarkedBtn.textContent = originalText;
        }, 1500);
    }

    function resetAllFormFields() {
        paystubForm.reset();
        if (sharePdfEmailLink) sharePdfEmailLink.style.display = 'none';
        if (sharePdfInstructions) sharePdfInstructions.style.display = 'none';
        if (netIncomeAdjustmentNote) {
            netIncomeAdjustmentNote.textContent = '';
            netIncomeAdjustmentNote.style.display = 'none';
        }
        const grossRadio = document.getElementById('desiredIncomeTypeGross');
        if (grossRadio) grossRadio.checked = true;
        // Reset logo previews
        [companyLogoPreviewImg, payrollProviderLogoPreviewImg].forEach(img => {
            img.src = '#';
            img.style.display = 'none';
        });
        [companyLogoPlaceholder, payrollProviderLogoPlaceholder].forEach(p => p.style.display = 'block');

        // Clear all error messages
        document.querySelectorAll('.error-message').forEach(span => span.textContent = '');
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        clearSummaryError();

        if (customDeductionsContainer) {
            customDeductionsContainer.innerHTML = '';
            addCustomDeductionRow();
        }

        toggleEmploymentFields(); // Ensure correct fields are shown based on default radio
        updateHourlyPayFrequencyVisibility(); // And update conditional dropdown
        showFormStep(1);
        updateLivePreview(); // Refresh live preview
        if (resetAllFieldsBtn) {
            const originalText = resetAllFieldsBtn.textContent;
            resetAllFieldsBtn.textContent = 'Form Cleared';
            setTimeout(() => { resetAllFieldsBtn.textContent = originalText; }, 1500);
        }
    }

    // New draft save logic for v2
    function saveDraftToLocalStorage() {
        const data = gatherFormData();
        // Ensure logo Data URLs are stored
        data.companyLogoDataUrl = companyLogoPreviewImg.style.display !== 'none' ? companyLogoPreviewImg.src : null;
        data.payrollProviderLogoDataUrl = payrollProviderLogoPreviewImg.style.display !== 'none' ? payrollProviderLogoPreviewImg.src : null;
        try {
            const json = JSON.stringify(data);
            if (json.length > 4000000) { // ~4MB safety check
                alert('Draft is too large to save. Please use smaller logo images.');
                return;
            }
            localStorage.setItem('buellDocsPaystubDraft_v2', json);
            const originalText = saveDraftBtn.textContent;
            saveDraftBtn.textContent = 'Draft Saved!';
            setTimeout(() => { saveDraftBtn.textContent = originalText; }, 1500);
            showNotificationModal('Draft Saved', 'Your current form progress has been saved to this browser.');
        } catch (e) {
            console.error('Failed to save draft', e);
        }
    }

    function loadDraftFromLocalStorage() {
        const draftStr = localStorage.getItem('buellDocsPaystubDraft_v2');
        if (!draftStr) {
            if (loadDraftBtn) {
                const originalText = loadDraftBtn.textContent;
                loadDraftBtn.textContent = 'No Draft Found';
                setTimeout(() => {
                    loadDraftBtn.textContent = originalText;
                }, 1500);
            }
            showNotificationModal('No Draft Found', 'No saved draft was found in this browser.');
            return;
        }

        let data;
        try {
            data = JSON.parse(draftStr);
        } catch (e) {
            console.error('Failed to parse draft', e);
            showNotificationModal('Error', 'Failed to load saved draft.');
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            const el = paystubForm.elements[key];
            if (!el) continue;
            if (el.type === 'radio') {
                const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else if (el.type === 'checkbox') {
                el.checked = !!value;
            } else if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
                el.value = value;
            } else if (el.type !== 'file') {
                el.value = value;
            }
        }
        if (customDeductionsContainer) {
            customDeductionsContainer.innerHTML = '';
            const dedArr = Array.isArray(data.otherDeductions) ? data.otherDeductions : [];
            if (dedArr.length === 0) addCustomDeductionRow();
            else dedArr.forEach(d => addCustomDeductionRow(d.description, d.amount));
        }

        if (data.companyLogoDataUrl) {
            companyLogoPreviewImg.src = data.companyLogoDataUrl;
            companyLogoPreviewImg.style.display = 'block';
            if (companyLogoPlaceholder) companyLogoPlaceholder.style.display = 'none';
        } else {
            companyLogoPreviewImg.src = '#';
            companyLogoPreviewImg.style.display = 'none';
            if (companyLogoPlaceholder) companyLogoPlaceholder.style.display = 'block';
        }

        if (data.payrollProviderLogoDataUrl) {
            payrollProviderLogoPreviewImg.src = data.payrollProviderLogoDataUrl;
            payrollProviderLogoPreviewImg.style.display = 'block';
            if (payrollProviderLogoPlaceholder) payrollProviderLogoPlaceholder.style.display = 'none';
        } else {
            payrollProviderLogoPreviewImg.src = '#';
            payrollProviderLogoPreviewImg.style.display = 'none';
            if (payrollProviderLogoPlaceholder) payrollProviderLogoPlaceholder.style.display = 'block';
        }

        toggleEmploymentFields();
        updateHourlyPayFrequencyVisibility();
        updateLivePreview();
        showNotificationModal('Draft Loaded', 'Your previously saved draft has been loaded into the form.');
    }

    function autoPopulateFromDesiredIncome() {
        const amount = parseCurrencyValue(desiredIncomeAmountInput.value);
        const period = desiredIncomePeriodSelect.value;
        const repType = document.querySelector('input[name="incomeRepresentationType"]:checked').value;
        const desiredIncomeType = document.querySelector('input[name="desiredIncomeType"]:checked').value;
        const assumedHours = parseFloat(assumedHourlyRegularHoursInput.value) || 40;
        const forNJ = isForNjEmploymentCheckbox.checked;

        if (netIncomeAdjustmentNote) {
            netIncomeAdjustmentNote.textContent = '';
            netIncomeAdjustmentNote.style.display = 'none';
        }

        if (isNaN(amount) || amount <= 0) {
            showNotificationModal('Invalid Input', 'Desired income amount must be greater than 0.');
            return;
        }

        const periodsMap = { ...PAY_PERIODS_PER_YEAR, 'Annual': 1 };
        let grossIncomeForCalculations = amount;

        if (desiredIncomeType === 'Net') {
            const targetNetIncome = amount;
            let estimatedGross = targetNetIncome / 0.7;
            const payFreq = period;
            const filingStatusEl = document.querySelector('input[name="federalFilingStatus"]:checked') || document.getElementById('federalFilingStatus');
            const filingStatus = filingStatusEl ? filingStatusEl.value : 'Single';
            const ytdGross = parseFloat(document.getElementById('initialYtdGrossPay').value) || 0;
            const tolerance = Math.max(1, targetNetIncome * 0.005);
            for (let i = 0; i < 15; i++) {
                const gp = estimatedGross;
                let totalD = estimateFederalTax(gp, payFreq, filingStatus) + estimateSocialSecurity(gp, ytdGross) + estimateMedicare(gp);
                if (forNJ) {
                    totalD += estimateNJStateTax(gp, payFreq, filingStatus) + estimateNJ_SDI(gp, payFreq) + estimateNJ_FLI(gp, payFreq) + estimateNJ_UIHCWF(gp, payFreq);
                }
                const net = gp - totalD;
                const diff = net - targetNetIncome;
                if (Math.abs(diff) <= tolerance) break;
                estimatedGross -= diff * 0.5;
                if (estimatedGross <= 0) { estimatedGross = gp; break; }
            }
            grossIncomeForCalculations = estimatedGross;
            if (netIncomeAdjustmentNote) {
                netIncomeAdjustmentNote.textContent = `To achieve your target net income of approximately ${formatCurrency(targetNetIncome)}, we've estimated a required gross income of ${formatCurrency(estimatedGross)} per ${period.toLowerCase()}. Paystub details below are based on this gross amount.`;
                netIncomeAdjustmentNote.style.display = 'block';
            }
        }

        const periods = periodsMap[period] || 1;
        const effectiveAnnualSalary = grossIncomeForCalculations * periods;

        let payFrequency = 'Bi-Weekly';
        let grossPayPerPeriod = 0;

        if (repType === 'Salaried') {
            document.querySelector('input[name="employmentType"][value="Salaried"]').checked = true;
            const annualSalaryInput = document.getElementById('annualSalary');
            annualSalaryInput.value = formatCurrencyInput(effectiveAnnualSalary);
            const payFreqSelect = document.getElementById('salariedPayFrequency');
            if (payFreqSelect.value) payFrequency = payFreqSelect.value; else payFreqSelect.value = payFrequency;
            grossPayPerPeriod = effectiveAnnualSalary / PAY_PERIODS_PER_YEAR[payFrequency];
        } else {
            document.querySelector('input[name="employmentType"][value="Hourly"]').checked = true;
            const payFreqSelect = document.getElementById('hourlyPayFrequency');
            payFrequency = payFreqSelect.value || 'Weekly';
            payFreqSelect.value = payFrequency;
            grossPayPerPeriod = effectiveAnnualSalary / PAY_PERIODS_PER_YEAR[payFrequency];
            const hourlyRate = grossPayPerPeriod / assumedHours;
            document.getElementById('hourlyRate').value = hourlyRate.toFixed(2);
            document.getElementById('regularHours').value = assumedHours;
        }

        const filingStatus = federalFilingStatusSelect ? federalFilingStatusSelect.value : 'Single';
        const stateTaxInput = document.getElementById('stateTaxAmount');
        if (stateTaxInput) {
            const estState = estimateNJStateTax(grossPayPerPeriod, payFrequency, filingStatus);
            stateTaxInput.value = estState.toFixed(2);
        }

        if (forNJ) {
            const stateTaxNameInput = document.getElementById('stateTaxName');
            if (stateTaxNameInput && !stateTaxNameInput.value) stateTaxNameInput.value = 'NJ State Tax';
        }

        if (autoCalculateFederalTaxCheckbox) autoCalculateFederalTaxCheckbox.checked = true;
        if (autoCalculateSocialSecurityCheckbox) autoCalculateSocialSecurityCheckbox.checked = true;
        if (autoCalculateMedicareCheckbox) autoCalculateMedicareCheckbox.checked = true;
        if (forNJ) {
            if (autoCalculateNjSdiCheckbox) autoCalculateNjSdiCheckbox.checked = true;
            if (autoCalculateNjFliCheckbox) autoCalculateNjFliCheckbox.checked = true;
            if (autoCalculateNjUiCheckbox) autoCalculateNjUiCheckbox.checked = true;
        }

        updateAutoCalculatedFields();

        toggleEmploymentFields();
        updateHourlyPayFrequencyVisibility();
        const currentStep = getCurrentStep();
        if (currentStep < totalSteps) {
            showFormStep(currentStep + 1);
        }
        updateLivePreview();

        if (populateDetailsBtn) {
            populateDetailsBtn.textContent = 'Recalculate from Desired Income';
            populateDetailsBtn.disabled = true;
        }
    }

    function estimateFederalTax(grossPayPerPeriod, payFrequency, status) {
        return grossPayPerPeriod * FEDERAL_TAX_RATE;
    }

    function estimateNJStateTax(grossPayPerPeriod, payFrequency, status) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const annualizedGrossNJ = grossPayPerPeriod * periods;
        const brackets = NJ_TAX_BRACKETS_2024[status] || NJ_TAX_BRACKETS_2024['Single'];
        let tax = 0;
        let prev = 0;
        for (const { limit, rate } of brackets) {
            const taxable = Math.min(annualizedGrossNJ, limit) - prev;
            if (taxable > 0) {
                tax += taxable * rate;
                prev = limit;
            }
        }
        return tax / periods;
    }

    function estimateSocialSecurity(grossPayPerPeriod, annualizedGrossPayToDateExcludingCurrentPeriod) {
        const remainingSSLIMIT = SOCIAL_SECURITY_WAGE_LIMIT_2024 - annualizedGrossPayToDateExcludingCurrentPeriod;
        const taxableForSS = Math.min(grossPayPerPeriod, Math.max(0, remainingSSLIMIT));
        return taxableForSS * SOCIAL_SECURITY_RATE;
    }

    function estimateMedicare(grossPayPerPeriod) {
        return grossPayPerPeriod * MEDICARE_RATE;
    }

    function estimateNJ_SDI(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_SDI_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_SDI_RATE;
    }

    function estimateNJ_FLI(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_FLI_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_FLI_RATE;
    }

    function estimateNJ_UIHCWF(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_UIHCWF_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_UIHCWF_RATE;
    }

    function estimateAllDeductions() {
        const data = gatherFormData();
        const calculations = calculateCurrentPeriodPay(data);

        const payFrequency = data.employmentType === 'Hourly' ? (hourlyPayFrequencySelect.value || 'Weekly') : (data.salariedPayFrequency || 'Bi-Weekly');
        const filingStatus = data.filingStatus || 'Single'; // placeholder until a field is added

        document.getElementById('federalTaxAmount').value = estimateFederalTax(calculations.grossPay, payFrequency, filingStatus).toFixed(2);
        document.getElementById('stateTaxAmount').value = estimateNJStateTax(calculations.grossPay, payFrequency, filingStatus).toFixed(2);
        document.getElementById('njSdiAmount').value = estimateNJ_SDI(calculations.grossPay, payFrequency).toFixed(2);
        document.getElementById('njFliAmount').value = estimateNJ_FLI(calculations.grossPay, payFrequency).toFixed(2);
        document.getElementById('njUiHcWfAmount').value = estimateNJ_UIHCWF(calculations.grossPay, payFrequency).toFixed(2);

        autoCalculateSocialSecurityCheckbox.checked = true;
        autoCalculateMedicareCheckbox.checked = true;

        updateLivePreview();
    }

    function updateAutoCalculatedFields() {
        const data = gatherFormData();
        const calculations = calculateCurrentPeriodPay(data);
        const gross = calculations.grossPay;

        const payFrequency = data.employmentType === 'Hourly'
            ? (hourlyPayFrequencySelect.value || 'Weekly')
            : (data.salariedPayFrequency || 'Bi-Weekly');

        const filingStatus = data.federalFilingStatus || data.filingStatus || 'Single';
        const isForNJ = data.isForNJEmployment || false;

        if (typeof estimateFederalTax === 'function') {
            const fedTax = estimateFederalTax(gross, payFrequency, filingStatus);
            const fedInput = document.getElementById('federalTaxAmount');
            if (fedInput) {
                fedInput.value = fedTax.toFixed(2);
                fedInput.classList.add('auto-calculated-field');
                fedInput.readOnly = true;
            }
        }

        const ytdGross = data.initialYtdGrossPay || 0;

        if (autoCalculateFederalTaxCheckbox && autoCalculateFederalTaxCheckbox.checked) {
            const val = estimateFederalTax(gross, payFrequency, filingStatus);
            federalTaxAmountInput.value = val.toFixed(2);
            federalTaxAmountInput.readOnly = true;
            federalTaxAmountInput.classList.add('auto-calculated-field');
        } else if (autoCalculateFederalTaxCheckbox) {
            federalTaxAmountInput.readOnly = false;
            federalTaxAmountInput.classList.remove('auto-calculated-field');
        }

        if (autoCalculateSocialSecurityCheckbox && autoCalculateSocialSecurityCheckbox.checked) {
            const val = calculateSocialSecurityDeduction(gross, ytdGross);
            socialSecurityAmountInput.value = val.toFixed(2);
            socialSecurityAmountInput.readOnly = true;
            socialSecurityAmountInput.classList.add('auto-calculated-field');
        } else if (autoCalculateSocialSecurityCheckbox) {
            socialSecurityAmountInput.readOnly = false;
            socialSecurityAmountInput.classList.remove('auto-calculated-field');
        }

        if (autoCalculateMedicareCheckbox && autoCalculateMedicareCheckbox.checked) {
            const val = calculateMedicareDeduction(gross);
            medicareAmountInput.value = val.toFixed(2);
            medicareAmountInput.readOnly = true;
            medicareAmountInput.classList.add('auto-calculated-field');
        } else if (autoCalculateMedicareCheckbox) {
            medicareAmountInput.readOnly = false;
            medicareAmountInput.classList.remove('auto-calculated-field');
        }

        if (isForNjEmploymentCheckbox.checked) {
            if (autoCalculateNjSdiCheckbox && autoCalculateNjSdiCheckbox.checked) {
                const val = estimateNJ_SDI(gross, payFrequency);
                njSdiAmountInput.value = formatCurrencyInput(val.toFixed(2));
                njSdiAmountInput.readOnly = true;
                njSdiAmountInput.classList.add('auto-calculated-field');
            } else if (autoCalculateNjSdiCheckbox) {
                njSdiAmountInput.readOnly = false;
                njSdiAmountInput.classList.remove('auto-calculated-field');
            }

            if (autoCalculateNjFliCheckbox && autoCalculateNjFliCheckbox.checked) {
                const val = estimateNJ_FLI(gross, payFrequency);
                njFliAmountInput.value = formatCurrencyInput(val.toFixed(2));
                njFliAmountInput.readOnly = true;
                njFliAmountInput.classList.add('auto-calculated-field');
            } else if (autoCalculateNjFliCheckbox) {
                njFliAmountInput.readOnly = false;
                njFliAmountInput.classList.remove('auto-calculated-field');
            }

            if (autoCalculateNjUiCheckbox && autoCalculateNjUiCheckbox.checked) {
                const val = estimateNJ_UIHCWF(gross, payFrequency);
                njUiAmountInput.value = formatCurrencyInput(val.toFixed(2));
                njUiAmountInput.readOnly = true;
                njUiAmountInput.classList.add('auto-calculated-field');
            } else if (autoCalculateNjUiCheckbox) {
                njUiAmountInput.readOnly = false;
                njUiAmountInput.classList.remove('auto-calculated-field');
            }
        }

        updateLivePreview();
    }

    function estimateAllStandardDeductions() {
        if (autoCalculateFederalTaxCheckbox) autoCalculateFederalTaxCheckbox.checked = true;
        if (autoCalculateSocialSecurityCheckbox) autoCalculateSocialSecurityCheckbox.checked = true;
        if (autoCalculateMedicareCheckbox) autoCalculateMedicareCheckbox.checked = true;
        if (isForNjEmploymentCheckbox.checked) {
            if (autoCalculateNjSdiCheckbox) autoCalculateNjSdiCheckbox.checked = true;
            if (autoCalculateNjFliCheckbox) autoCalculateNjFliCheckbox.checked = true;
            if (autoCalculateNjUiCheckbox) autoCalculateNjUiCheckbox.checked = true;
        }
        updateAutoCalculatedFields();
        if (estimateAllDeductionsBtn) {
            const original = estimateAllDeductionsBtn.textContent;
            estimateAllDeductionsBtn.textContent = 'Estimates Applied!';
            setTimeout(() => { estimateAllDeductionsBtn.textContent = original; }, 2000);
        }
    }

    function handleNjEmploymentChange() {
        const forNJ = isForNjEmploymentCheckbox.checked;
        const stateTaxNameInput = document.getElementById('stateTaxName');

        if (forNJ) {
            if (stateTaxNameInput && !stateTaxNameInput.value) {
                stateTaxNameInput.value = 'NJ State Tax';
            }
            if (autoCalculateNjSdiCheckbox) autoCalculateNjSdiCheckbox.checked = true;
            if (autoCalculateNjFliCheckbox) autoCalculateNjFliCheckbox.checked = true;
            if (autoCalculateNjUiCheckbox) autoCalculateNjUiCheckbox.checked = true;
        } else {
            if (stateTaxNameInput) stateTaxNameInput.value = '';
        }
        updateAutoCalculatedFields();
    }

    function handleSocialSecurityAutoCalcChange() {
        if (autoCalculateSocialSecurityCheckbox.checked) {
            const data = gatherFormData();
            const gross = calculateCurrentPeriodPay(data).grossPay;
            const ytd = parseFloat(document.getElementById('initialYtdSocialSecurity')?.value) || 0;
            const val = calculateSocialSecurityDeduction(gross, ytd);
            socialSecurityAmountInput.value = val.toFixed(2);
            socialSecurityAmountInput.readOnly = true;
            socialSecurityAmountInput.classList.add('auto-calculated-field');
        } else {
            socialSecurityAmountInput.readOnly = false;
            socialSecurityAmountInput.classList.remove('auto-calculated-field');
        }
        updateLivePreview();
    }

    function handleMedicareAutoCalcChange() {
        if (autoCalculateMedicareCheckbox.checked) {
            const data = gatherFormData();
            const gross = calculateCurrentPeriodPay(data).grossPay;
            const val = calculateMedicareDeduction(gross);
            medicareAmountInput.value = val.toFixed(2);
            medicareAmountInput.readOnly = true;
            medicareAmountInput.classList.add('auto-calculated-field');
        } else {
            medicareAmountInput.readOnly = false;
            medicareAmountInput.classList.remove('auto-calculated-field');
        }
        updateLivePreview();
    }


    // --- Validation Functions --- //
    function validateAllFormFields() {
        let isValid = true;
        const inputsToValidate = paystubForm.querySelectorAll('[required], input[name="employeeSsn"], input[name="userEmail"], input[type="date"]');

        inputsToValidate.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        const deductionRows = customDeductionsContainer ? customDeductionsContainer.querySelectorAll('.deduction-row') : [];
        deductionRows.forEach(row => {
            const amountInput = row.querySelector('input[name="otherDeductionAmount[]"]');
            const nameInput = row.querySelector('input[name="otherDeductionName[]"]');
            const amount = parseFloat(amountInput.value);
            if (!isNaN(amount) && amount > 0) {
                if (!nameInput.value.trim()) {
                    showError(nameInput, 'Name required if amount is entered.');
                    isValid = false;
                } else {
                    clearError(nameInput);
                }
            } else {
                clearError(nameInput);
            }
        });

        const miscEarningAmount = parseFloat(document.getElementById('miscEarningAmount').value);
        const miscEarningNameInput = document.getElementById('miscEarningName');
        if (miscEarningNameInput) {
            if (!isNaN(miscEarningAmount) && miscEarningAmount > 0) {
                if (!miscEarningNameInput.value.trim()) {
                    showError(miscEarningNameInput, 'Name required if amount is entered.');
                    isValid = false;
                } else {
                    clearError(miscEarningNameInput);
                }
            } else {
                clearError(miscEarningNameInput);
            }
        }

        return isValid;
    }

    function getLabelText(field) {
        if (field.labels && field.labels.length > 0) {
            return field.labels[0].textContent
                .replace(' *', '')
                .replace('ℹ️', '')
                .replace('(XXX-XX-NNNN)', '')
                .replace('(Last 4 Digits Only)', '')
                .trim();
        }
        return 'This field';
    }

    function validateField(field) {
        let isValid = true;
        let errorMessage = '';
        const value = field.value.trim();

        // Required validation
        if (field.hasAttribute('required') && !value && field.offsetParent !== null) { // Check offsetParent to only validate visible required fields
            isValid = false;
            errorMessage = `${getLabelText(field)} is required.`;
        }

        // Specific validations
        if (isValid && field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }

        if (isValid && field.name === "employeeSsn" && value) {
            const digits = value.replace(/\D/g, '');
            if (digits.length !== 9) {
                isValid = false;
                errorMessage = 'SSN must be 9 digits.';
            }
        }

        if (isValid && field.type === 'number') {
            const numericVal = parseFloat(value);
            if (!isNaN(numericVal)) {
                if (numericVal < 0) {
                    isValid = false;
                    errorMessage = 'Value cannot be negative.';
                }
                const max = parseFloat(field.getAttribute('max'));
                if (isValid && !isNaN(max) && numericVal > max) {
                    isValid = false;
                    errorMessage = `Value cannot exceed ${max}.`;
                }
            }
        if (isValid && field.id === 'annualSalary') {
            if (!isValidSalary(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid salary amount.';
            }
        }

        if (isValid && field.type === 'number' && parseFloat(value) < 0) {
            isValid = false;
            errorMessage = 'Value cannot be negative.';
        }

        if (isValid && field.type === 'date' && value) {
            const payPeriodStartDate = document.getElementById('payPeriodStartDate').value;
            const payPeriodEndDate = document.getElementById('payPeriodEndDate').value;
            const payDate = document.getElementById('payDate').value;

            if (field.id === 'payPeriodEndDate' && payPeriodStartDate && payPeriodEndDate < payPeriodStartDate) {
                isValid = false;
                errorMessage = 'End Date cannot be before Start Date.';
            }
            if (field.id === 'payDate' && payPeriodEndDate && payDate < payPeriodEndDate) {
                isValid = false;
                errorMessage = 'Pay Date cannot be before Pay Period End Date.';
            }
        }

        // Optional pattern hints
        if (field.id === 'companyPhone') {
            const digits = value.replace(/\D/g, '');
            if (digits && digits.length !== 10) {
                showError(field, 'Phone number must be 10 digits');
            } else {
                clearError(field);
            }
            return true;
        }

        if (field.id === 'companyEin') {
            if (value && !/^\d{2}-?\d{7}$/.test(value)) {
                showError(field, 'Format e.g. 12-3456789');
            } else {
                clearError(field);
            }
            return true;
        }


        if (!isValid) {
            showError(field, errorMessage);
        } else {
            clearError(field);
        }
        return isValid;
    }

    function showError(inputElement, message) {
        const errorId = inputElement.getAttribute('aria-describedby');
        let errorSpan = null;
        if (errorId) {
            errorSpan = document.getElementById(errorId);
        }
        if (!errorSpan) {
            const formGroup = inputElement.closest('.form-group');
            if (formGroup) errorSpan = formGroup.querySelector('.error-message');
        }
        if (errorSpan) {
            errorSpan.textContent = message;
        }
        inputElement.classList.add('invalid');
    }

    function clearError(inputElement) {
        const errorId = inputElement.getAttribute('aria-describedby');
        let errorSpan = null;
        if (errorId) {
            errorSpan = document.getElementById(errorId);
        }
        if (!errorSpan) {
            const formGroup = inputElement.closest('.form-group');
            if (formGroup) errorSpan = formGroup.querySelector('.error-message');
        }
        if (errorSpan) {
            errorSpan.textContent = '';
        }
        inputElement.classList.remove('invalid');
    }

    function showSummaryError(message) {
        if (formSummaryError) {
            formSummaryError.textContent = message;
            formSummaryError.classList.add('active');
        }
    }

    function clearSummaryError() {
        if (formSummaryError) {
            formSummaryError.textContent = '';
            formSummaryError.classList.remove('active');
        }
    }
    function setRequired(element, isRequired) {
        if (isRequired) {
            element.setAttribute('required', 'required');
        } else {
            element.removeAttribute('required');
            clearError(element); // Clear any errors if it's no longer required
        }
    }

    // Estimate federal tax using a simplified bracket model
    function estimateFederalTax(grossPayPerPeriod, payFrequency, filingStatus) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const annualIncome = grossPayPerPeriod * periods;
        const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS['Single'];
        let tax = 0;
        let prev = 0;
        for (const { upto, rate } of brackets) {
            const limit = Math.min(annualIncome, upto);
            if (limit > prev) tax += (limit - prev) * rate;
            if (annualIncome <= upto) break;
            prev = upto;
        }
        return parseFloat((tax / periods).toFixed(2));
    }


    // --- Helper Functions --- //

    // Placeholder federal tax estimate using a very simplified progressive structure
    function estimateFederalTax(grossPayPerPeriod, payFrequency, filingStatus) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const annualIncome = grossPayPerPeriod * periods;
        let annualTax = 0;
        // Basic example brackets (placeholder logic)
        if (annualIncome <= 11000) {
            annualTax = annualIncome * 0.10;
        } else if (annualIncome <= 44725) {
            annualTax = 11000 * 0.10 + (annualIncome - 11000) * 0.12;
        } else {
            annualTax = 11000 * 0.10 + (44725 - 11000) * 0.12 + (annualIncome - 44725) * 0.22;
        }
        return annualTax / periods;
    }

    // Social Security at flat 6.2% with simplistic wage limit handling
    function estimateSocialSecurity(grossPayPerPeriod, annualizedGrossPayToDateExcludingCurrentPeriod) {
        const remainingSSLIMIT = SOCIAL_SECURITY_WAGE_LIMIT_2024 - annualizedGrossPayToDateExcludingCurrentPeriod;
        const taxableForSS = Math.min(grossPayPerPeriod, Math.max(0, remainingSSLIMIT));
        return taxableForSS * SOCIAL_SECURITY_RATE;
    }

    // Medicare at flat 1.45%
    function estimateMedicare(grossPayPerPeriod) {
        return grossPayPerPeriod * MEDICARE_RATE;
    }

    // New Jersey state income tax estimation using 2024 brackets
    function estimateNJStateTax(grossPayPerPeriod, payFrequency, filingStatus) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const annualizedGrossNJ = grossPayPerPeriod * periods;
        const brackets = NJ_TAX_BRACKETS_2024[filingStatus] || NJ_TAX_BRACKETS_2024['Single'];
        let tax = 0;
        let prev = 0;
        for (const { limit, rate } of brackets) {
            const taxable = Math.min(annualizedGrossNJ, limit) - prev;
            if (taxable > 0) {
                tax += taxable * rate;
                prev = limit;
            }
        }
        return tax / periods;
    }

    // New Jersey State Disability Insurance (2024)
    function estimateNJ_SDI(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_SDI_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_SDI_RATE;
    }

    // New Jersey Family Leave Insurance (2024)
    function estimateNJ_FLI(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_FLI_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_FLI_RATE;
    }

    // New Jersey Unemployment/Health/Workforce (2024)
    function estimateNJ_UIHCWF(grossPayPerPeriod, payFrequency) {
        const periods = PAY_PERIODS_PER_YEAR[payFrequency] || 1;
        const perPeriodLimit = NJ_UIHCWF_WAGE_LIMIT / periods;
        const taxable = Math.min(grossPayPerPeriod, perPeriodLimit);
        return taxable * NJ_UIHCWF_RATE;
    }

    function formatCurrency(amount, includeSymbol = true) {
        const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        if (includeSymbol) {
            // For PDF generation, the currency symbol may be omitted when handled
            // via autotable. For other scenarios we default to displaying it.
            return new Intl.NumberFormat('en-US', {
                ...options,
                style: 'currency',
                currency: 'USD'
            }).format(amount || 0);
        }
        return new Intl.NumberFormat('en-US', options).format(amount || 0);
    }

    function compileCurrentPreviewText() {
        const lines = [];
        lines.push(`Company: ${livePreviewCompanyName.textContent}`);
        lines.push(`Employee: ${livePreviewEmployeeName.textContent}`);
        lines.push(`Pay Period: ${livePreviewPayPeriodStart.textContent} to ${livePreviewPayPeriodEnd.textContent}`);
        lines.push(`Pay Date: ${livePreviewPayDate.textContent}`);
        lines.push('');
        lines.push('Earnings:');
        livePreviewEarningsBody.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
                const desc = cells[0].textContent.trim();
                const amt = cells[3].textContent.trim();
                lines.push(`  ${desc}: ${amt}`);
            }
        });
        lines.push('Deductions:');
        livePreviewDeductionsBody.querySelectorAll('tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const desc = cells[0].textContent.trim();
                const amt = cells[1].textContent.trim();
                lines.push(`  ${desc}: ${amt}`);
            }
        });
        lines.push('');
        lines.push(`Gross Pay: ${livePreviewGrossPay.textContent}`);
        lines.push(`Total Deductions: ${livePreviewTotalDeductions.textContent}`);
        lines.push(`Net Pay: ${livePreviewNetPay.textContent}`);
        return lines.join('\n');
    }

    function copyKeyPaystubData() {
        const text = compileCurrentPreviewText();
        const onSuccess = () => {
            showNotificationModal('Copy Success', 'Key data copied to clipboard. Paste into your document.');
        };
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
            } else {
                fallbackCopy(text, onSuccess);
            }
        } catch (e) {
            fallbackCopy(text, onSuccess);
        }
    }

    function fallbackCopy(text, callback) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            if (callback) callback();
        } catch (err) {
            showNotificationModal('Copy Failed', 'Unable to copy text to clipboard.');
        }
    }


    function maskSSN(ssn) {
        if (!ssn) return '';
        const digits = ssn.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        return last4 ? `XXX-XX-${last4}` : '';
    }

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
    function showNotificationModal(title, message) {
        notificationModalTitle.textContent = title;
        notificationModalMessage.textContent = message;
        openNotificationModal();
    }


    function setupActionButtons() {
        if (resetAllFieldsBtn) resetAllFieldsBtn.addEventListener('click', resetAllFormFields);
        if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraftToLocalStorage);
        if (loadDraftBtn) loadDraftBtn.addEventListener('click', loadDraftFromLocalStorage);
        if (estimateAllDeductionsBtn) estimateAllDeductionsBtn.addEventListener('click', estimateAllStandardDeductions);
        if (previewPdfWatermarkedBtn) previewPdfWatermarkedBtn.addEventListener('click', handleWatermarkedPreview);
        if (copyKeyDataBtn) copyKeyDataBtn.addEventListener('click', copyKeyPaystubData);
        if (generateAndPayBtn) generateAndPayBtn.addEventListener('click', handleMainFormSubmit);
    }


    // --- Initial Setup Calls --- //
    toggleEmploymentFields(); // Set initial state of employment fields
    updateHourlyPayFrequencyVisibility(); // Set initial state of hourly frequency dropdown
    toggleRepresentationFields(); // Set initial state of representation fields
    if (autoCalculateFederalTaxCheckbox) autoCalculateFederalTaxCheckbox.checked = true;
    if (autoCalculateSocialSecurityCheckbox) autoCalculateSocialSecurityCheckbox.checked = true;
    if (autoCalculateMedicareCheckbox) autoCalculateMedicareCheckbox.checked = true;
    if (isForNjEmploymentCheckbox.checked) {
        if (autoCalculateNjSdiCheckbox) autoCalculateNjSdiCheckbox.checked = true;
        if (autoCalculateNjFliCheckbox) autoCalculateNjFliCheckbox.checked = true;
        if (autoCalculateNjUiCheckbox) autoCalculateNjUiCheckbox.checked = true;
    }
    updateAutoCalculatedFields();
    initializeFirstStep();
    setupDelegatedButtonListeners();
    initializeAllInputHandlers();
    showFormStep(1);
    initStepNavigation();
    showActiveStep(0);
    const allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    allFormInputs.forEach(inp => {
        inp.addEventListener('input', debouncedPreview);
        if (inp.tagName === 'SELECT' || inp.type === 'checkbox' || inp.type === 'radio') {
            inp.addEventListener('change', debouncedPreview);
        }
    });

    const annualSalaryInput = document.getElementById('annualSalary');
    if (annualSalaryInput) {
        annualSalaryInput.addEventListener('blur', () => {
            if (validateAnnualSalary()) {
                let value = annualSalaryInput.value.replace(/[^0-9.]/g, '');
                if (value) {
                    value = parseFloat(value).toFixed(2);
                    annualSalaryInput.value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                }
            }
        annualSalaryInput.addEventListener('blur', function() {
            const formatted = formatCurrencyInput(this.value);
            if (formatted) this.value = formatted;
        });
    }

    document.querySelectorAll('.currency-input').forEach(inp => {
        inp.addEventListener('blur', function() {
            const formatted = formatCurrencyInput(this.value);
            if (formatted) this.value = formatted;
        });
    });
    validateDesiredIncome();
    validateAnnualSalary();
    if (sharePdfEmailLink) sharePdfEmailLink.style.display = 'none';
    if (sharePdfInstructions) sharePdfInstructions.style.display = 'none';
    if (DEBUG_MODE) console.log('Initialization sequence completed');

});
