/**
 * @file main.js
 * @description The main UI controller for the Paystub Calculator application.
 * This script initializes the application, handles user input, orchestrates
 * calculations, and updates the UI with the results. It replaces all previous
 * UI-related scripts (form-manager, pdf-generator, preview-updater, ui-controller).
 */

// Import necessary modules. Ensure these paths are correct in your index.html
// Note: In a real module-based project, you would use:
// import { dataService } from './data-service.js';
// import { calculatePaystub } from './paystub-calculator.js';
// For this project, we'll assume they are loaded globally via <script> tags.

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATE AND ELEMENT REFERENCES ---
    let taxRates = null; // To store the fetched tax rates

    // Form and input elements
    const paystubForm = document.getElementById('paystub-form');
    const employeeNameInput = document.getElementById('employee-name');
    const payRateInput = document.getElementById('pay-rate');
    const hoursWorkedInput = document.getElementById('hours-worked');
    const payFrequencyInput = document.getElementById('pay-frequency');
    const filingStatusInput = document.getElementById('filing-status');
    const allowancesInput = document.getElementById('allowances');

    // Output and action elements
    const paystubPreviewContainer = document.getElementById('paystub-preview-container');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const errorMessageContainer = document.createElement('div'); // For displaying errors
    errorMessageContainer.style.color = 'red';
    paystubForm.prepend(errorMessageContainer);


    // --- 2. INITIALIZATION ---

    /**
     * Initializes the application by fetching necessary data.
     */
    async function initialize() {
        try {
            // The dataService is expected to be available globally from data-service.js
            taxRates = await dataService.init();
            console.log('Tax rates loaded successfully.');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            errorMessageContainer.textContent = 'Error: Could not load tax rate data. Please try again later.';
        }
    }


    // --- 3. EVENT HANDLERS ---

    /**
     * Handles the form submission event.
     * @param {Event} event - The form submission event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault(); // Prevent the browser's default form submission
        errorMessageContainer.textContent = ''; // Clear previous errors

        if (!taxRates) {
            errorMessageContainer.textContent = 'Tax data is not loaded. Cannot calculate.';
            return;
        }

        try {
            // a. Collect and parse form data
            const employeeData = {
                name: employeeNameInput.value.trim(),
                payRate: parseFloat(payRateInput.value),
                hoursWorked: parseFloat(hoursWorkedInput.value),
                payFrequency: payFrequencyInput.value,
                filingStatus: filingStatusInput.value,
                allowances: parseInt(allowancesInput.value, 10)
            };

            // Basic validation
            if (!employeeData.name || isNaN(employeeData.payRate) || isNaN(employeeData.hoursWorked) || isNaN(employeeData.allowances)) {
                 errorMessageContainer.textContent = 'Please fill out all fields with valid numbers.';
                 return;
            }

            // b. Calculate the paystub
            // The calculatePaystub function is expected to be available globally
            const paystub = calculatePaystub(employeeData, taxRates);

            // c. Display the results
            displayPaystub(paystub, employeeData);

            // d. Make the "Download PDF" button visible
            downloadPdfBtn.style.display = 'block';

        } catch (error) {
            console.error('Error during paystub calculation:', error);
            errorMessageContainer.textContent = `An error occurred: ${error.message}`;
            paystubPreviewContainer.innerHTML = ''; // Clear previous results
            downloadPdfBtn.style.display = 'none'; // Hide button on error
        }
    }

    /**
     * Handles the click event for the "Download PDF" button.
     */
    function handleDownloadPdf() {
        const employeeName = employeeNameInput.value.trim() || 'employee';
        const fileName = `paystub_${employeeName.replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

        const options = {
            margin: 0.5,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Use html2pdf library (expected to be loaded globally)
        html2pdf().from(paystubPreviewContainer).set(options).save();
    }


    // --- 4. UI RENDERING ---

    /**
     * Renders the calculated paystub data into the preview container.
     * @param {object} paystub - The calculated paystub object.
     * @param {object} employeeData - The original employee input data.
     */
    function displayPaystub(paystub, employeeData) {
        const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

        const payPeriod = new Date().toLocaleDateString();

        const html = `
            <div class="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Paystub</h2>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p><strong>Employee:</strong> ${employeeData.name}</p>
                        <p><strong>Pay Period:</strong> ${payPeriod}</p>
                    </div>
                    <div class="text-right">
                        <p><strong>Pay Rate:</strong> ${formatCurrency(employeeData.payRate)} / hour</p>
                        <p><strong>Hours Worked:</strong> ${employeeData.hoursWorked}</p>
                    </div>
                </div>

                <div class="border-t border-b border-gray-200 py-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-gray-700">Gross Pay</span>
                        <span class="font-semibold text-green-600">${formatCurrency(paystub.grossPay)}</span>
                    </div>
                </div>

                <h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">Deductions</h3>
                <div class="space-y-2">
                    <div class="flex justify-between"><span class="text-gray-600">Federal Withholding</span> <span>${formatCurrency(paystub.federalTax)}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">New Jersey State Tax</span> <span>${formatCurrency(paystub.stateTax)}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">Social Security</span> <span>${formatCurrency(paystub.socialSecurity)}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">Medicare</span> <span>${formatCurrency(paystub.medicare)}</span></div>
                     <div class="flex justify-between"><span class="text-gray-600">NJ FLI (Family Leave)</span> <span>${formatCurrency(paystub.njFli)}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">NJ SDI (Disability)</span> <span>${formatCurrency(paystub.njSdi)}</span></div>
                </div>

                <div class="border-t border-gray-200 mt-4 pt-4">
                     <div class="flex justify-between items-center font-semibold text-gray-700">
                        <span>Total Deductions</span>
                        <span class="text-red-600">${formatCurrency(paystub.totalDeductions)}</span>
                    </div>
                </div>

                <div class="bg-gray-100 rounded-lg p-4 mt-6">
                    <div class="flex justify-between items-center text-xl font-bold">
                        <span class="text-gray-800">Net Pay</span>
                        <span class="text-blue-600">${formatCurrency(paystub.netPay)}</span>
                    </div>
                </div>
            </div>
        `;

        paystubPreviewContainer.innerHTML = html;
    }


    // --- 5. EVENT LISTENERS BINDING ---
    if (paystubForm) {
        paystubForm.addEventListener('submit', handleFormSubmit);
    }

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', handleDownloadPdf);
    }

    // --- 6. RUN INITIALIZATION ---
    initialize();
});
