/**
 * @file ui-controller.js
 * @description Master orchestrator for the paystub generator's multi-step UI.
 * This script manages form navigation, live data processing, preview rendering,
 * and final PDF generation. It replaces previous disparate UI scripts.
 *
 * @version 2.0.0
 * @author Gemini
 * @date 2025-06-08
 */

// Assuming these modules are imported via <script type="module"> in index.html
// Make sure the paths are correct in your HTML file.
import { calculatePaystub } from './paystub-calculator.js';
import { generatePdf } from './pdf-generator.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. STATE MANAGEMENT ---
    let currentStep = 0;
    let taxData = null; // Will hold the fetched tax tables.

    // --- 2. DOM ELEMENT REFERENCES ---
    const DOMElements = {
        form: document.getElementById('paystub-form'),
        steps: document.querySelectorAll('.form-step'),
        nextBtn: document.getElementById('next-btn'),
        prevBtn: document.getElementById('prev-btn'),
        finalizeBtn: document.getElementById('finalize-btn'), // The final submission button
        previewContainer: document.getElementById('paystub-preview-container'),
        stepIndicator: document.getElementById('step-indicator'),
        formContainer: document.querySelector('.form-container'), // Assumes form is in a container
        resultContainer: document.querySelector('.result-container'), // Assumes a container for the final result
    };

    // --- 3. INITIALIZATION ---

    /**
     * Fetches tax data and sets up the initial UI state and event listeners.
     */
    async function initialize() {
        // Show a loading state
        DOMElements.form.classList.add('loading');

        try {
            const response = await fetch('data/taxTables.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            taxData = await response.json();
            console.log("Tax tables loaded successfully.");

            // Setup event listeners now that data is loaded
            setupEventListeners();
            updateStepUI();
            updatePreview(); // Initial preview render

        } catch (error) {
            console.error("Failed to load tax tables:", error);
            DOMElements.previewContainer.innerHTML = `<div class="text-red-500 text-center p-4"><b>Error:</b> Could not load critical tax data. The application cannot continue. Please refresh the page.</div>`;
            // Disable all controls if loading fails
            DOMElements.nextBtn.disabled = true;
            DOMElements.prevBtn.disabled = true;
            return; // Stop execution
        } finally {
            // Remove loading state
            DOMElements.form.classList.remove('loading');
        }
    }

    // --- 4. EVENT HANDLING ---

    /**
     * Centralizes all event listener assignments.
     */
    function setupEventListeners() {
        DOMElements.nextBtn.addEventListener('click', handleNextStep);
        DOMElements.prevBtn.addEventListener('click', handlePrevStep);
        DOMElements.finalizeBtn.addEventListener('click', handleFinalization);

        // Listen for any input change on the form for live preview updates
        DOMElements.form.addEventListener('input', updatePreview);
    }

    /**
     * Moves to the next step in the form.
     */
    function handleNextStep() {
        if (currentStep < DOMElements.steps.length - 1) {
            currentStep++;
            updateStepUI();
        }
    }

    /**
     * Moves to the previous step in the form.
     */
    function handlePrevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateStepUI();
        }
    }

    /**
     * Handles the final step: generating the PDF.
     */
    function handleFinalization() {
        console.log("Finalizing and creating PDF...");
        // The preview is already up-to-date, so we just call the PDF generator.
        const employeeName = document.getElementById('employee-name')?.value || 'employee';
        const payDate = document.getElementById('pay-date')?.value || new Date().toISOString().split('T')[0];
        const fileName = `Paystub-${employeeName.replace(/ /g, '_')}-${payDate}.pdf`;
        
        generatePdf(DOMElements.previewContainer, fileName);
    }

    // --- 5. UI & PREVIEW LOGIC ---

    /**
     * Updates the visibility of form steps and navigation buttons.
     */
    function updateStepUI() {
        // Update step visibility
        DOMElements.steps.forEach((step, index) => {
            step.classList.toggle('active-step', index === currentStep);
        });

        // Update button visibility
        DOMElements.prevBtn.classList.toggle('hidden', currentStep === 0);
        DOMElements.nextBtn.classList.toggle('hidden', currentStep === DOMElements.steps.length - 1);
        DOMElements.finalizeBtn.classList.toggle('hidden', currentStep !== DOMElements.steps.length - 1);

        // Update step indicator text
        if (DOMElements.stepIndicator) {
            DOMElements.stepIndicator.textContent = `Step ${currentStep + 1} of ${DOMElements.steps.length}`;
        }
    }

    /**
     * Gathers form data, calculates paystub, and renders the live preview.
     */
    async function updatePreview() {
        if (!taxData) return; // Don't run if tax data isn't loaded

        // a. Gather all data from the form
        const formData = getFormData();

        // b. Calculate the paystub using the engine
        const calculatedData = await calculatePaystub(formData, taxData);

        // c. Render the HTML preview
        renderPreview(formData, calculatedData);
    }

    /**
     * Collects and sanitizes all data from the form inputs.
     * @returns {object} A structured object with all form values.
     */
    function getFormData() {
        const data = {
            // Company Info
            companyName: document.getElementById('company-name')?.value || 'Your Company',
            companyAddress: document.getElementById('company-address')?.value || '123 Main St, Anytown, USA',
            // Employee Info
            employeeName: document.getElementById('employee-name')?.value || 'John Doe',
            employeeAddress: document.getElementById('employee-address')?.value || '456 Oak Ave, Anytown, USA',
            employeeId: document.getElementById('employee-id')?.value || 'N/A',
            // Pay Details
            payPeriodStart: document.getElementById('pay-period-start')?.value,
            payPeriodEnd: document.getElementById('pay-period-end')?.value,
            payDate: document.getElementById('pay-date')?.value,
            payRate: parseFloat(document.getElementById('pay-rate')?.value) || 0,
            regularHours: parseFloat(document.getElementById('regular-hours')?.value) || 0,
            overtimeHours: parseFloat(document.getElementById('overtime-hours')?.value) || 0,
            // Withholding
            filingStatus: document.getElementById('federal-filing-status')?.value || 'single',
            federalAllowances: parseInt(document.getElementById('federal-allowances')?.value, 10) || 0,
            njAllowances: parseInt(document.getElementById('nj-allowances')?.value, 10) || 0,
            // Deductions & YTD
            otherDeductionName: document.getElementById('deduction-name-1')?.value,
            otherDeductionAmount: parseFloat(document.getElementById('deduction-amount-1')?.value) || 0,
            ytd: { // Encapsulate YTD figures
                gross: parseFloat(document.getElementById('ytd-gross')?.value) || 0,
                federalTax: parseFloat(document.getElementById('ytd-federal-tax')?.value) || 0,
            }
        };
        // The calculator expects a more detailed YTD object, so we pass what we have.
        // The calculator should handle missing YTD fields gracefully.
        return data;
    }

    /**
     * Renders the complete paystub HTML into the preview container.
     * @param {object} formData - The raw data from the form.
     * @param {object} calculatedData - The data processed by the calculation engine.
     */
    function renderPreview(formData, calculatedData) {
        if (!calculatedData) {
            DOMElements.previewContainer.innerHTML = `<div class="text-gray-500 text-center p-4">Enter details to see a live preview.</div>`;
            return;
        }

        const formatCurrency = (num = 0) => num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        const { earnings, taxes, totals, newYTD } = calculatedData;
        
        const html = `
            <div class="paystub-render bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <!-- Header -->
                <div class="text-center border-b pb-4 mb-4">
                    <h2 class="text-2xl font-bold">${formData.companyName}</h2>
                    <p class="text-sm text-gray-600">${formData.companyAddress}</p>
                </div>

                <!-- Employee & Pay Info -->
                <div class="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                        <p><strong>Employee:</strong> ${formData.employeeName}</p>
                        <p>${formData.employeeAddress}</p>
                        <p><strong>Employee ID:</strong> ${formData.employeeId}</p>
                    </div>
                    <div class="text-right">
                        <p><strong>Pay Date:</strong> ${formData.payDate}</p>
                        <p><strong>Period:</strong> ${formData.payPeriodStart} to ${formData.payPeriodEnd}</p>
                    </div>
                </div>

                <!-- Earnings, Taxes, Deductions Tables -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Left Column: Earnings & Deductions -->
                    <div>
                        <h3 class="font-bold text-lg mb-2">Earnings</h3>
                        <table class="w-full text-sm table-auto">
                            <tbody>
                                <tr><td>Regular Pay</td><td class="text-right">${formatCurrency(earnings.regularPay)}</td></tr>
                                <tr><td>Overtime Pay</td><td class="text-right">${formatCurrency(earnings.otPay)}</td></tr>
                                <tr class="font-bold border-t"><td class="pt-1">Gross Pay</td><td class="text-right pt-1">${formatCurrency(totals.grossPay)}</td></tr>
                            </tbody>
                        </table>

                        <h3 class="font-bold text-lg mt-4 mb-2">Deductions</h3>
                        <table class="w-full text-sm table-auto">
                           <tbody>
                                ${formData.otherDeductionName ? `<tr><td>${formData.otherDeductionName}</td><td class="text-right">${formatCurrency(formData.otherDeductionAmount)}</td></tr>` : ''}
                                <tr class="font-bold border-t"><td class="pt-1">Total Deductions</td><td class="text-right pt-1">${formatCurrency(totals.totalDeductions)}</td></tr>
                           </tbody>
                        </table>
                    </div>

                    <!-- Right Column: Taxes & YTD -->
                    <div>
                         <h3 class="font-bold text-lg mb-2">Taxes</h3>
                         <table class="w-full text-sm table-auto">
                            <thead><tr class="text-gray-500"><th class="text-left">Description</th><th class="text-right">Current</th><th class="text-right">YTD</th></tr></thead>
                            <tbody>
                                <tr><td>Federal Income Tax</td><td class="text-right">${formatCurrency(taxes.federal.income)}</td><td class="text-right">${formatCurrency(newYTD.federalTax)}</td></tr>
                                <tr><td>Social Security</td><td class="text-right">${formatCurrency(taxes.federal.socialSecurity)}</td><td class="text-right">${formatCurrency(newYTD.socialSecurity)}</td></tr>
                                <tr><td>Medicare</td><td class="text-right">${formatCurrency(taxes.federal.medicare)}</td><td class="text-right">${formatCurrency(newYTD.medicare)}</td></tr>
                                <tr><td>NJ State Tax</td><td class="text-right">${formatCurrency(taxes.nj.income)}</td><td class="text-right">${formatCurrency(newYTD.njStateTax)}</td></tr>
                                <tr><td>NJ SDI</td><td class="text-right">${formatCurrency(taxes.nj.sdi)}</td><td class="text-right">${formatCurrency(newYTD.sdi)}</td></tr>
                                <tr><td>NJ FLI</td><td class="text-right">${formatCurrency(taxes.nj.fli)}</td><td class="text-right">${formatCurrency(newYTD.fli)}</td></tr>
                                <tr><td>NJ SUI/WF</td><td class="text-right">${formatCurrency(taxes.nj.sui)}</td><td class="text-right">${formatCurrency(newYTD.sui)}</td></tr>
                            </tbody>
                         </table>
                    </div>
                </div>

                <!-- Summary -->
                <div class="mt-6 pt-4 border-t-2 border-gray-800 text-right">
                    <p class="text-sm">Gross Pay: ${formatCurrency(totals.grossPay)}</p>
                    <p class="text-sm">Total Deductions: ${formatCurrency(totals.totalDeductions)}</p>
                    <p class="text-xl font-bold mt-2">Net Pay: ${formatCurrency(totals.netPay)}</p>
                </div>
            </div>
        `;

        DOMElements.previewContainer.innerHTML = html;
    }


    // --- 6. START THE APPLICATION ---
    initialize();

});
