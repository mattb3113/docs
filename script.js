/*
    BuellDocs Paystub Generator v4.0 - script.js
    Author: Gemini
    Date: June 7, 2025
    Project: BuellDocs Client-Side Paystub Generator - Functional Overhaul
    Description: Complete functional overhaul. Implements a robust multi-step navigation
                 system, fixes all known calculation bugs (especially for dates and YTD figures),
                 and automates the user experience based on detailed requirements.
*/
'use strict';

import PDFGenerator from './js/pdf-generator.js';
import FormManager from './js/form-manager.js';
import UIController from './js/ui-controller.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management --- //
    let currentStep = 1;
    let currentPreviewStubIndex = 0;
    let allStubsData = [];
    let activeModal = null;
    let currentBasePrice = 0;

    const pdfGenerator = new PDFGenerator();
    const formManager = new FormManager('paystubForm');
    const uiController = new UIController({ formManager, pdfGenerator });

    // --- DOM Element Cache --- //
    const dom = {};
    const elementIds = [
        'paystubForm', 'step1', 'step2', 'step3', 'step4',
        'prevStepBtn', 'nextStepBtn', 'proceedToPaymentBtn',
        'formSummaryError', 'numPaystubs', 'resetAllFieldsBtn',
        'annualSalary', 'payFrequency', 'employmentStartDate', 'payDate',
        'companyName', 'companyPhone', 'companyStreetAddress', 'companyCity', 'companyState', 'companyZip',
        'employeeFullName', 'employeeSsn', 'employeeStreetAddress', 'employeeCity', 'employeeState', 'employeeZip',
        'federalTaxAmount', 'socialSecurityAmount', 'medicareAmount', 'stateTaxAmount',
        'healthInsurance', 'retirement401k',
        'startYtdFromBatch',
        'includeVoidedCheck', 'userEmail', 'userNotes',
        'previewDisplaySection', 'summaryGrossPay', 'summaryTotalDeductions', 'summaryNetPay',
        'previewStubIndicator', 'previewNavControls', 'prevStubBtn', 'nextStubBtn', 'paystubPreviewContent',
        'livePreviewCompanyName', 'livePreviewCompanyAddress1', 'livePreviewCompanyAddress2', 'livePreviewCompanyPhone',
        'livePreviewStubXofY',
        'livePreviewEmployeeName', 'livePreviewEmployeeAddress1', 'livePreviewEmployeeAddress2', 'livePreviewEmployeeSsn',
        'livePreviewPayPeriodStart', 'livePreviewPayPeriodEnd', 'livePreviewPayDate',
        'livePreviewEarningsBody', 'livePreviewDeductionsBody',
        'livePreviewGrossCurrent', 'livePreviewGrossYtd',
        'livePreviewDeductionsCurrent', 'livePreviewDeductionsYtd',
        'livePreviewNetCurrent', 'livePreviewNetYtd',
        'livePreviewVoidedCheckContainer',
        'paymentModal', 'closePaymentModalBtn', 'totalPaymentAmount',
        'requestHardCopy', 'requestExcel', 'paymentScreenshot',
        'confirmPaymentBtn', 'modalOrderSuccessMessage',
        'stateWarning', 'stepIndicator', 'reviewPreviewContainer'
    ];
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) dom[id] = el;
    });
    dom.allFormInputs = document.querySelectorAll('#paystubForm input, #paystubForm select, #paystubForm textarea');
    dom.currencyInputs = document.querySelectorAll('.currency-input');
    dom.formSteps = document.querySelectorAll('.form-step');

    // --- Constants --- //
    const PAY_PERIODS_PER_YEAR = { 'Weekly': 52, 'Bi-Weekly': 26, 'Semi-Monthly': 24, 'Monthly': 12 };
    const PRICING = {
        1: 29.99,
        2: 54.99,
        3: 79.99,
        4: 99.99, // New pricing
        5: 114.99 // New pricing
    };
    const ADDON_PRICES = {
        hardCopy: 19.99,
        excel: 9.99
    };
    const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

    // --- Utility & Formatting Functions --- //
    const toBig = (v) => math.bignumber(String(v || 0).replace(/[^0-9.-]+/g, ''));
    const { add, subtract, multiply, divide } = math;

    const formatCurrency = (value) => {
        const num = toBig(value).toNumber();
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    };

    const formatPhoneNumber = (value) => {
        const digits = String(value).replace(/\D/g, '').slice(0, 10);
        if (!digits) return '';
        const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
        return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits;
    };

    const formatZip = (value) => String(value).replace(/\D/g, '').slice(0, 5);

    const formatSsnForPreview = (value) => {
        const last4 = String(value).replace(/\D/g, '').slice(-4);
        return last4 ? `XXX-XX-${last4}` : 'XXX-XX-XXXX';
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // --- Multi-Step Form Navigation --- //
    const updateStepUI = () => {
        dom.formSteps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step${currentStep}`).classList.add('active');

        dom.stepIndicator.textContent = `Step ${currentStep} of 4`;
        dom.prevStepBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        dom.nextStepBtn.style.display = currentStep < 4 ? 'inline-block' : 'none';
        dom.proceedToPaymentBtn.style.display = currentStep === 4 ? 'inline-block' : 'none';
    };

    const validateField = (input) => {
        // Skip validation for hidden fields
        if (!input.offsetParent && input.type !== 'hidden') return true;

        let isValid = true;
        const errorSpanId = input.getAttribute('aria-describedby');
        const errorSpan = errorSpanId ? document.getElementById(errorSpanId) : null;
        let errorMessage = '';

        input.classList.remove('invalid');
        if (errorSpan) errorSpan.textContent = '';

        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            const label = document.querySelector(`label[for='${input.id}']`);
            errorMessage = `${label?.textContent.replace(' *', '').trim() || 'This field'} is required.`;
        } else if (input.type === 'email' && input.value && !/^\S+@\S+\.\S+$/.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        } else if (input.pattern && !new RegExp(input.pattern).test(input.value)) {
            isValid = false;
            errorMessage = `Invalid format.`;
        }

        if (!isValid) {
            if (errorSpan) errorSpan.textContent = errorMessage;
            input.classList.add('invalid');
        }
        return isValid;
    };

    const validateCurrentStep = () => {
        const currentStepPanel = document.getElementById(`step${currentStep}`);
        const inputsToValidate = currentStepPanel.querySelectorAll('input[required], select[required], textarea[required]');
        let isStepValid = true;
        inputsToValidate.forEach(input => {
            if (!validateField(input)) {
                isStepValid = false;
            }
        });

        if (!isStepValid) {
            dom.formSummaryError.textContent = 'Please correct the highlighted fields before continuing.';
            dom.formSummaryError.style.display = 'block';
            const firstInvalid = currentStepPanel.querySelector('.invalid');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            dom.formSummaryError.style.display = 'none';
        }

        return isStepValid;
    };

    // --- Core Calculation & Date Logic --- //
    const getNextPayDate = (currentDate, frequency) => {
        let nextDate = new Date(currentDate.getTime()); // Clone the date
        switch (frequency) {
            case 'Weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'Bi-Weekly':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'Semi-Monthly':
                if (nextDate.getDate() === 15) {
                    // Move to the last day of the current month
                    nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
                } else {
                    // Was end of month, move to 15th of next month
                    nextDate.setDate(15);
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                break;
            case 'Monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        return nextDate;
    };

    const getPeriodDates = (payDate, frequency) => {
        const payPeriodEndDate = new Date(payDate.getTime());
        let payPeriodStartDate = new Date(payDate.getTime());

        switch (frequency) {
            case 'Weekly':
                payPeriodStartDate.setDate(payPeriodStartDate.getDate() - 6);
                break;
            case 'Bi-Weekly':
                payPeriodStartDate.setDate(payPeriodStartDate.getDate() - 13);
                break;
            case 'Semi-Monthly':
                if (payPeriodEndDate.getDate() === 15) {
                    payPeriodStartDate.setDate(1);
                } else { // End of month
                    payPeriodStartDate.setDate(16);
                }
                break;
            case 'Monthly':
                payPeriodStartDate.setDate(1);
                break;
        }
        return { payPeriodStartDate, payPeriodEndDate };
    };

    const calculateAllStubsData = () => {
        if (!window.paystubEngine) return;
        const formData = Object.fromEntries(new FormData(dom.paystubForm));

        const numStubs = parseInt(formData.numPaystubs, 10);
        const payFrequency = formData.payFrequency;
        const payPeriodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];
        const grossPerPeriod = divide(formData.annualSalary, payPeriodsPerYear);
        const firstPayDateStr = formData.payDate;

        if (!firstPayDateStr || !payFrequency) return [];

        allStubsData = [];
        let runningPayDate = new Date(firstPayDateStr + 'T00:00:00');

        // Initialize YTD totals
        let ytd = {
            gross: toBig(0),
            federal: toBig(0),
            ss: toBig(0),
            medicare: toBig(0),
            state: toBig(0),
            sdi: toBig(0),
            fli: toBig(0),
            ui_hc_wf: toBig(0),
            health: toBig(0),
            retirement: toBig(0),
        };

        for (let i = 0; i < numStubs; i++) {
            const periodDates = getPeriodDates(runningPayDate, payFrequency);
            const healthDeduction = toBig(formData.healthInsurance);
            const retirementDeduction = toBig(formData.retirement401k);
            const otherDeductions = add(healthDeduction, retirementDeduction);

            const inputs = {
                grossPerPeriod: grossPerPeriod,
                ytdGross: ytd.gross,
                payPeriods: payPeriodsPerYear,
                filingStatus: 'Single', // Assuming single for now, can be dynamic
                otherDeductions: otherDeductions,
                isNj: formData.employeeState === 'New Jersey'
            };

            const currentCalcs = paystubEngine.calculate(inputs);

            // Snapshot YTD *before* this period's addition
            const ytdSnapshot = { ...ytd };

            // Create stub data object for rendering
            const currentStubData = {
                ...currentCalcs,
                payDate: new Date(runningPayDate.getTime()),
                ...periodDates,
                healthInsurance: healthDeduction,
                retirement401k: retirementDeduction,
                ytd: ytdSnapshot
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
            ytd.ui_hc_wf = add(ytd.ui_hc_wf, currentCalcs.ui_hc_wf);
            ytd.health = add(ytd.health, healthDeduction);
            ytd.retirement = add(ytd.retirement, retirementDeduction);

            // Set up date for next loop
            runningPayDate = getNextPayDate(runningPayDate, payFrequency);
        }
        return allStubsData;
    };


    // --- Live Preview & Rendering --- //
    const renderPreviewForIndex = (index) => {
        const numStubs = parseInt(dom.numPaystubs.value, 10);
        if (index < 0 || index >= numStubs || !allStubsData[index]) {
            return;
        }
        currentPreviewStubIndex = index;
        const stubData = allStubsData[index];
        const formData = Object.fromEntries(new FormData(dom.paystubForm));
        const formatDate = (date) => date.toISOString().split('T')[0];

        // Company & Employee Info
        dom.livePreviewCompanyName.textContent = formData.companyName || 'Your Company Name';
        dom.livePreviewCompanyAddress1.textContent = formData.companyStreetAddress || '123 Main St';
        dom.livePreviewCompanyAddress2.textContent = `${formData.companyCity || 'Anytown'}, ${formData.companyState || 'ST'} ${formData.companyZip || '12345'}`;
        dom.livePreviewCompanyPhone.textContent = formData.companyPhone ? `Phone: ${formatPhoneNumber(formData.companyPhone)}` : '';
        dom.livePreviewEmployeeName.textContent = formData.employeeFullName || 'Employee Name';
        dom.livePreviewEmployeeAddress1.textContent = formData.employeeStreetAddress || '456 Employee Ave';
        dom.livePreviewEmployeeAddress2.textContent = `${formData.employeeCity || 'Workville'}, ${formData.employeeState || 'ST'} ${formData.employeeZip || '67890'}`;
        dom.livePreviewEmployeeSsn.textContent = formatSsnForPreview(formData.employeeSsn);

        // Pay Period Info
        dom.livePreviewPayDate.textContent = formatDate(stubData.payDate);
        dom.livePreviewPayPeriodStart.textContent = formatDate(stubData.payPeriodStartDate);
        dom.livePreviewPayPeriodEnd.textContent = formatDate(stubData.payPeriodEndDate);
        dom.livePreviewStubXofY.textContent = `Stub ${index + 1} of ${numStubs}`;

        // Earnings Table
        dom.livePreviewEarningsBody.innerHTML = `
            <tr>
                <td>Regular Salary</td>
                <td>--</td>
                <td>--</td>
                <td>${formatCurrency(stubData.grossPay)}</td>
                <td>${formatCurrency(add(stubData.ytd.gross, stubData.grossPay))}</td>
            </tr>`;

        // Deductions Table
        const deductionsBody = dom.livePreviewDeductionsBody;
        deductionsBody.innerHTML = '';
        const deductions = [
            { label: 'Federal Tax', current: stubData.federalTax, ytd: add(stubData.ytd.federal, stubData.federalTax) },
            { label: 'Social Security', current: stubData.socialSecurity, ytd: add(stubData.ytd.ss, stubData.socialSecurity) },
            { label: 'Medicare', current: stubData.medicare, ytd: add(stubData.ytd.medicare, stubData.medicare) },
            { label: 'NJ State Tax', current: stubData.stateTax, ytd: add(stubData.ytd.state, stubData.stateTax) },
            { label: 'Health Insurance', current: stubData.healthInsurance, ytd: add(stubData.ytd.health, stubData.healthInsurance) },
            { label: 'Retirement/401k', current: stubData.retirement401k, ytd: add(stubData.ytd.retirement, stubData.retirement401k) }
        ];
        deductions.forEach(d => {
            if (d.current.isPositive()) {
                deductionsBody.innerHTML += `
                    <tr>
                        <td>${d.label}</td>
                        <td>${formatCurrency(d.current)}</td>
                        <td>${formatCurrency(d.ytd)}</td>
                    </tr>`;
            }
        });

        // Totals
        const totalCurrentDeductions = stubData.totalDeductions;
        const totalYtdDeductions = add(stubData.ytd.federal, stubData.federalTax, stubData.ytd.ss, stubData.socialSecurity, stubData.ytd.medicare, stubData.medicare, stubData.ytd.state, stubData.stateTax, stubData.ytd.health, stubData.healthInsurance, stubData.ytd.retirement, stubData.retirement401k);

        dom.livePreviewGrossCurrent.textContent = formatCurrency(stubData.grossPay);
        dom.livePreviewGrossYtd.textContent = formatCurrency(add(stubData.ytd.gross, stubData.grossPay));
        dom.livePreviewDeductionsCurrent.textContent = formatCurrency(totalCurrentDeductions);
        dom.livePreviewDeductionsYtd.textContent = formatCurrency(totalYtdDeductions);
        dom.livePreviewNetCurrent.textContent = formatCurrency(stubData.netPay);
        dom.livePreviewNetYtd.textContent = formatCurrency(subtract(add(stubData.ytd.gross, stubData.grossPay), totalYtdDeductions));


        // Global Summary Bar
        dom.summaryGrossPay.textContent = formatCurrency(stubData.grossPay);
        dom.summaryTotalDeductions.textContent = formatCurrency(totalCurrentDeductions);
        dom.summaryNetPay.textContent = formatCurrency(stubData.netPay);

        // UI Controls
        dom.previewStubIndicator.textContent = `(Previewing Stub: ${index + 1} of ${numStubs})`;
        dom.previewNavControls.style.display = numStubs > 1 ? 'flex' : 'none';
        dom.prevStubBtn.disabled = index === 0;
        dom.nextStubBtn.disabled = index === numStubs - 1;
        dom.includeVoidedCheck.dispatchEvent(new Event('change')); // Refresh voided check visibility
    };

    const debouncedUpdateAndRender = debounce(() => {
        calculateAllStubsData();
        renderPreviewForIndex(currentPreviewStubIndex);
        // Also update the review container if we are on the last step
        if (currentStep === 4) {
            updateReviewStepPreview();
        }
    }, 250);

    const updateReviewStepPreview = () => {
        dom.reviewPreviewContainer.innerHTML = ''; // Clear previous
        const previewClone = dom.paystubPreviewContent.cloneNode(true);
        dom.reviewPreviewContainer.appendChild(previewClone);
        // The main preview is already updated by debouncedUpdateAndRender, so this clone is correct
    };

    // --- PDF Generation --- //
    const generatePdfBlob = (isWatermarked = true) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const formatDate = (date) => date.toLocaleDateString('en-US');
        const formData = Object.fromEntries(new FormData(dom.paystubForm));

        allStubsData.forEach((stub, index) => {
            if (index > 0) doc.addPage();

            // Header
            doc.setFontSize(16).setFont('helvetica', 'bold');
            doc.text(formData.companyName || 'Company', 14, 22);
            doc.setFontSize(12).setFont('helvetica', 'normal');
            doc.text('EARNINGS STATEMENT', 200, 22, { align: 'right' });
            doc.setFontSize(10);
            doc.text(formData.companyStreetAddress || '123 Main St', 14, 30);
            const addressLine2 = `${formData.companyCity || 'City'}, ${formData.companyState || 'ST'} ${formData.companyZip || 'ZIP'}`;
            doc.text(addressLine2, 14, 36);

            // Employee and Pay Period Info
            const infoTop = 50;
            doc.setFont('helvetica', 'bold');
            doc.text('Employee', 14, infoTop);
            doc.text('Pay Period', 110, infoTop);
            doc.setFont('helvetica', 'normal');
            doc.text(formData.employeeFullName, 14, infoTop + 6);
            doc.text(formatSsnForPreview(formData.employeeSsn), 14, infoTop + 12);

            doc.text(`Pay Date: ${formatDate(stub.payDate)}`, 110, infoTop + 6);
            const periodStr = `Period: ${formatDate(stub.payPeriodStartDate)} - ${formatDate(stub.payPeriodEndDate)}`;
            doc.text(periodStr, 110, infoTop + 12);


            // Earnings Table
            const earningsBody = [
                ['Regular Salary', '--', '--', formatCurrency(stub.grossPay), formatCurrency(add(stub.ytd.gross, stub.grossPay))]
            ];
            doc.autoTable({
                startY: infoTop + 25,
                head: [['Description', 'Rate', 'Hours', 'Current Period', 'Year-to-Date']],
                body: earningsBody,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 186] }
            });

            // Deductions Table
            const deductions = [
                ['Federal Tax', formatCurrency(stub.federalTax), formatCurrency(add(stub.ytd.federal, stubData.federalTax))],
                ['Social Security', formatCurrency(stub.socialSecurity), formatCurrency(add(stub.ytd.ss, stub.socialSecurity))],
                ['Medicare', formatCurrency(stub.medicare), formatCurrency(add(stub.ytd.medicare, stub.medicare))],
                ['Health Insurance', formatCurrency(stub.healthInsurance), formatCurrency(add(stub.ytd.health, stub.healthInsurance))],
                ['Retirement/401k', formatCurrency(stub.retirement401k), formatCurrency(add(stub.ytd.retirement, stub.retirement401k))],
            ];
            if (formData.employeeState === 'New Jersey') {
                 deductions.push(['NJ State Tax', formatCurrency(stub.stateTax), formatCurrency(add(stub.ytd.state, stub.stateTax))]);
            }

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 5,
                head: [['Deduction', 'Current Period', 'Year-to-Date']],
                body: deductions,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 186] }
            });

            // Summary Table
            const totalYtdDeductions = add(stub.ytd.federal, stub.federalTax, stub.ytd.ss, stub.socialSecurity, stub.ytd.medicare, stub.medicare, stub.ytd.state, stub.stateTax, stub.ytd.health, stub.healthInsurance, stub.ytd.retirement, stub.retirement401k);
            const summaryBody = [
                ['Gross Pay', formatCurrency(stub.grossPay), formatCurrency(add(stub.ytd.gross, stub.grossPay))],
                ['Deductions', formatCurrency(stub.totalDeductions), formatCurrency(totalYtdDeductions)],
                ['Net Pay', formatCurrency(stub.netPay), formatCurrency(subtract(add(stub.ytd.gross, stub.grossPay), totalYtdDeductions))]
            ];

             doc.autoTable({
                startY: doc.lastAutoTable.finalY + 5,
                head: [['Summary', 'Current', 'YTD']],
                body: summaryBody,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 186] },
                didParseCell: function (data) {
                    if (data.row.index >= 0 && data.section === 'body') {
                         data.cell.styles.fontStyle = 'bold';
                    }
                }
            });


            if (isWatermarked) {
                doc.setFontSize(80);
                doc.setTextColor(220, 220, 220);
                doc.text('BUELLDOCS', 105, 160, { align: 'center', angle: -45 });
                doc.setTextColor(0, 0, 0);
            }
        });

        return doc.output('blob');
    };


    // --- Event Listeners & Initialization --- //
    const initializeEventListeners = () => {
        // Form-wide live updates
        dom.allFormInputs.forEach(input => {
            input.addEventListener('input', debouncedUpdateAndRender);
            if (!input.classList.contains('currency-input')) {
                input.addEventListener('blur', () => validateField(input));
            }
        });

        // Input formatting
        dom.currencyInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                if (e.target.value) {
                    e.target.value = formatCurrency(e.target.value);
                }
                validateField(e.target);
            });
        });
        dom.companyPhone.addEventListener('input', (e) => e.target.value = formatPhoneNumber(e.target.value));
        [dom.companyZip, dom.employeeZip].forEach(el => el && el.addEventListener('input', (e) => e.target.value = formatZip(e.target.value)));
        dom.employeeSsn.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4));

        // Step navigation
        dom.nextStepBtn.addEventListener('click', () => {
            if (validateCurrentStep()) {
                currentStep++;
                if (currentStep === 4) {
                    updateReviewStepPreview();
                }
                updateStepUI();
            }
        });
        dom.prevStepBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepUI();
            }
        });
        
        // Preview navigation
        dom.prevStubBtn.addEventListener('click', () => renderPreviewForIndex(currentPreviewStubIndex - 1));
        dom.nextStubBtn.addEventListener('click', () => renderPreviewForIndex(currentPreviewStubIndex + 1));


        // Dynamic UI changes
        dom.employeeState.addEventListener('change', (e) => {
            const isNj = e.target.value === 'New Jersey';
            dom.stateWarning.style.display = isNj ? 'none' : 'block';
            // In a real app with more states, you'd hide/show more fields
            // For now, this just affects the warning and calculation
            debouncedUpdateAndRender();
        });

        dom.includeVoidedCheck.addEventListener('change', (e) => {
            dom.livePreviewVoidedCheckContainer.style.display = e.target.checked ? 'block' : 'none';
        });

        // Payment Modal Logic
        const updatePaymentTotal = () => {
            const numStubs = parseInt(dom.numPaystubs.value, 10);
            currentBasePrice = PRICING[numStubs] || 0;
            let total = currentBasePrice;
            if (dom.requestHardCopy.checked) total += ADDON_PRICES.hardCopy;
            if (dom.requestExcel.checked) total += ADDON_PRICES.excel;
            dom.totalPaymentAmount.textContent = formatCurrency(total);
        };
        dom.proceedToPaymentBtn.addEventListener('click', () => {
            updatePaymentTotal();
            dom.paymentModal.style.display = 'flex';
        });
        dom.closePaymentModalBtn.addEventListener('click', () => dom.paymentModal.style.display = 'none');
        dom.requestHardCopy.addEventListener('change', updatePaymentTotal);
        dom.requestExcel.addEventListener('change', updatePaymentTotal);
        dom.numPaystubs.addEventListener('change', updatePaymentTotal);

        // Reset
        dom.resetAllFieldsBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset all fields?")) {
                dom.paystubForm.reset();
                // Manually trigger change events for proper UI updates
                dom.employeeState.dispatchEvent(new Event('change'));
                debouncedUpdateAndRender();
            }
        });

        // Dummy PDF preview button for sidebar
        const previewPdfBtn = document.createElement('button');
        previewPdfBtn.id = 'previewPdfWatermarkedBtn';
        previewPdfBtn.className = 'btn btn-secondary btn-full-width';
        previewPdfBtn.textContent = 'Preview PDF';
        previewPdfBtn.style.marginTop = '15px';
        dom.resetAllFieldsBtn.parentElement.appendChild(previewPdfBtn);
        previewPdfBtn.addEventListener('click', () => {
             const pdfBlob = generatePdfBlob(true);
             window.open(URL.createObjectURL(pdfBlob));
        });

        if (dom.confirmPaymentBtn) {
            dom.confirmPaymentBtn.addEventListener('click', () => {
                pdfGenerator.generate(
                    dom.paystubPreviewContent,
                    dom.employeeFullName.value,
                    dom.payDate.value
                );
            });
        }

    };

    const initializeApp = () => {
        // Load the tax calculation engine
        paystubEngine.init().then(() => {
            console.log('Paystub Engine Initialized with 2025 Tax Data.');

            // Populate state dropdowns
            US_STATES.forEach(state => {
                const option = new Option(state, state);
                dom.employeeState.add(option);
            });
            dom.employeeState.value = 'New Jersey'; // Default

            // Set default dates
            const today = new Date();
            dom.employmentStartDate.value = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            dom.payDate.value = today.toISOString().split('T')[0];


            initializeEventListeners();
            updateStepUI();
            debouncedUpdateAndRender(); // Initial calculation and render
        });
    };

    initializeApp();
});
