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

document.addEventListener('DOMContentLoaded', () => {
    let currentPreviewStubIndex = 0;
    // --- DOM Elements --- //
    const paystubForm = document.getElementById('paystubForm');
    const formSummaryError = document.getElementById('formSummaryError');
    const numPaystubsSelect = document.getElementById('numPaystubs');
    const hourlyPayFrequencyGroup = document.getElementById('hourlyPayFrequencyGroup');
    const hourlyPayFrequencySelect = document.getElementById('hourlyPayFrequency');
    const employmentTypeRadios = document.querySelectorAll('input[name="employmentType"]');
    const hourlyFieldsDiv = document.getElementById('hourlyFields');
    const salariedFieldsDiv = document.getElementById('salariedFields');

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


    // New Federal Tax Elements
    const federalFilingStatusSelect = document.getElementById('federalFilingStatus');

    // Live Preview Elements
    const livePreviewContent = document.getElementById('paystubPreviewContent');
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
    let currentFormStep = 0;
    const formSteps = Array.from(document.querySelectorAll('.form-step'));
    const formProgressIndicator = document.getElementById('formProgressIndicator');
    const progressSteps = [];
    const stepTitles = [];

    formSteps.forEach((step, idx) => {
        const indicator = document.createElement('div');
        indicator.className = 'progress-step' + (idx === 0 ? ' active' : '');
        indicator.textContent = idx + 1;
        if (formProgressIndicator) formProgressIndicator.appendChild(indicator);
        progressSteps.push(indicator);
        const heading = step.querySelector('h3');
        stepTitles.push(heading ? heading.textContent.trim() : `Step ${idx + 1}`);
    });

    function showFormStep(stepIndex) {
        formSteps.forEach((step, i) => {
            step.style.display = i === stepIndex ? 'block' : 'none';
        });
        progressSteps.forEach((el, i) => {
            el.classList.toggle('active', i === stepIndex);
            if (i === stepIndex) {
                el.setAttribute('aria-current', 'step');
            } else {
                el.removeAttribute('aria-current');
            }
        });
        if (formProgressIndicator) {
            formProgressIndicator.setAttribute('aria-label',
                `Step ${stepIndex + 1} of ${progressSteps.length}: ${stepTitles[stepIndex]}`);
        }
        const prevBtn = formSteps[stepIndex].querySelector('.prev-step-btn');
        if (prevBtn) prevBtn.disabled = stepIndex === 0;
        updateLivePreview();
    }

    function validateFormStep(stepIndex) {
        const stepEl = formSteps[stepIndex];
        let valid = true;
        if (stepEl) {
            const inputs = stepEl.querySelectorAll('input, select, textarea');
            inputs.forEach(inp => { if (!validateField(inp)) valid = false; });
        }
        return valid;
    }

    const nextButtons = document.querySelectorAll('.next-step-btn');
    nextButtons.forEach(btn => {
        if (btn.id === 'generateAndPay') {
            btn.addEventListener('click', () => {
                if (validateAllFormFields()) {
                    handleMainFormSubmit();
                } else {
                    showSummaryError('Please review the highlighted fields.');
                }
            });
        } else {
            btn.addEventListener('click', () => {
                if (validateFormStep(currentFormStep)) {
                    currentFormStep = Math.min(currentFormStep + 1, formSteps.length - 1);
                    showFormStep(currentFormStep);
                }
            });
        }
    });

    const prevButtons = document.querySelectorAll('.prev-step-btn');
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentFormStep > 0) {
                currentFormStep--;
                showFormStep(currentFormStep);
            }
        });
    });

    showFormStep(0);


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

    // --- Event Listeners --- //

    // Toggle Hourly/Salaried Fields
    employmentTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleEmploymentFields);
    });
    incomeRepresentationRadios.forEach(radio => {
        radio.addEventListener('change', toggleRepresentationFields);
    });
    populateDetailsBtn.addEventListener('click', autoPopulateFromDesiredIncome);

    // Update Hourly Pay Frequency Visibility and preview navigation when number of stubs changes
    numPaystubsSelect.addEventListener('change', () => {
        updateHourlyPayFrequencyVisibility();
        currentPreviewStubIndex = 0;
        const numStubs = parseInt(numPaystubsSelect.value) || 1;
        if (previewNavControls) previewNavControls.style.display = numStubs > 1 ? 'block' : 'none';
        if (prevStubBtn) prevStubBtn.disabled = true;
        if (nextStubBtn) nextStubBtn.disabled = numStubs <= 1;
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
    formInputs.forEach(input => {
        input.addEventListener('input', debounce(updateLivePreview, 300));
        input.addEventListener('change', debounce(updateLivePreview, 300)); // For selects, radios, checkboxes
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('invalid')) {
                validateField(input);
            }
        });
    });

    const debouncedTotalsUpdate = debounce(updatePaystubTotals, 300);
    formInputs.forEach(input => {
        input.addEventListener('input', debouncedTotalsUpdate);
        input.addEventListener('change', debouncedTotalsUpdate);
    });

    if (nextStubBtn && prevStubBtn) {
        nextStubBtn.addEventListener('click', () => {
            const numStubs = parseInt(numPaystubsSelect.value) || 1;
            if (currentPreviewStubIndex < numStubs - 1) {
                currentPreviewStubIndex++;
                updateLivePreview();
            }
            prevStubBtn.disabled = currentPreviewStubIndex === 0;
            nextStubBtn.disabled = currentPreviewStubIndex >= numStubs - 1;
        });

        prevStubBtn.addEventListener('click', () => {
            const numStubs = parseInt(numPaystubsSelect.value) || 1;
            if (currentPreviewStubIndex > 0) {
                currentPreviewStubIndex--;
                updateLivePreview();
            }
            prevStubBtn.disabled = currentPreviewStubIndex === 0;
            nextStubBtn.disabled = currentPreviewStubIndex >= numStubs - 1;
        });
    }
    // Initial preview update
    updateLivePreview();
    updatePaystubTotals();

    const initialNumStubs = parseInt(numPaystubsSelect.value) || 1;
    if (previewNavControls) previewNavControls.style.display = initialNumStubs > 1 ? 'block' : 'none';
    if (prevStubBtn) prevStubBtn.disabled = true;
    if (nextStubBtn) nextStubBtn.disabled = initialNumStubs <= 1;


    // Sidebar Button Actions
    if (resetAllFieldsBtn) resetAllFieldsBtn.addEventListener('click', resetAllFormFields);
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraftToLocalStorage);
    if (loadDraftBtn) loadDraftBtn.addEventListener('click', loadDraftFromLocalStorage);
    if (estimateAllDeductionsBtn) estimateAllDeductionsBtn.addEventListener('click', estimateAllStandardDeductions);
    if (previewPdfWatermarkedBtn) previewPdfWatermarkedBtn.addEventListener('click', handleWatermarkedPreview);
    if (copyKeyDataBtn) copyKeyDataBtn.addEventListener('click', copyKeyPaystubData);
    if (generateAndPayBtn) generateAndPayBtn.addEventListener('click', handleMainFormSubmit);

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

    confirmPaymentBtn.addEventListener('click', handlePaymentConfirmationSubmit);

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
        const amount = parseFloat(desiredIncomeAmountInput.value) || 0;
        const period = desiredIncomePeriodSelect.value;
        const type = document.querySelector('input[name="incomeRepresentationType"]:checked').value;
        const hours = parseFloat(assumedHourlyRegularHoursInput.value) || 40;

        let annualAmount = amount;
        if (period === 'Monthly') annualAmount = amount * 12;
        else if (period === 'Weekly') annualAmount = amount * 52;

        if (type === 'Salaried') {
            document.querySelector('input[name="employmentType"][value="Salaried"]').checked = true;
            toggleEmploymentFields();
            document.getElementById('annualSalary').value = annualAmount.toFixed(2);
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
        const formData = new FormData(paystubForm);
        const data = {};
        for (let [key, value] of formData.entries()) {
            const inputElement = paystubForm.elements[key];
            if (inputElement) {
                if (inputElement instanceof RadioNodeList) {
                    data[key] = value;
                } else if (inputElement.type === 'radio') {
                    if (inputElement.checked) {
                        data[key] = value;
                    }
                } else if (inputElement.type === 'checkbox') {
                    data[key] = inputElement.checked;
                } else if (inputElement.type === 'number' || inputElement.classList.contains('amount-input')) {
                    data[key] = parseFloat(value) || 0; // Ensure numbers, default to 0 if NaN
                } else {
                    data[key] = value.trim();
                }
            }
        }

        // Add logo data if available
        data.companyLogoDataUrl = companyLogoPreviewImg.style.display !== 'none' ? companyLogoPreviewImg.src : null;
        data.payrollProviderLogoDataUrl = payrollProviderLogoPreviewImg.style.display !== 'none' ? payrollProviderLogoPreviewImg.src : null;
        
        // Ensure numeric fields that might be empty but not 0 are handled
        const numericFields = [
            'hourlyRate', 'regularHours', 'overtimeHours', 'annualSalary', 'bonus', 'miscEarningAmount',
            'federalTaxAmount', 'stateTaxAmount', 'socialSecurityAmount', 'medicareAmount',
            'njSdiAmount', 'njFliAmount', 'njUiHcWfAmount',
            'healthInsurance', 'retirement401k', 'otherDeductionAmount',
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
        results.totalOtherDeductions += (data.otherDeductionAmount || 0);

        if(data.healthInsurance > 0) results.currentPeriodAmounts.healthInsurance = data.healthInsurance;
        if(data.retirement401k > 0) results.currentPeriodAmounts.retirement401k = data.retirement401k;
        if(data.otherDeductionAmount > 0 && data.otherDeductionName) results.currentPeriodAmounts[data.otherDeductionName || 'otherDeduction'] = data.otherDeductionAmount;


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
        if(initialYtdData && data.otherDeductionName && initialYtdData[data.otherDeductionName]) {
            ytdBase[data.otherDeductionName] = initialYtdData[data.otherDeductionName];
        } else if (data.otherDeductionName) {
             ytdBase[data.otherDeductionName] = 0; // Default to 0 if not in initialYtdData
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
        
        if(data.otherDeductionName && results.currentPeriodAmounts[data.otherDeductionName]) {
            results.ytdAmounts[data.otherDeductionName] = (ytdBase[data.otherDeductionName] || 0) + results.currentPeriodAmounts[data.otherDeductionName];
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
        if (formData.otherDeductionName) runningYtdData[formData.otherDeductionName] = 0;

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
        // Update stub indicator
        livePreviewStubIndicator.textContent = `(Previewing Stub: ${currentPreviewStubIndex + 1} of ${numStubs})`;
        livePreviewStubXofY.textContent = `Stub ${currentPreviewStubIndex + 1} of ${numStubs}`;

        // Company Info
        livePreviewCompanyName.textContent = displayDataForStub.companyName || 'Your Company Name';
        livePreviewCompanyAddress1.textContent = displayDataForStub.companyStreetAddress || '123 Main St';
        livePreviewCompanyAddress2.textContent = `${displayDataForStub.companyCity || 'Anytown'}, ${displayDataForStub.companyState || 'ST'} ${displayDataForStub.companyZip || '12345'}`;
        livePreviewCompanyPhone.textContent = displayDataForStub.companyPhone ? `Phone: ${displayDataForStub.companyPhone}` : 'Phone: (555) 123-4567';
        livePreviewCompanyEin.textContent = displayDataForStub.companyEin ? `EIN: ${displayDataForStub.companyEin}` : 'EIN: XX-XXXXXXX';
        if (displayDataForStub.companyLogoDataUrl) {
            livePreviewCompanyLogo.src = displayDataForStub.companyLogoDataUrl;
            livePreviewCompanyLogo.style.display = 'block';
        } else {
            livePreviewCompanyLogo.style.display = 'none';
        }

        // Employee Info
        livePreviewEmployeeName.textContent = displayDataForStub.employeeFullName || 'Employee Name';
        livePreviewEmployeeAddress1.textContent = displayDataForStub.employeeStreetAddress || '456 Employee Ave';
        livePreviewEmployeeAddress2.textContent = `${displayDataForStub.employeeCity || 'Workville'}, ${displayDataForStub.employeeState || 'ST'} ${displayDataForStub.employeeZip || '67890'}`;
        livePreviewEmployeeSsn.textContent = displayDataForStub.employeeSsn ? `SSN: ${maskSSN(displayDataForStub.employeeSsn)}` : 'SSN: XXX-XX-NNNN';

        livePreviewPayPeriodStart.textContent = displayDataForStub.payPeriodStartDate || 'YYYY-MM-DD';
        livePreviewPayPeriodEnd.textContent = displayDataForStub.payPeriodEndDate || 'YYYY-MM-DD';
        livePreviewPayDate.textContent = displayDataForStub.payDate || 'YYYY-MM-DD';

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
        if (displayDataForStub.otherDeductionAmount > 0 && displayDataForStub.otherDeductionName) {
            addDeductionRow(displayDataForStub.otherDeductionName, calculations.currentPeriodAmounts[displayDataForStub.otherDeductionName], calculations.ytdAmounts[displayDataForStub.otherDeductionName]);
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

        if (prevStubBtn && nextStubBtn) {
            prevStubBtn.disabled = currentPreviewStubIndex === 0;
            nextStubBtn.disabled = currentPreviewStubIndex >= numStubs - 1;
        }
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
        livePreviewGrossPay.textContent = formatCurrency(calculateGrossPay());
        livePreviewTotalDeductions.textContent = formatCurrency(calculateTotalDeductions());
        livePreviewNetPay.textContent = formatCurrency(calculateNetPay());
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
        if(formData.otherDeductionName) runningYtdData[formData.otherDeductionName] = 0;


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
        if (data.otherDeductionAmount > 0 && data.otherDeductionName) {
            deductionsBody.push([data.otherDeductionName, formatCurrency(calculations.currentPeriodAmounts[data.otherDeductionName]), formatCurrency(calculations.ytdAmounts[data.otherDeductionName])]);
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
        if (generateAndPayBtn) generateAndPayBtn.disabled = true;
        clearSummaryError();
        if (validateAllFormFields()) {
            // Update dynamic pricing in modal
            const numStubs = parseInt(numPaystubsSelect.value);
            const pricingInfo = PRICING[numStubs] || PRICING[1];
            totalPaymentAmountSpan.textContent = formatCurrency(pricingInfo.price);
            paymentDiscountNoteSpan.textContent = pricingInfo.note;

            openPaymentModal();
        } else {
            showSummaryError('Please review the highlighted fields below.');
            const firstError = paystubForm.querySelector('.invalid');
            if (firstError) firstError.focus();
            showNotificationModal('Validation Error', 'Please correct the errors in the form.');
            if (generateAndPayBtn) generateAndPayBtn.disabled = false;
        }
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

        toggleEmploymentFields(); // Ensure correct fields are shown based on default radio
        updateHourlyPayFrequencyVisibility(); // And update conditional dropdown
        showFormStep(0);
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
        const amount = parseFloat(desiredIncomeAmountInput.value);
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
            annualSalaryInput.value = effectiveAnnualSalary.toFixed(2);
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
        if (currentFormStep < formSteps.length - 1) {
            currentFormStep++;
            showFormStep(currentFormStep);
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
            const fedTax = estimateFederalTax(grossPay, payFrequency, filingStatus);
            const fedInput = document.getElementById('federalTaxAmount');
            if (fedInput) {
                fedInput.value = fedTax.toFixed(2);
                fedInput.classList.add('auto-calculated-field');
                fedInput.readOnly = true;
            }
        const filingStatus = data.federalFilingStatus || data.filingStatus || 'Single';
        const gross = calculations.grossPay;
        const ytdGross = data.initialYtdGrossPay || 0;
        const isForNJ = data.isForNJEmployment || false;

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
            const val = estimateSocialSecurity(gross, ytdGross);
            socialSecurityAmountInput.value = val.toFixed(2);
            socialSecurityAmountInput.readOnly = true;
            socialSecurityAmountInput.classList.add('auto-calculated-field');
        } else if (autoCalculateSocialSecurityCheckbox) {
            socialSecurityAmountInput.readOnly = false;
            socialSecurityAmountInput.classList.remove('auto-calculated-field');
        }

        if (autoCalculateMedicareCheckbox && autoCalculateMedicareCheckbox.checked) {
            const val = estimateMedicare(gross);
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
                njSdiAmountInput.value = val.toFixed(2);
                njSdiAmountInput.readOnly = true;
                njSdiAmountInput.classList.add('auto-calculated-field');
            } else if (autoCalculateNjSdiCheckbox) {
                njSdiAmountInput.readOnly = false;
                njSdiAmountInput.classList.remove('auto-calculated-field');
            }

            if (autoCalculateNjFliCheckbox && autoCalculateNjFliCheckbox.checked) {
                const val = estimateNJ_FLI(gross, payFrequency);
                njFliAmountInput.value = val.toFixed(2);
                njFliAmountInput.readOnly = true;
                njFliAmountInput.classList.add('auto-calculated-field');
            } else if (autoCalculateNjFliCheckbox) {
                njFliAmountInput.readOnly = false;
                njFliAmountInput.classList.remove('auto-calculated-field');
            }

            if (autoCalculateNjUiCheckbox && autoCalculateNjUiCheckbox.checked) {
                const val = estimateNJ_UIHCWF(gross, payFrequency);
                njUiAmountInput.value = val.toFixed(2);
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
            const val = estimateSocialSecurity(gross, ytd);
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
            const val = estimateMedicare(gross);
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

        const otherDeductionAmount = parseFloat(document.getElementById('otherDeductionAmount').value);
        const otherDeductionNameInput = document.getElementById('otherDeductionName');
        if (otherDeductionNameInput) {
            if (!isNaN(otherDeductionAmount) && otherDeductionAmount > 0) {
                if (!otherDeductionNameInput.value.trim()) {
                    showError(otherDeductionNameInput, 'Name required if amount is entered.');
                    isValid = false;
                } else {
                    clearError(otherDeductionNameInput);
                }
            } else {
                clearError(otherDeductionNameInput);
            }
        }

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

    function validateField(field) {
        let isValid = true;
        let errorMessage = '';
        const value = field.value.trim();

        // Required validation
        if (field.hasAttribute('required') && !value && field.offsetParent !== null) { // Check offsetParent to only validate visible required fields
            isValid = false;
            errorMessage = `${field.labels[0] ? field.labels[0].textContent.replace(' *','').replace('(XXX-XX-NNNN)','').replace('(Last 4 Digits Only)','').trim() : 'This field'} is required.`;
        }

        // Specific validations
        if (isValid && field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }

        if (isValid && field.name === "employeeSsn" && value && !/^\d{3}-?\d{2}-?\d{4}$/.test(value)) {
            isValid = false;
            errorMessage = "Please enter a valid SSN (123-45-6789 or 123456789).";
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
            if (value && !/^[\d\s()+-]{7,20}$/.test(value)) {
                showError(field, 'Format e.g. (555) 123-4567');
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
        const formGroup = inputElement.closest('.form-group');
        if (formGroup) {
            const errorSpan = formGroup.querySelector('.error-message');
            if (errorSpan) {
                errorSpan.textContent = message;
            }
        }
        inputElement.classList.add('invalid');
    }

    function clearError(inputElement) {
         const formGroup = inputElement.closest('.form-group');
        if (formGroup) {
            const errorSpan = formGroup.querySelector('.error-message');
            if (errorSpan) {
                errorSpan.textContent = '';
            }
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
    showFormStep(0);
    if (sharePdfEmailLink) sharePdfEmailLink.style.display = 'none';
    if (sharePdfInstructions) sharePdfInstructions.style.display = 'none';
    showStep(0);

});
