/**
 * @module PdfGenerator
 * @description Generates a professional-looking PDF from a paystub data object.
 *
 * This module uses the html2pdf.js library to convert a dynamically generated
 * HTML string into a downloadable PDF file. It relies on the styles defined
 * in 'print.css' to ensure the output is well-formatted.
 *
 * Note: This module requires the html2pdf.js library to be loaded in the host HTML file.
 * e.g., <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
 */

/**
 * Formats a number as a US currency string (e.g., 1234.5 -> "$1,234.50").
 * @param {number | string} number - The number to format.
 * @returns {string} The formatted currency string. Returns "$0.00" if input is invalid.
 */
const formatCurrency = (number) => {
  const numericValue = parseFloat(number);
  if (isNaN(numericValue)) {
    return '$0.00';
  }
  return numericValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

/**
 * Generates HTML table rows for earnings, deductions, or taxes.
 * @param {Array<Object>} items - Array of items (e.g., earnings, deductions).
 * @param {string} ytdItems - Corresponding YTD amount from the paystub data.
 * @returns {string} An HTML string containing table rows (<tr>).
 */
const generateTableRows = (items = [], ytdItems = []) => {
  if (!Array.isArray(items)) return '';
  return items
    .map((item, index) => `
      <tr>
        <td>${item.description || ''}</td>
        <td class="amount">${formatCurrency(item.amount)}</td>
        <td class="amount">${formatCurrency(ytdItems[index]?.amount)}</td>
      </tr>
    `)
    .join('');
};


/**
 * The primary function to generate and download a paystub PDF.
 * @param {object} paystubData - The comprehensive paystub data object.
 */
function generatePdf(paystubData = {}) {
  // Destructure with default values to prevent errors from missing data
  const {
    companyInfo = {},
    employeeInfo = {},
    payPeriod = {},
    earnings = {},
    taxes = {},
    deductions = {},
    totals = {},
    ytd = {}
  } = paystubData;

  // Create an HTML string using the paystub data.
  // This HTML is styled using classes from 'print.css'.
  const paystubHtml = `
    <div class="stub-container" id="paystub-for-pdf">
      <!-- Header Section -->
      <header class="header">
        <div class="company-info">
          <h1>${companyInfo.name || 'Company Name'}</h1>
          <p>${companyInfo.address || 'Company Address'}</p>
        </div>
        <div class="statement-info">
          <h2>Pay Statement</h2>
          <p><strong>Pay Date:</strong> ${payPeriod.payDate || ''}</p>
          <p><strong>Pay Period:</strong> ${payPeriod.startDate || ''} - ${payPeriod.endDate || ''}</p>
        </div>
      </header>

      <!-- Employee Info Section -->
      <section class="info-grid">
        <div class="info-section">
          <h3>Employee</h3>
          <p>${employeeInfo.name || ''}</p>
          <p>${employeeInfo.address || ''}</p>
        </div>
        <div class="info-section">
          <h3>Job & Pay Info</h3>
          <p><strong>Pay Rate:</strong> ${formatCurrency(employeeInfo.payRate)}</p>
          <!-- Add other job details here if available -->
        </div>
      </section>

      <!-- Financials Section -->
      <section class="summary-section">
        <!-- Earnings Table -->
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th class="amount">Current</th>
                <th class="amount">YTD</th>
              </tr>
            </thead>
            <tbody>
              ${generateTableRows(earnings.current, ytd.earnings)}
            </tbody>
          </table>
        </div>

        <!-- Taxes Table -->
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Taxes</th>
                <th class="amount">Current</th>
                <th class="amount">YTD</th>
              </tr>
            </thead>
            <tbody>
              ${generateTableRows(taxes.current, ytd.taxes)}
            </tbody>
          </table>
        </div>

        <!-- Deductions Table -->
        <div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Deductions</th>
                <th class="amount">Current</th>
                <th class="amount">YTD</th>
              </tr>
            </thead>
            <tbody>
              ${generateTableRows(deductions.current, ytd.deductions)}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Totals Section -->
      <section class="totals">
        <div class="total-row">
          <div class="label">Gross Pay</div>
          <div class="value">${formatCurrency(totals.grossPay)}</div>
        </div>
        <div class="total-row">
          <div class="label">Total Taxes</div>
          <div class="value">${formatCurrency(totals.totalTaxes)}</div>
        </div>
        <div class="total-row">
          <div class="label">Total Deductions</div>
          <div class="value">${formatCurrency(totals.totalDeductions)}</div>
        </div>
        <div class="total-row net-pay">
          <div class="label">Net Pay</div>
          <div class="value">${formatCurrency(totals.netPay)}</div>
        </div>
      </section>

    </div>
  `;

  // Use html2pdf.js to generate the PDF from the HTML string.
  const element = document.createElement('div');
  element.innerHTML = paystubHtml;

  const pdfOptions = {
    margin: 0.5,
    filename: `Paystub-${employeeInfo.name || 'Employee'}-${payPeriod.endDate || 'period'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().from(element).set(pdfOptions).save();
}

export default generatePdf;
