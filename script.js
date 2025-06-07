/*
    BuellDocs Paystub Generator v3.3 - script.js (FIXED)
    Author: Gemini (Refactored for BuellDocs)
    Date: June 7, 2025
    Project: BuellDocs Client-Side Paystub Generator v3.3
    Description: CORRECTED logic for a single-page, real-time paystub generator.
                 This version centralizes all tax calculations in paystubEngine.js,
                 fixes date and YTD accumulations, and repairs UI flow.
*/
'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management --- //
    let currentPreviewStubIndex = 0;
    let allStubsData = [];
    let activeModal = null;
    let currentBasePrice = 0;

    // --- DOM Element Cache --- //
    const dom = {};
    const elementIds = [
        'paystubForm', 'mainFormContent', 'reviewSection', 'reviewPreviewContainer',
        'formSummaryError', 'numPaystubs', 'resetAllFieldsBtn', 'previewPdfWatermarkedBtn',
        'populateDetailsBtn', 'annualSalary', 'salariedPayFrequency',
        'employmentStartDate', 'payDate', 'federalFilingStatus', 'federalTaxAmount',
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
        'companyCity', 'companyState', 'companyZip', 'livePreviewCompanyPhone', 'companyPhone', 
        'livePreviewStubXofY', 'livePreviewCompanyLogo', 'livePreviewEmployeeName', 'livePreviewEmployeeAddress1', 
        'livePreviewEmployeeAddress2', 'employeeStreetAddress', 'employeeCity', 'employeeState', 'livePreviewEmployeeSsn', 'employeeZip',
        'livePreviewPayPeriodStart', 'livePreviewPayPeriodEnd', 'livePreviewPayDate', 'livePreviewEarningsBody', 
        'livePreviewDeductionsBody', 'livePreviewGrossCurrent', 'livePreviewGrossYtd', 'livePreviewDeductionsCurrent',
        'livePreviewDeductionsYtd', 'livePreviewNetCurrent', 'livePreviewNetYtd', 'livePreviewPayrollProviderLogo', 
        'livePreviewVoidedCheckContainer', 'paymentModal', 'closePaymentModalBtn', 'paymentInstructions', 'totalPaymentAmount', 
        'paymentDiscountNote', 'cashAppTxId', 'confirmPaymentBtn', 'modalOrderSuccessMessage', 'closeSuccessMessageBtn', 
        'successUserEmailInline', 'notificationModal', 'closeNotificationModalBtn', 'notificationModalTitle', 
        'notificationModalMessage', 'cashAppTxIdError', 'stateWarning', 'proceedToPaymentBtn', 'editInfoBtn',
        'reviewAndGenerateBtn', 'addOnsSection', 'requestHardCopy', 'requestExcel', 'paymentScreenshot', 'paymentScreenshotError',
        'pdfPreviewModal', 'closePdfModalBtn', 'pdfPreviewFrame'
    ];
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) dom[id] = el;
    });
    
    dom.allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    dom.autoCalcFields = document.querySelectorAll('[data-is-auto="true"]');

    // --- Constants --- //
    const PAY_PERIODS_PER_YEAR = { 'Weekly': 52, 'Bi-Weekly': 26, 'Semi-Monthly': 24, 'Monthly': 12 };
    const PRICING = { 1: { price: 29.99, note: "" }, 2: { price: 54.99, note: "Save $5" }, 3: { price: 79.99, note: "Save $10" } };
    const HARD_COPY_PRICE = 19.99;
    const EXCEL_PRICE = 9.99;
    const US_STATES = [ 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming' ];

    // --- Utility Functions --- //
    const toBig = (v) => math.bignumber(String(v || 0).replace(/[^0-9.-]+/g, ''));
    const { add, subtract, multiply, divide, format } = math;
    
    const formatCurrency = (value) => {
        const num = toBig(value).toNumber();
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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

        input.classList.remove('invalid');
        if (errorSpan) errorSpan.textContent = '';

        if (input.offsetParent === null) return true; // Don't validate hidden fields

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

        if (!isValid) {
            if (errorSpan) errorSpan.textContent = errorMessage;
            input.classList.add('invalid');
        }
        return isValid;
    };
    
    const validateFullForm = () => {
        let isFormValid = true;
        dom.allFormInputs.forEach(input => {
            if (!validateField(input)) {
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
    
    function getPeriodDates(payDateStr, payFrequency) {
        const payDate = new Date(payDateStr + 'T00:00:00');
        let startDate = new Date(payDate);
        let endDate = new Date(payDate);

        switch(payFrequency) {
            case 'Weekly':
                startDate.setDate(payDate.getDate() - 6);
                break;
            case 'Bi-Weekly':
                startDate.setDate(payDate.getDate() - 13);
                break;
            case 'Semi-Monthly':
                if (payDate.getDate() > 15) {
                    startDate.setDate(1);
                    endDate.setDate(15);
                } else {
                    startDate = new Date(payDate.getFullYear(), payDate.getMonth() - 1, 16);
                    endDate = new Date(payDate.getFullYear(), payDate.getMonth(), 0);
                }
                break;
            case 'Monthly':
                 startDate = new Date(payDate.getFullYear(), payDate.getMonth(), 1);
                 endDate = new Date(payDate.getFullYear(), payDate.getMonth() + 1, 0);
                 break;
        }
        return {
            payPeriodStartDate: startDate,
            payPeriodEndDate: endDate,
        }
    }

    const calculateAllStubsData = () => {
        if (!paystubEngine) return;
        const formData = Object.fromEntries(new FormData(dom.paystubForm));
        
        const numStubs = parseInt(formData.numPaystubs, 10);
        const payFrequency = formData.salariedPayFrequency;
        const payPeriods = PAY_PERIODS_PER_YEAR[payFrequency];
        const grossPerPeriod = divide(formData.annualSalary, payPeriods);
        const bonusPerPeriod = toBig(formData.bonus);
        const grossWithBonus = add(grossPerPeriod, bonusPerPeriod);
        
        allStubsData = [];
        
        // Initialize running YTD totals
        const useInitialYtd = !dom.startYtdFromBatch.checked;
        let ytd = {
            gross: useInitialYtd ? toBig(formData.initialYtdGrossPay) : toBig(0),
            federal: useInitialYtd ? toBig(formData.initialYtdFederalTax) : toBig(0),
            ss: useInitialYtd ? toBig(formData.initialYtdSocialSecurity) : toBig(0),
            medicare: useInitialYtd ? toBig(formData.initialYtdMedicare) : toBig(0),
            state: useInitialYtd ? toBig(formData.initialYtdStateTax) : toBig(0),
            sdi: useInitialYtd ? toBig(formData.initialYtdNjSdi) : toBig(0),
            fli: useInitialYtd ? toBig(formData.initialYtdNjFli) : toBig(0),
            ui: useInitialYtd ? toBig(formData.initialYtdNjUiHcWf) : toBig(0),
            other: useInitialYtd ? toBig(0) : toBig(0), // Assuming other deductions also start from zero
        };

        const firstPayDate = dom.payDate.value;
        if (!firstPayDate) return;

        for (let i = 0; i < numStubs; i++) {
            const otherDeductions = add(formData.healthInsurance, formData.retirement401k);
            
            const inputs = {
                grossPerPeriod: grossWithBonus,
                ytdGross: ytd.gross,
                payPeriods: payPeriods,
                filingStatus: formData.federalFilingStatus,
                otherDeductions: otherDeductions,
                isNj: formData.employeeState === 'New Jersey'
            };

            const currentCalcs = paystubEngine.calculate(inputs);

            // Date calculations for this specific stub
            let currentPayDate = new Date(firstPayDate + 'T00:00:00');
            if (payFrequency === 'Weekly') currentPayDate.setDate(currentPayDate.getDate() + (i * 7));
            if (payFrequency === 'Bi-Weekly') currentPayDate.setDate(currentPayDate.getDate() + (i * 14));
            // Note: Semi-monthly/Monthly date logic would be more complex; this is a simplification.
            const periodDates = getPeriodDates(currentPayDate.toISOString().split('T')[0], payFrequency);

            const currentStubData = {
                ...currentCalcs,
                payDate: currentPayDate,
                ...periodDates,
                bonus: bonusPerPeriod,
                otherDeductions: otherDeductions,
                ytd: { ...ytd } // Store snapshot of YTD *before* this period
            };
            
            allStubsData.push(currentStubData);

            // Update running YTD totals for the *next* iteration
            ytd.gross = add(ytd.gross, currentCalcs.grossPay);
            ytd.federal = add(ytd.federal, currentCalcs.federalTax);
            ytd.ss = add(ytd.ss, currentCalcs.socialSecurity);
            ytd.medicare = add(ytd.medicare, currentCalcs.medicare);
            ytd.state = add(ytd.state, currentCalcs.stateTax);
            ytd.sdi = add(ytd.sdi, currentCalcs.sdi);
            ytd.fli = add(ytd.fli, currentCalcs.fli);
            ytd.ui = add(ytd.ui, currentCalcs.ui_hc_wf);
            ytd.other = add(ytd.other, otherDeductions);
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
            njSdiAmount: firstStub.sdi,
            njFliAmount: firstStub.fli,
            njUiHcWfAmount: firstStub.ui_hc_wf
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
    }, 300);

    const renderPreviewForIndex = (index, container = dom.paystubPreviewContent) => {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        if (index < 0 || index >= numStubs || !allStubsData[index]) {
            // console.error("Preview render failed: Invalid index or no data.");
            return;
        }

        const stubData = allStubsData[index];
        const formData = Object.fromEntries(new FormData(dom.paystubForm));
        const getEl = (selector) => container.querySelector(selector);
        
        const formatDate = (date) => date.toISOString().split('T')[0];

        // --- Populate Preview ---
        getEl('#livePreviewCompanyName').textContent = formData.companyName || 'Your Company Name';
        getEl('#livePreviewCompanyAddress1').textContent = formData.companyStreetAddress || '123 Main St';
        getEl('#livePreviewCompanyAddress2').textContent = `${formData.companyCity || 'Anytown'}, ${formData.companyState || 'ST'} ${formData.companyZip || '12345'}`;
        getEl('#livePreviewCompanyPhone').textContent = formData.companyPhone ? `Phone: ${formatPhoneNumber(formData.companyPhone)}` : '';
        getEl('#livePreviewEmployeeName').textContent = formData.employeeFullName || 'Employee Name';
        getEl('#livePreviewEmployeeAddress1').textContent = formData.employeeStreetAddress || '456 Employee Ave';
        getEl('#livePreviewEmployeeAddress2').textContent = `${formData.employeeCity || 'Workville'}, ${formData.employeeState || 'ST'} ${formData.employeeZip || '67890'}`;
        getEl('#livePreviewEmployeeSsn').textContent = formData.employeeSsn ? `SSN: ${formatSsnLast4(formData.employeeSsn)}` : 'SSN: XXX-XX-XXXX';

        getEl('#livePreviewPayDate').textContent = formatDate(stubData.payDate);
        getEl('#livePreviewPayPeriodStart').textContent = formatDate(stubData.payPeriodStartDate);
        getEl('#livePreviewPayPeriodEnd').textContent = formatDate(stubData.payPeriodEndDate);
        getEl('#livePreviewStubXofY').textContent = `Stub ${index + 1} of ${numStubs}`;

        // Earnings Table
        const earningsBody = getEl('#livePreviewEarningsBody');
        earningsBody.innerHTML = `
            <tr>
                <td data-label="Description">Regular Salary</td>
                <td data-label="Rate">--</td>
                <td data-label="Hours">--</td>
                <td data-label="Current Period">${formatCurrency(subtract(stubData.grossPay, stubData.bonus))}</td>
                <td data-label="Year-to-Date">${formatCurrency(add(stubData.ytd.gross, subtract(stubData.grossPay, stubData.bonus)))}</td>
            </tr>`;
        if (stubData.bonus.isPositive()) {
             earningsBody.innerHTML += `
            <tr>
                <td data-label="Description">Bonus</td>
                <td data-label="Rate">--</td>
                <td data-label="Hours">--</td>
                <td data-label="Current Period">${formatCurrency(stubData.bonus)}</td>
                <td data-label="Year-to-Date">${formatCurrency(add(stubData.ytd.gross, stubData.grossPay))}</td>
            </tr>`;
        }
        
        // Deductions Table
        const deductionsBody = getEl('#livePreviewDeductionsBody');
        deductionsBody.innerHTML = '';
        const allDeductions = {
            'Federal Tax': { current: stubData.federalTax, ytd: add(stubData.ytd.federal, stubData.federalTax) },
            'Social Security': { current: stubData.socialSecurity, ytd: add(stubData.ytd.ss, stubData.socialSecurity) },
            'Medicare': { current: stubData.medicare, ytd: add(stubData.ytd.medicare, stubData.medicare) },
            'NJ State Tax': { current: stubData.stateTax, ytd: add(stubData.ytd.state, stubData.stateTax) },
            'NJ SDI': { current: stubData.sdi, ytd: add(stubData.ytd.sdi, stubData.sdi) },
            'NJ FLI': { current: stubData.fli, ytd: add(stubData.ytd.fli, stubData.fli) },
            'NJ UI/HC/WF': { current: stubData.ui_hc_wf, ytd: add(stubData.ytd.ui, stubData.ui_hc_wf) },
            'Health Insurance': { current: toBig(formData.healthInsurance), ytd: add(stubData.ytd.other, toBig(formData.healthInsurance)) },
            'Retirement/401k': { current: toBig(formData.retirement401k), ytd: add(stubData.ytd.other, toBig(formData.retirement401k)) }
        };

        for (const [name, values] of Object.entries(allDeductions)) {
            if (values.current.isPositive()) {
                deductionsBody.innerHTML += `
                    <tr>
                        <td data-label="Deduction">${name}</td>
                        <td data-label="Current">${formatCurrency(values.current)}</td>
                        <td data-label="YTD">${formatCurrency(values.ytd)}</td>
                    </tr>`;
            }
        }

        // Summary Section
        getEl('#livePreviewGrossCurrent').textContent = formatCurrency(stubData.grossPay);
        getEl('#livePreviewGrossYtd').textContent = formatCurrency(add(stubData.ytd.gross, stubData.grossPay));
        getEl('#livePreviewDeductionsCurrent').textContent = formatCurrency(stubData.totalDeductions);
        getEl('#livePreviewDeductionsYtd').textContent = formatCurrency(add(stubData.ytd.federal, stubData.ytd.ss, stubData.ytd.medicare, stubData.ytd.state, stubData.ytd.sdi, stubData.ytd.fli, stubData.ytd.ui, stubData.ytd.other, stubData.totalDeductions));
        getEl('#livePreviewNetCurrent').textContent = formatCurrency(stubData.netPay);
        getEl('#livePreviewNetYtd').textContent = formatCurrency(add(stubData.ytd.gross, stubData.grossPay, -stubData.totalDeductions, -add(stubData.ytd.federal, stubData.ytd.ss, stubData.ytd.medicare, stubData.ytd.state, stubData.ytd.sdi, stubData.ytd.fli, stubData.ytd.ui, stubData.ytd.other)));


        // Bottom Summary Bar
        dom.summaryGrossPay.textContent = formatCurrency(stubData.grossPay);
        dom.summaryTotalDeductions.textContent = formatCurrency(stubData.totalDeductions);
        dom.summaryNetPay.textContent = formatCurrency(stubData.netPay);

        // UI Controls
        dom.previewStubIndicator.textContent = `(Previewing Stub: ${index + 1} of ${numStubs})`;
        dom.previewNavControls.style.display = numStubs > 1 ? 'flex' : 'none';
        dom.prevStubBtn.disabled = index === 0;
        dom.nextStubBtn.disabled = index === numStubs - 1;
    };
    
    // --- UI Handlers & Event Listeners Setup --- //

    function handleFinalSubmit() {
        if (!validateFullForm()) return;
        
        dom.mainFormContent.style.display = 'none';
        dom.reviewAndGenerateBtn.style.display = 'none';
        
        const reviewContainer = dom.reviewPreviewContainer;
        reviewContainer.innerHTML = '';
        const previewClone = dom.paystubPreviewContent.cloneNode(true);
        reviewContainer.appendChild(previewClone);

        renderPreviewForIndex(0, previewClone);
        dom.reviewSection.style.display = 'block';
        window.scrollTo(0, 0);
    }
    
    function handleEditInfo() {
        dom.reviewSection.style.display = 'none';
        dom.mainFormContent.style.display = 'block';
        dom.reviewAndGenerateBtn.style.display = 'block';
    }

    function handleProceedToPayment() {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        const pricingInfo = PRICING[numStubs] || PRICING[1];
        currentBasePrice = pricingInfo.price;
        dom.totalPaymentAmount.textContent = formatCurrency(currentBasePrice);
        dom.paymentDiscountNote.textContent = pricingInfo.note;
        dom.paymentModal.style.display = 'flex';
        activeModal = dom.paymentModal;
    }

    function handlePaymentConfirmationSubmit() {
        if (!validateField(dom.cashAppTxId) || !validateField(dom.paymentScreenshot)) return;
        dom.paymentInstructions.style.display = 'none';
        dom.modalOrderSuccessMessage.style.display = 'block';
        dom.successUserEmailInline.textContent = dom.userEmail.value;
    }
    
    function closeModal(modal) {
        if (!modal) return;
        modal.style.display = 'none';
        activeModal = null;
    }

    function populateStateDropdowns() {
        [dom.companyState, dom.employeeState].forEach(dropdown => {
            if (!dropdown) return;
            const defaultNj = dropdown.id === 'employeeState';
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
            if (defaultNj) dropdown.value = 'New Jersey';
        });
    }

    function generatePdfPreview() {
        if (allStubsData.length === 0) {
            showNotification('Please generate stub data first by filling out the form.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('WATERMARK - SIMULATION ONLY', 105, 140, null, null, 'center');

        allStubsData.forEach((stub, index) => {
            if (index > 0) doc.addPage();
            doc.setFontSize(18);
            doc.text(`Earnings Statement - Stub ${index + 1} of ${allStubsData.length}`, 14, 22);
            
            const bodyData = [
                ['Gross Pay', formatCurrency(stub.grossPay)],
                ['Federal Tax', formatCurrency(stub.federalTax)],
                ['Social Security', formatCurrency(stub.socialSecurity)],
                ['Medicare', formatCurrency(stub.medicare)],
                ['NJ State Tax', formatCurrency(stub.stateTax)],
                ['NJ SDI/FLI/UI', formatCurrency(add(stub.sdi, stub.fli, stub.ui_hc_wf))],
                ['Other Deductions', formatCurrency(stub.otherDeductions)],
                ['', ''],
                ['Net Pay', formatCurrency(stub.netPay)]
            ];

            doc.autoTable({
                startY: 30,
                head: [['Description', 'Amount']],
                body: bodyData,
                theme: 'striped',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [41, 128, 186] },
                didDrawCell: (data) => {
                    if (data.section === 'body' && data.row.index === bodyData.length - 1) {
                        doc.setFont(undefined, 'bold');
                    }
                }
            });
        });

        if (dom.pdfPreviewFrame && dom.pdfPreviewModal) {
            dom.pdfPreviewFrame.src = doc.output('datauristring');
            dom.pdfPreviewModal.style.display = 'flex';
            activeModal = dom.pdfPreviewModal;
        }
    }

    const initializeEventListeners = () => {
        dom.populateDetailsBtn.addEventListener('click', debouncedUpdateLivePreview);
        dom.reviewAndGenerateBtn.addEventListener('click', handleFinalSubmit);
        dom.editInfoBtn.addEventListener('click', handleEditInfo);
        dom.proceedToPaymentBtn.addEventListener('click', handleProceedToPayment);
        dom.resetAllFieldsBtn.addEventListener('click', () => { if (confirm("Reset all fields?")) { dom.paystubForm.reset(); debouncedUpdateLivePreview(); } });
        dom.previewPdfWatermarkedBtn.addEventListener('click', generatePdfPreview);
        
        dom.allFormInputs.forEach(input => {
            input.addEventListener('input', debouncedUpdateLivePreview);
            input.addEventListener('blur', () => validateField(input));
            
            if (input.classList.contains('currency-input')) {
                input.addEventListener('blur', (e) => e.target.value = formatCurrency(e.target.value));
            }
        });
        
        dom.autoCalcFields.forEach(field => {
            field.addEventListener('input', () => field.dataset.isAuto = 'false');
        });
        
        dom.companyPhone.addEventListener('input', (e) => e.target.value = formatPhoneNumber(e.target.value));
        [dom.companyZip, dom.employeeZip].forEach(el => el.addEventListener('input', (e) => e.target.value = formatZip(e.target.value)));
        dom.employeeSsn.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));
        dom.employeeSsn.addEventListener('blur', (e) => e.target.value = e.target.value.slice(0, 4));

        dom.employeeState.addEventListener('change', (e) => {
            dom.stateWarning.style.display = e.target.value !== 'New Jersey' ? 'block' : 'none';
            debouncedUpdateLivePreview();
        });

        dom.startYtdFromBatch.addEventListener('change', () => {
            dom.initialYtdFieldsContainer.style.display = dom.startYtdFromBatch.checked ? 'none' : 'block';
        });

        dom.prevStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex > 0) { currentPreviewStubIndex--; renderPreviewForIndex(currentPreviewStubIndex); }});
        dom.nextStubBtn.addEventListener('click', () => { if (currentPreviewStubIndex < allStubsData.length - 1) { currentPreviewStubIndex++; renderPreviewForIndex(currentPreviewStubIndex); }});
        
        dom.confirmPaymentBtn.addEventListener('click', handlePaymentConfirmationSubmit);
        [dom.closePaymentModalBtn, dom.closeNotificationModalBtn, dom.closeSuccessMessageBtn, dom.closePdfModalBtn].forEach(btn => {
            if(btn) btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
        });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeModal) closeModal(activeModal); });

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
        paystubEngine.init().then(() => {
            console.log('Paystub Engine Initialized with 2025 Tax Data.');
            populateStateDropdowns();
            initializeEventListeners();
            // Set a default pay date for initial calculation
            const today = new Date();
            dom.payDate.value = today.toISOString().split('T')[0];
            debouncedUpdateLivePreview();
        });
    };

    initializeApp();
});
