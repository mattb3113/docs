// Import necessary functions from other modules.
// Note: Ensure those files use 'export' for these functions to be available.
// We will assume they are structured correctly as per the plan.
import { calculatePaystub } from './js/paystub-calculator.js';
import { getTaxData } from './js/data-service.js';

// Wait for the DOM to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Element References ---
    const paystubForm = document.getElementById('paystub-form');
    const previewContainer = document.getElementById('paystub-preview-container');
    const downloadPdfButton = document.getElementById('download-pdf-button');
    const generateButton = document.getElementById('generate-button');

    // --- State Management ---
    let taxData = null; // To hold the fetched tax rates

    // --- Main Logic ---

    // 1. Fetch tax data as soon as the app loads
    const initialize = async () => {
        try {
            taxData = await getTaxData();
            console.log("Tax data loaded successfully.");
            // Enable the form once data is loaded
            generateButton.disabled = false;
            generateButton.textContent = 'Generate Paystub';
        } catch (error) {
            console.error("Failed to load tax data:", error);
            // Disable the form and show an error message
            previewContainer.innerHTML = `<div class="text-red-600 text-center font-bold">Error: Could not load necessary tax data. Please check the server connection and refresh the page.</div>`;
            generateButton.disabled = true;
            generateButton.textContent = 'Error: Data Failed to Load';
        }
    };

    // 2. Handle the form submission
    const handleFormSubmit = (event) => {
        event.preventDefault(); // Prevent the default browser form submission
        
        if (!taxData) {
            alert("Tax data is not yet loaded. Please wait.");
            return;
        }

        // --- Collect all data from form inputs ---
        const userInput = {
            companyName: document.getElementById('company-name').value,
            companyAddress: document.getElementById('company-address').value,
            employeeName: document.getElementById('employee-name').value,
            employeeAddress: document.getElementById('employee-address').value,
            employeeId: document.getElementById('employee-id').value,
            payPeriodStart: document.getElementById('pay-period-start').value,
            payPeriodEnd: document.getElementById('pay-period-end').value,
            payDate: document.getElementById('pay-date').value,
            payRate: parseFloat(document.getElementById('pay-rate').value),
            regularHours: parseFloat(document.getElementById('regular-hours').value),
            overtimeHours: parseFloat(document.getElementById('overtime-hours').value),
            federalFilingStatus: document.getElementById('federal-filing-status').value,
            federalAllowances: parseInt(document.getElementById('federal-allowances').value),
            njAllowances: parseInt(document.getElementById('nj-allowances').value),
            deductions: [{
                name: document.getElementById('deduction-name-1').value || 'N/A',
                amount: parseFloat(document.getElementById('deduction-amount-1').value) || 0
            }],
            ytdGross: parseFloat(document.getElementById('ytd-gross').value),
            ytdFederalTax: parseFloat(document.getElementById('ytd-federal-tax').value),
        };

        // --- Calculate the paystub ---
        const paystubResult = calculatePaystub(userInput, taxData);

        // --- Render the result into the preview container ---
        renderPaystub(paystubResult);

        // --- Show the download button ---
        downloadPdfButton.classList.remove('hidden');
    };

    // 3. Render the paystub HTML
    const renderPaystub = (data) => {
        // Function to safely format numbers as currency
        const formatCurrency = (num) => num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        const paystubHTML = `
            <div id="paystub-output" class="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
                <!-- Header -->
                <div class="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
                    <div>
                        <h3 class="text-xl font-bold">${data.company.name}</h3>
                        <p class="text-sm">${data.company.address}</p>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">Pay Stub</h2>
                </div>

                <!-- Employee & Pay Period Info -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                    <div><strong>Employee:</strong><br>${data.employee.name}</div>
                    <div><strong>Employee ID:</strong><br>${data.employee.id || 'N/A'}</div>
                    <div><strong>Pay Date:</strong><br>${data.payDate}</div>
                    <div><strong>Pay Period:</strong><br>${data.payPeriod.start} to ${data.payPeriod.end}</div>
                </div>

                <!-- Main Details: Earnings, Taxes, Deductions -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Earnings -->
                    <div class="border rounded-md p-4">
                        <h4 class="font-bold text-lg border-b pb-2 mb-2">Earnings</h4>
                        <table class="w-full text-sm">
                            <thead><tr><th class="text-left">Description</th><th class="text-right">Hours</th><th class="text-right">Rate</th><th class="text-right">Current</th><th class="text-right">YTD</th></tr></thead>
                            <tbody>
                                ${data.earnings.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td class="text-right">${item.hours !== null ? item.hours.toFixed(2) : ''}</td>
                                        <td class="text-right">${item.rate !== null ? formatCurrency(item.rate) : ''}</td>
                                        <td class="text-right">${formatCurrency(item.current)}</td>
                                        <td class="text-right">${formatCurrency(item.ytd)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot class="font-bold border-t mt-2 pt-2">
                                <tr><td>Total Gross</td><td></td><td></td><td class="text-right">${formatCurrency(data.totals.current.gross)}</td><td class="text-right">${formatCurrency(data.totals.ytd.gross)}</td></tr>
                            </tfoot>
                        </table>
                    </div>
                    <!-- Taxes -->
                    <div class="border rounded-md p-4">
                        <h4 class="font-bold text-lg border-b pb-2 mb-2">Taxes</h4>
                        <table class="w-full text-sm">
                             <thead><tr><th class="text-left">Description</th><th class="text-right">Current</th><th class="text-right">YTD</th></tr></thead>
                             <tbody>
                                ${data.taxes.map(item => `
                                    <tr><td>${item.name}</td><td class="text-right">${formatCurrency(item.current)}</td><td class="text-right">${formatCurrency(item.ytd)}</td></tr>
                                `).join('')}
                             </tbody>
                             <tfoot class="font-bold border-t mt-2 pt-2">
                                <tr><td>Total Taxes</td><td class="text-right">${formatCurrency(data.totals.current.taxes)}</td><td class="text-right">${formatCurrency(data.totals.ytd.taxes)}</td></tr>
                             </tfoot>
                        </table>
                    </div>
                    <!-- Deductions -->
                    <div class="border rounded-md p-4">
                         <h4 class="font-bold text-lg border-b pb-2 mb-2">Deductions</h4>
                        <table class="w-full text-sm">
                             <thead><tr><th class="text-left">Description</th><th class="text-right">Current</th><th class="text-right">YTD</th></tr></thead>
                             <tbody>
                                ${data.deductions.map(item => `
                                    <tr><td>${item.name}</td><td class="text-right">${formatCurrency(item.current)}</td><td class="text-right">${formatCurrency(item.ytd)}</td></tr>
                                `).join('')}
                             </tbody>
                             <tfoot class="font-bold border-t mt-2 pt-2">
                                <tr><td>Total Deductions</td><td class="text-right">${formatCurrency(data.totals.current.deductions)}</td><td class="text-right">${formatCurrency(data.totals.ytd.deductions)}</td></tr>
                             </tfoot>
                    </div>
                </div>

                <!-- Summary -->
                <div class="mt-6 pt-4 border-t-2 border-gray-800 flex justify-end">
                    <div class="w-full md:w-1/3 text-right">
                        <div class="flex justify-between font-bold text-lg"><span>Net Pay:</span><span>${formatCurrency(data.totals.current.netPay)}</span></div>
                    </div>
                </div>
            </div>
        `;
        previewContainer.innerHTML = paystubHTML;
    };

    // 4. Handle the PDF download
    const handleDownloadPdf = () => {
        const element = document.getElementById('paystub-output');
        const employeeName = document.getElementById('employee-name').value.replace(/ /g, '_');
        const payDate = document.getElementById('pay-date').value;
        const opt = {
            margin:       0.5,
            filename:     `Paystub_${employeeName}_${payDate}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    // --- Event Listeners ---
    paystubForm.addEventListener('submit', handleFormSubmit);
    downloadPdfButton.addEventListener('click', handleDownloadPdf);
    
    // --- Initializer Call ---
    // Disable form until data is ready
    generateButton.disabled = true;
    generateButton.textContent = 'Loading Tax Data...';
    initialize();
});

