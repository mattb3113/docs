/* BuellDocs Paystub Generator v2 - script.js */
/*
    Author: Gemini
    Date: June 5, 2025
    Project: BuellDocs Client-Side Paystub Generator v2
    Description: JavaScript logic for the paystub generator application,
                 including form handling, calculations, live preview, and PDF generation.
*/

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    let currentPreviewStubIndex = 0;
    // --- DOM Elements --- //
    const paystubForm = document.getElementById('paystubForm');
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

    [desiredIncomeAmountInput, desiredIncomePeriodSelect, assumedHourlyRegularHoursInput,
     isForNjEmploymentCheckbox, ...incomeRepresentationRadios, ...desiredIncomeTypeRadios].forEach(el => {
        el.addEventListener('input', enablePopulateBtn);
        el.addEventListener('change', enablePopulateBtn);
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
    const socialSecurityAmountInput = document.getElementById('socialSecurityAmount');
    const medicareAmountInput = document.getElementById('medicareAmount');
    const autoCalculateSocialSecurityCheckbox = document.getElementById('autoCalculateSocialSecurity');
    const autoCalculateMedicareCheckbox = document.getElementById('autoCalculateMedicare');
    const autoCalculateFederalTaxCheckbox = document.getElementById('autoCalculateFederalTax');

    const estimateAllDeductionsBtn = document.getElementById('estimateAllDeductionsBtn');

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
    const resetAllFieldsBtn = document.getElementById('resetAllFields');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const loadDraftBtn = document.getElementById('loadDraft');
    const loadDraftBtnV2 = document.getElementById('loadDraftBtn');
    const estimateDeductionsBtn = document.getElementById('estimateDeductions');
    const previewPdfWatermarkedBtn = document.getElementById('previewPdfWatermarked');
    const generateAndPayBtn = document.getElementById('generateAndPay');

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
    const successTxIdSpan = document.getElementById('successTxId');
    const successNumStubsSpan = document.getElementById('successNumStubs');
    const successUserNotesSpan = document.getElementById('successUserNotes');

    // Sequential section progression
    const formSections = Array.from(document.querySelectorAll('.form-section-card'));
    let nextSectionIndex = 1; // start after step 1

    function minimizeSecondarySections() {
        formSections.forEach((sec, idx) => {
            if (idx > 0) sec.classList.add('form-section-minimized');
        });
        nextSectionIndex = 1;
    }

    function revealAllSections() {
        formSections.forEach(sec => sec.classList.remove('form-section-minimized'));
        nextSectionIndex = formSections.length;
    }

    function revealNextSection() {
        while (nextSectionIndex < formSections.length) {
            const sec = formSections[nextSectionIndex];
            sec.classList.remove('form-section-minimized');
            nextSectionIndex++;
            if (sec.querySelectorAll('[required]').length > 0) break;
        }
    }

    function isSectionComplete(index) {
        const sec = formSections[index];
        const requiredInputs = sec.querySelectorAll('[required]');
        for (const input of requiredInputs) {
            if (input.offsetParent !== null && !input.value.trim()) {
                return false;
            }
        }
        return true;
    }


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

    const SOCIAL_SECURITY_RATE = 0.062;
    const SOCIAL_SECURITY_WAGE_LIMIT_2024 = 168600; // 2024 limit
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

    // Sequentially reveal sections once required fields are complete
    formSections.slice(1).forEach((section, idx) => {
        const sectionIndex = idx + 1;
        const requiredInputs = section.querySelectorAll('[required]');
        if (requiredInputs.length === 0) return;
        const checkAndAdvance = () => {
            if (sectionIndex + 1 === nextSectionIndex && isSectionComplete(sectionIndex)) {
                revealNextSection();
            }
        };
        requiredInputs.forEach(input => {
            input.addEventListener('input', checkAndAdvance);
            input.addEventListener('change', checkAndAdvance);
        });
    });


    // Handle Logo Uploads
    companyLogoInput.addEventListener('change', (e) => handleLogoUpload(e, companyLogoPreviewImg, companyLogoPlaceholder));
    payrollProviderLogoInput.addEventListener('change', (e) => handleLogoUpload(e, payrollProviderLogoPreviewImg, payrollProviderLogoPlaceholder));

    // Form input changes for live preview (debounced)
    const formInputs = paystubForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', debounce(updateLivePreview, 300));
        input.addEventListener('change', debounce(updateLivePreview, 300)); // For selects, radios, checkboxes
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

    const initialNumStubs = parseInt(numPaystubsSelect.value) || 1;
    if (previewNavControls) previewNavControls.style.display = initialNumStubs > 1 ? 'block' : 'none';
    if (prevStubBtn) prevStubBtn.disabled = true;
    if (nextStubBtn) nextStubBtn.disabled = initialNumStubs <= 1;


    // Sidebar Button Actions
    resetAllFieldsBtn.addEventListener('click', resetAllFormFields);
    saveDraftBtn.addEventListener('click', saveDraftToLocalStorage);
    loadDraftBtn.addEventListener('click', loadDraft);
    if (loadDraftBtnV2) loadDraftBtnV2.addEventListener('click', loadDraftFromLocalStorage);
    estimateDeductionsBtn.addEventListener('click', estimateAllDeductions);
    if (estimateAllDeductionsBtn) estimateAllDeductionsBtn.addEventListener('click', estimateAllStandardDeductions);
    previewPdfWatermarkedBtn.addEventListener('click', () => generateAndDownloadPdf(true));
    generateAndPayBtn.addEventListener('click', handleMainFormSubmit);

    // Modal Interactions
    closePaymentModalBtn.addEventListener('click', () => paymentModal.style.display = 'none');
    closeSuccessMessageBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        // Reset modal to initial state for next time
        paymentInstructionsDiv.style.display = 'block';
        modalOrderSuccessMessageDiv.style.display = 'none';
        cashAppTxIdInput.value = '';
        clearError(cashAppTxIdInput);
    });
    confirmPaymentBtn.addEventListener('click', handlePaymentConfirmationSubmit);

    closeNotificationModalBtn.addEventListener("click", () => notificationModal.style.display = "none");
    // Close modal if clicked outside of modal-content
    window.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
        if (event.target === notificationModal) {
            notificationModal.style.display = 'none';
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
                previewImgElement.src = e.target.result;
                previewImgElement.style.display = 'block';
                if (placeholderElement) placeholderElement.style.display = 'none';
                updateLivePreview(); // Update the main live preview
            }
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


        const calculatedSocialSecurity = results.grossPay * SOCIAL_SECURITY_RATE;
        const calculatedMedicare = results.grossPay * MEDICARE_RATE;
        results.calculatedSocialSecurity = calculatedSocialSecurity;
        results.calculatedMedicare = calculatedMedicare;

        const socialSecurityUsed = data.autoCalculateSocialSecurity ? calculatedSocialSecurity : (data.socialSecurityAmount || 0);
        const medicareUsed = data.autoCalculateMedicare ? calculatedMedicare : (data.medicareAmount || 0);

        // --- Calculate Total Taxes for Period ---
        results.totalTaxes += (data.federalTaxAmount || 0);
        results.totalTaxes += (data.stateTaxAmount || 0);
        results.totalTaxes += socialSecurityUsed;
        results.totalTaxes += medicareUsed;
        results.totalTaxes += (data.njSdiAmount || 0);
        results.totalTaxes += (data.njFliAmount || 0);
        results.totalTaxes += (data.njUiHcWfAmount || 0);

        results.currentPeriodAmounts.federalTax = data.federalTaxAmount || 0;
        if (data.stateTaxName) results.currentPeriodAmounts[data.stateTaxName || 'stateTax'] = data.stateTaxAmount || 0;
        else results.currentPeriodAmounts.stateTax = data.stateTaxAmount || 0;
        results.currentPeriodAmounts.socialSecurity = socialSecurityUsed;
        results.currentPeriodAmounts.medicare = medicareUsed;
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
        results.ytdAmounts.federalTax = (ytdBase.federalTax || 0) + (data.federalTaxAmount || 0);
        results.ytdAmounts.stateTax = (ytdBase.stateTax || 0) + (data.stateTaxAmount || 0);
        results.ytdAmounts.socialSecurity = (ytdBase.socialSecurity || 0) + socialSecurityUsed;
        results.ytdAmounts.medicare = (ytdBase.medicare || 0) + medicareUsed;
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

        let displayDataForStub = { ...formData };
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
        let calculations = null;

        for (let i = 0; i <= currentPreviewStubIndex; i++) {
            displayDataForStub.payPeriodStartDate = currentPeriodStartDate;
            displayDataForStub.payPeriodEndDate = currentPeriodEndDate;
            displayDataForStub.payDate = currentPayDate;

            calculations = calculateCurrentPeriodPay(displayDataForStub, runningYtdData);
            runningYtdData = { ...calculations.ytdAmounts };

            if (i < currentPreviewStubIndex) {
                const frequencyForDateCalc = formData.employmentType === 'Hourly' ? hourlyPayFrequencySelect.value : formData.salariedPayFrequency;
                const nextPeriod = getNextPayPeriod(currentPeriodStartDate, currentPeriodEndDate, currentPayDate, frequencyForDateCalc);
                currentPeriodStartDate = nextPeriod.startDate;
                currentPeriodEndDate = nextPeriod.endDate;
                currentPayDate = nextPeriod.payDate;
            }
        }

        if (currentPreviewStubIndex === 0) {
            if (formData.autoCalculateSocialSecurity) {
                socialSecurityAmountInput.value = calculations.currentPeriodAmounts.socialSecurity.toFixed(2);
                socialSecurityAmountInput.readOnly = true;
            } else {
                socialSecurityAmountInput.readOnly = false;
            }
            if (formData.autoCalculateMedicare) {
                medicareAmountInput.value = calculations.currentPeriodAmounts.medicare.toFixed(2);
                medicareAmountInput.readOnly = true;
            } else {
                medicareAmountInput.readOnly = false;
            }
        }

        const totalStubs = numStubs;
        livePreviewStubIndicator.textContent = `(Previewing Stub: ${currentPreviewStubIndex + 1} of ${totalStubs})`;
        livePreviewStubXofY.textContent = `Stub ${currentPreviewStubIndex + 1} of ${totalStubs}`;

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


    function generateAndDownloadPdf(isPreviewMode) {
        if (!validateAllFormFields()) {
            showNotificationModal('Validation Error', 'Please fix the errors in the form before generating the PDF.'); // Replace with custom modal later
            return;
        }

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
    }

    function generatePdfPage(doc, data, calculations, isPreviewMode, stubNum, totalStubs) {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 15;

        yPos = drawHeader(doc, data, pageWidth, yPos);
        yPos = drawTitle(doc, pageWidth, stubNum, totalStubs, yPos);
        yPos = drawInfoTable(doc, data, yPos);
        yPos = drawEarningsTable(doc, data, calculations, yPos);
        yPos = drawDeductionsTable(doc, data, calculations, yPos);
        yPos = drawSummary(doc, calculations, pageWidth, yPos);
        drawFooter(doc, data, pageHeight, pageWidth, isPreviewMode);
        if (isPreviewMode) drawWatermarks(doc, pageWidth, pageHeight);
    }

    function drawHeader(doc, data, pageWidth, yPos) {
        doc.setFontSize(10);
        doc.setTextColor(174, 142, 93);
        doc.text('BUELLDOCS', 15, yPos);
        yPos += 2;
        if (data.companyLogoDataUrl) {
            try {
                const imgProps = doc.getImageProperties(data.companyLogoDataUrl);
                const imgWidth = 30;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                doc.addImage(data.companyLogoDataUrl, 'PNG', pageWidth - 15 - imgWidth, yPos - 8, imgWidth, imgHeight);
            } catch (e) { console.error('Error adding company logo to PDF:', e); }
        }
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
            styles: { fontSize: 9, cellPadding: 1.5 },
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
        const stateTaxLabel = data.stateTaxName || 'State Income Tax';
        deductionsBody.push([stateTaxLabel, formatCurrency(calculations.currentPeriodAmounts[stateTaxLabel] || calculations.currentPeriodAmounts.stateTax), formatCurrency(calculations.ytdAmounts.stateTax)]);
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
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('[Sample Voided Check Area - Appears in HTML Preview]', 15, bottomContentY - 20);
        }
        if (data.payrollProviderLogoDataUrl) {
            try {
                const imgProps = doc.getImageProperties(data.payrollProviderLogoDataUrl);
                const imgWidth = 25;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                doc.addImage(data.payrollProviderLogoDataUrl, 'PNG', 15, bottomContentY - imgHeight - 5, imgWidth, imgHeight);
            } catch (e) { console.error('Error adding payroll provider logo to PDF:', e); }
        }
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
        if (validateAllFormFields()) {
            // Update dynamic pricing in modal
            const numStubs = parseInt(numPaystubsSelect.value);
            const pricingInfo = PRICING[numStubs] || PRICING[1];
            totalPaymentAmountSpan.textContent = formatCurrency(pricingInfo.price);
            paymentDiscountNoteSpan.textContent = pricingInfo.note;

            paymentModal.style.display = 'flex'; // Use flex for centering
            paymentInstructionsDiv.style.display = 'block';
            modalOrderSuccessMessageDiv.style.display = 'none';
        } else {
            // Consider a more elegant way to show this, e.g., scroll to first error
            showNotificationModal('Validation Error', 'Please correct the errors in the form.');
        }
    }

    function handlePaymentConfirmationSubmit() {
        const txId = cashAppTxIdInput.value.trim();
        if (!txId) {
            showError(cashAppTxIdInput, 'Transaction ID is required.');
            return;
        }
        clearError(cashAppTxIdInput);

        const formData = gatherFormData();
        successUserEmailSpan.textContent = formData.userEmail;
        successTxIdSpan.textContent = txId;
        successNumStubsSpan.textContent = numPaystubsSelect.value;
        successUserNotesSpan.textContent = formData.userNotes || 'None provided';


        paymentInstructionsDiv.style.display = 'none';
        modalOrderSuccessMessageDiv.style.display = 'block';
    }

    function resetAllFormFields() {
        paystubForm.reset();
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

        toggleEmploymentFields(); // Ensure correct fields are shown based on default radio
        updateHourlyPayFrequencyVisibility(); // And update conditional dropdown
        minimizeSecondarySections();
        updateLivePreview(); // Refresh live preview
    }

    function saveDraft() {
        const data = gatherFormData();
        try {
            localStorage.setItem('buellDocsPaystubDraft', JSON.stringify(data));
            alert('Draft saved!');
        } catch (e) {
            console.error('Failed to save draft', e);
        }
    }

    // New draft save logic for v2
    function saveDraftToLocalStorage() {
        const data = gatherFormData();
        // Ensure logo Data URLs are stored
        data.companyLogoDataUrl = companyLogoPreviewImg.style.display !== 'none' ? companyLogoPreviewImg.src : null;
        data.payrollProviderLogoDataUrl = payrollProviderLogoPreviewImg.style.display !== 'none' ? payrollProviderLogoPreviewImg.src : null;
        try {
            localStorage.setItem('buellDocsPaystubDraft_v2', JSON.stringify(data));
            const originalText = saveDraftBtn.textContent;
            saveDraftBtn.textContent = 'Draft Saved!';
            setTimeout(() => { saveDraftBtn.textContent = originalText; }, 1500);
        } catch (e) {
            console.error('Failed to save draft', e);
        }
    }

    function loadDraft() {
        const draftStr = localStorage.getItem('buellDocsPaystubDraft');
        if (!draftStr) {
            alert('No draft found.');
            return;
        }
        let data;
        try {
            data = JSON.parse(draftStr);
        } catch (e) {
            console.error('Failed to parse draft', e);
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
            } else if (el.tagName === 'SELECT') {
                el.value = value;
            } else if (el.type !== 'file') {
                el.value = value;
            }
        }

        if (data.companyLogoDataUrl) {
            companyLogoPreviewImg.src = data.companyLogoDataUrl;
            companyLogoPreviewImg.style.display = 'block';
            companyLogoPlaceholder.style.display = 'none';
        } else {
            companyLogoPreviewImg.src = '#';
            companyLogoPreviewImg.style.display = 'none';
            companyLogoPlaceholder.style.display = 'block';
        }

        if (data.payrollProviderLogoDataUrl) {
            payrollProviderLogoPreviewImg.src = data.payrollProviderLogoDataUrl;
            payrollProviderLogoPreviewImg.style.display = 'block';
            payrollProviderLogoPlaceholder.style.display = 'none';
        } else {
            payrollProviderLogoPreviewImg.src = '#';
            payrollProviderLogoPreviewImg.style.display = 'none';
            payrollProviderLogoPlaceholder.style.display = 'block';
        }

        toggleEmploymentFields();
        updateHourlyPayFrequencyVisibility();
        revealAllSections();
        updateLivePreview();
    }

    function loadDraftFromLocalStorage() {
        const draftStr = localStorage.getItem('buellDocsPaystubDraft_v2');
        if (!draftStr) {
            if (loadDraftBtnV2) {
                const originalText = loadDraftBtnV2.textContent;
                loadDraftBtnV2.textContent = 'No Draft Found';
                setTimeout(() => {
                    loadDraftBtnV2.textContent = originalText;
                }, 1500);
            } else {
                showNotificationModal('No Draft Found', 'There is no saved draft to load.');
            }
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
            const fedStatusEl = document.querySelector('input[name="federalFilingStatus"]:checked') ||
                                document.getElementById('federalFilingStatus');
            const filingStatus = fedStatusEl ? fedStatusEl.value : 'Single';
            const ytdGross = parseFloat(document.getElementById('initialYtdGrossPay').value) || 0;

            const fedTax = estimateFederalTax(grossPayPerPeriod, payFrequency, filingStatus);
            const stateTax = estimateNJStateTax(grossPayPerPeriod, payFrequency, filingStatus);
            const ssTax = estimateSocialSecurity(grossPayPerPeriod, ytdGross);
            const medicareTax = estimateMedicare(grossPayPerPeriod);
            const sdi = estimateNJ_SDI(grossPayPerPeriod, payFrequency);
            const fli = estimateNJ_FLI(grossPayPerPeriod, payFrequency);
            const ui = estimateNJ_UIHCWF(grossPayPerPeriod, payFrequency);

            document.getElementById('federalTaxAmount').value = fedTax.toFixed(2);
            document.getElementById('stateTaxAmount').value = stateTax.toFixed(2);
            document.getElementById('stateTaxName').value = 'NJ State Tax';
            document.getElementById('socialSecurityAmount').value = ssTax.toFixed(2);
            document.getElementById('medicareAmount').value = medicareTax.toFixed(2);
            document.getElementById('njSdiAmount').value = sdi.toFixed(2);
            document.getElementById('njFliAmount').value = fli.toFixed(2);
            document.getElementById('njUiHcWfAmount').value = ui.toFixed(2);

            ['federalTaxAmount','stateTaxAmount','socialSecurityAmount','medicareAmount','njSdiAmount','njFliAmount','njUiHcWfAmount']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.classList.add('auto-populated'); el.readOnly = true; }
                });
        } else {
            ['federalTaxAmount','stateTaxAmount','socialSecurityAmount','medicareAmount','njSdiAmount','njFliAmount','njUiHcWfAmount']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) { el.classList.remove('auto-populated'); el.readOnly = false; }
                });
            document.getElementById('stateTaxName').value = '';
            document.getElementById('njSdiAmount').value = 0;
            document.getElementById('njFliAmount').value = 0;
            document.getElementById('njUiHcWfAmount').value = 0;
        }

        toggleEmploymentFields();
        updateHourlyPayFrequencyVisibility();
        revealNextSection();
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

    function estimateAllStandardDeductions() {
        const data = gatherFormData();
        const calculations = calculateCurrentPeriodPay(data);

        const payFrequency = data.employmentType === 'Hourly'
            ? (hourlyPayFrequencySelect.value || 'Weekly')
            : (data.salariedPayFrequency || 'Bi-Weekly');
        const filingStatus = data.federalFilingStatus || data.filingStatus || 'Single';

        const gross = calculations.grossPay;

        const fedInput = document.getElementById('federalTaxAmount');
        if (fedInput && typeof estimateFederalTax === 'function') {
            const fed = estimateFederalTax(gross, payFrequency, filingStatus);
            fedInput.value = fed.toFixed(2);
            fedInput.readOnly = true;
            fedInput.classList.add('auto-calculated-field');
            if (autoCalculateFederalTaxCheckbox) autoCalculateFederalTaxCheckbox.checked = true;
        }

        if (typeof estimateSocialSecurity === 'function') {
            const ssInput = document.getElementById('socialSecurityAmount');
            if (ssInput) {
                const ss = estimateSocialSecurity(gross, payFrequency);
                ssInput.value = ss.toFixed(2);
                ssInput.readOnly = true;
                ssInput.classList.add('auto-calculated-field');
            }
            if (autoCalculateSocialSecurityCheckbox) autoCalculateSocialSecurityCheckbox.checked = true;
        }

        if (typeof estimateMedicare === 'function') {
            const medInput = document.getElementById('medicareAmount');
            if (medInput) {
                const med = estimateMedicare(gross);
                medInput.value = med.toFixed(2);
                medInput.readOnly = true;
                medInput.classList.add('auto-calculated-field');
            }
            if (autoCalculateMedicareCheckbox) autoCalculateMedicareCheckbox.checked = true;
        }

        const forNJ = data.isForNJEmployment;
        if (forNJ) {
            const stateAmountInput = document.getElementById('stateTaxAmount');
            const stateNameInput = document.getElementById('stateTaxName');
            if (stateAmountInput && typeof estimateNJStateTax === 'function') {
                const st = estimateNJStateTax(gross, payFrequency, filingStatus);
                stateAmountInput.value = st.toFixed(2);
                stateAmountInput.readOnly = true;
                stateAmountInput.classList.add('auto-calculated-field');
            }
            if (stateNameInput && !stateNameInput.value) stateNameInput.value = 'NJ State Tax';

            const njSdiInput = document.getElementById('njSdiAmount');
            if (njSdiInput && typeof estimateNJ_SDI === 'function') {
                njSdiInput.value = estimateNJ_SDI(gross).toFixed(2);
                njSdiInput.readOnly = true;
                njSdiInput.classList.add('auto-calculated-field');
            }
            const njFliInput = document.getElementById('njFliAmount');
            if (njFliInput && typeof estimateNJ_FLI === 'function') {
                njFliInput.value = estimateNJ_FLI(gross).toFixed(2);
                njFliInput.readOnly = true;
                njFliInput.classList.add('auto-calculated-field');
            }
            const njUiInput = document.getElementById('njUiHcWfAmount');
            if (njUiInput && typeof estimateNJ_UIHCWF === 'function') {
                njUiInput.value = estimateNJ_UIHCWF(gross).toFixed(2);
                njUiInput.readOnly = true;
                njUiInput.classList.add('auto-calculated-field');
            }
        }

        updateLivePreview();

        if (estimateAllDeductionsBtn) {
            const original = estimateAllDeductionsBtn.textContent;
            estimateAllDeductionsBtn.textContent = 'Estimates Applied!';
            setTimeout(() => { estimateAllDeductionsBtn.textContent = original; }, 2000);
        }
    }

    function handleNjEmploymentChange() {
        const forNJ = isForNjEmploymentCheckbox.checked;
        const fields = [
            'federalTaxAmount', 'stateTaxAmount', 'socialSecurityAmount',
            'medicareAmount', 'njSdiAmount', 'njFliAmount', 'njUiHcWfAmount'
        ];
        const stateTaxNameInput = document.getElementById('stateTaxName');

        if (forNJ) {
            estimateAllDeductions();
            if (stateTaxNameInput && !stateTaxNameInput.value) {
                stateTaxNameInput.value = 'NJ State Tax';
            }
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.classList.add('auto-populated'); el.readOnly = true; }
            });
        } else {
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.classList.remove('auto-populated'); el.readOnly = false; }
            });
            if (stateTaxNameInput) stateTaxNameInput.value = '';
            document.getElementById('njSdiAmount').value = 0;
            document.getElementById('njFliAmount').value = 0;
            document.getElementById('njUiHcWfAmount').value = 0;
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
        return isValid;
    }

    function validateField(field) {
        let isValid = true;
        let errorMessage = '';
        const value = field.value.trim();

        // Required validation
        if (field.hasAttribute('required') && !value && field.offsetParent !== null) { // Check offsetParent to only validate visible required fields
            isValid = false;
            errorMessage = `${field.labels[0] ? field.labels[0].textContent.replace(' *','').replace('(XXX-XX-NNNN)','').trim() : 'This field'} is required.`;
        }

        // Specific validations
        if (isValid && field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }

        if (isValid && field.name === 'employeeSsn' && value && !/^\d{3}-?\d{2}-?\d{4}$/.test(value) && !/^\d{9}$/.test(value)) {
            isValid = false;
            errorMessage = 'SSN must be in NNN-NN-NNNN or NNNNNNNNN format.';
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
    function setRequired(element, isRequired) {
        if (isRequired) {
            element.setAttribute('required', 'required');
        } else {
            element.removeAttribute('required');
            clearError(element); // Clear any errors if it's no longer required
        }
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


    function maskSSN(ssn) {
        if (!ssn) return '';
        const cleaned = ssn.replace(/-/g, '');
        if (cleaned.length === 9) {
            return `XXX-XX-${cleaned.substring(5)}`;
        }
        return ssn; // Return original if not in expected format
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
        notificationModal.style.display = "flex";
    }


    // --- Initial Setup Calls --- //
    toggleEmploymentFields(); // Set initial state of employment fields
    updateHourlyPayFrequencyVisibility(); // Set initial state of hourly frequency dropdown
    toggleRepresentationFields(); // Set initial state of representation fields
    minimizeSecondarySections();

});
