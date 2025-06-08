/**
 * @file preview-updater.js
 * @description Real-time preview engine for the BuellDocs Paystub Generator.
 * This module listens for form input, sends the data to the calculator,
 * and updates the live preview with the results.
 */

// Helper function to debounce function calls for performance.
const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

class PreviewUpdater {
    /**
     * Initializes the PreviewUpdater.
     * @param {PaystubCalculator} calculator - An instance of the PaystubCalculator class.
     */
    constructor(calculator) {
        if (!calculator) {
            throw new Error("A PaystubCalculator instance is required.");
        }
        this.calculator = calculator;
        this.formElement = null;
        this.previewElement = null;

        // Debounce the update method to avoid excessive calculations during rapid input.
        this.debouncedUpdate = debounce(this.update.bind(this), 300);
    }

    /**
     * Attaches event listeners to the form to trigger real-time updates.
     * @param {HTMLElement} formElement - The main form element.
     * @param {HTMLElement} previewElement - The container for the paystub preview.
     */
    listen(formElement, previewElement) {
        this.formElement = formElement;
        this.previewElement = previewElement;

        if (!this.formElement || !this.previewElement) {
            console.error("Form or preview element not found.");
            return;
        }

        // Listen to all inputs and selects for changes.
        this.formElement.addEventListener('input', (e) => {
            // We only trigger updates on specific interactive elements.
            if (e.target.matches('input, select, textarea')) {
                this.debouncedUpdate();
            }
        });

        // Also listen for 'change' for elements like file inputs and selects.
        this.formElement.addEventListener('change', (e) => {
             if (e.target.matches('input[type="file"], select')) {
                this.debouncedUpdate();
            }
        });
        
        // Initial update to populate the preview with default form values.
        this.update();
    }

    /**
     * Reads all data from the form, passes it to the calculator,
     * and triggers the preview population.
     */
    update() {
        if (!this.formElement) return;

        // 1. Read all data from the form fields.
        const formData = this.getFormData();

        // 2. Pass data to the calculator.
        // The calculator might throw errors on invalid data, so we wrap it.
        try {
            const results = this.calculator.calculate(formData);
            // 3. Populate the preview with the results.
            this.populate(results, formData);
        } catch (error) {
            console.error("Calculation Error:", error);
            // Optionally, display an error in the preview.
        }
    }

    /**
     * Gathers all data from the form into a structured object for the calculator.
     * @returns {object} The structured form data.
     */
    getFormData() {
         const data = {
            // Use Object.fromEntries for simple key-value pairs
            ...Object.fromEntries(new FormData(this.formElement)),
            earnings: [],
            deductions: [],
            ytd: {}, // YTD values will be read from earnings/deductions fields
         };

        // Gather dynamic earnings rows
        this.formElement.querySelectorAll('#earnings-container .grid').forEach(row => {
            const inputs = row.querySelectorAll('input');
            const description = inputs[0]?.value;
            // Salary has amount, others have rate/hours
            if (description?.toLowerCase() === 'salary') {
                 data.earnings.push({
                    type: 'Salary',
                    rate: parseFloat(inputs[1]?.value) || 0,
                    ytd: parseFloat(inputs[2]?.value) || 0,
                });
            } else if (description) {
                 data.earnings.push({
                    type: description,
                    rate: parseFloat(inputs[1]?.value) || 0,
                    hours: parseFloat(inputs[2]?.value) || 0,
                    ytd: parseFloat(inputs[3]?.value) || 0,
                });
            }
        });
        
        // Gather dynamic deductions rows
        this.formElement.querySelectorAll('#deductions-container .grid').forEach(row => {
             const inputs = row.querySelectorAll('input');
             const typeHeader = row.previousElementSibling;
             const isPreTax = typeHeader && typeHeader.textContent.toLowerCase().includes('pre-tax');
             
             data.deductions.push({
                description: inputs[0]?.value,
                amount: parseFloat(inputs[1]?.value) || 0,
                ytd: parseFloat(inputs[2]?.value) || 0,
                type: isPreTax ? 'pre-tax' : 'post-tax'
             });
        });
        
        // Handle checkboxes for NJ taxes
        data.deductions.push({ description: 'NJ FLI', amount: data.njFli ? 'calculate' : 0, type: 'post-tax' });
        data.deductions.push({ description: 'NJ SDI', amount: data.njSdi ? 'calculate' : 0, type: 'post-tax' });

        return data;
    }

    /**
     * Populates the preview HTML with calculated results.
     * @param {object} results - The calculated data from the PaystubCalculator.
     * @param {object} formData - The raw form data for non-calculated fields.
     */
    populate(results, formData) {
        if (!this.previewElement || !results) return;

        // --- Helper Functions for Formatting ---
        const formatCurrency = (val) => (val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const formatSsn = (ssn) => ssn ? `***-**-${ssn.slice(-4)}` : '***-**-XXXX';
        const formatDate = (dateStr) => dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US') : 'N/A';

        // --- Update Static Info ---
        this.previewElement.querySelector('#preview-companyName').textContent = formData.companyName || 'Company Name';
        this.previewElement.querySelector('#preview-companyAddress').textContent = `${formData.companyStreet || '123 Business Rd'}, ${formData.companyCity || 'Businesstown'}, ${formData.companyState || 'ST'} ${formData.companyZip || '98765'}`;
        this.previewElement.querySelector('#preview-payDate').textContent = formatDate(formData.payDate);
        this.previewElement.querySelector('#preview-employeeName').textContent = formData.employeeName || 'Employee Name';
        this.previewElement.querySelector('#preview-employeeAddress').textContent = `${formData.employeeStreet || '456 Home Ave'}, Anytown, ST 12345`;
        this.previewElement.querySelector('#preview-ssn').textContent = formatSsn(formData.employeeSsn);
        this.previewElement.querySelector('#preview-employeeId').textContent = formData.employeeId || 'N/A';
        this.previewElement.querySelector('#preview-payPeriod').textContent = `${formatDate(formData.payPeriodStart)} to ${formatDate(formData.payPeriodEnd)}`;
        
        // --- Update Logo ---
        const logoInput = this.formElement.querySelector('#logoUpload');
        const logoPreview = this.previewElement.querySelector('#preview-logo');
        if (logoInput.files && logoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
            };
            reader.readAsDataURL(logoInput.files[0]);
        }
        
        // --- Update Dynamic Tables: Earnings ---
        const earningsBody = this.previewElement.querySelector('#preview-earnings-body');
        earningsBody.innerHTML = ''; // Clear existing rows
        results.current.earnings.breakdown.forEach(earning => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-1">${earning.type}</td>
                <td class="py-1 text-right">${formatCurrency(earning.amount)}</td>
                <td class="py-1 text-right">${formatCurrency(earning.ytd_amount)}</td>
            `;
            earningsBody.appendChild(row);
        });

        // --- Update Dynamic Tables: Deductions ---
        const deductionsBody = this.previewElement.querySelector('#preview-deductions-body');
        deductionsBody.innerHTML = '';
        const allDeductions = [
            ...results.current.deductions.preTax.breakdown,
            ...results.current.deductions.postTax.breakdown,
            ...Object.entries(results.current.taxes).map(([key, value]) => ({ description: key, amount: value, ytd_amount: results.ytd.taxes[key] }))
        ];

        allDeductions.forEach(deduction => {
            if (deduction.amount > 0) {
                 const row = document.createElement('tr');
                 row.innerHTML = `
                    <td class="py-1">${deduction.description}</td>
                    <td class="py-1 text-right">${formatCurrency(deduction.amount)}</td>
                    <td class="py-1 text-right">${formatCurrency(deduction.ytd_amount)}</td>
                `;
                deductionsBody.appendChild(row);
            }
        });

        // --- Update Totals ---
        this.previewElement.querySelector('#preview-gross').textContent = formatCurrency(results.current.grossPay);
        this.previewElement.querySelector('#preview-gross-ytd').textContent = formatCurrency(results.ytd.grossPay);
        this.previewElement.querySelector('#preview-deductions').textContent = formatCurrency(results.current.totalDeductions);
        this.previewElement.querySelector('#preview-deductions-ytd').textContent = formatCurrency(results.ytd.totalDeductions);
        this.previewElement.querySelector('#preview-net').textContent = formatCurrency(results.current.netPay);

        // --- Update Check Portion ---
        this.previewElement.querySelector('#preview-check-date').textContent = formatDate(formData.payDate);
        this.previewElement.querySelector('#preview-check-payee').textContent = formData.employeeName || 'Employee Name';
        this.previewElement.querySelector('#preview-check-amount-box').textContent = `**${results.current.netPay.toFixed(2)}`;
        // A full "amount to text" converter is complex, so we'll use a simplified version.
        this.previewElement.querySelector('#preview-check-amount-text').textContent = `${results.current.netPay.toFixed(2)} Dollars`;


        // --- Update MICR Line ---
        // These fields do not exist in the form, so we use placeholders.
        const routingNumber = formData.routingNumber || 'C012345678C';
        const accountNumber = formData.accountNumber || 'A987654321A';
        const checkNumber = formData.checkNumber || '123456';
        this.previewElement.querySelector('#micr-line').textContent = `${routingNumber} ${accountNumber} ${checkNumber}`;

        // --- State Management: VOID Pantograph ---
        const voidPantograph = this.previewElement.querySelector('#void-pantograph');
        if (results.current.netPay <= 0) {
            voidPantograph.style.display = 'flex';
        } else {
            voidPantograph.style.display = 'none';
        }
    }
}

export default PreviewUpdater;
