import TaxTables2025 from './js/tax-tables.js';
import PaystubCalculator from './js/paystub-calculator.js';
import FormManager from './js/form-manager.js';
import PreviewUpdater from './js/preview-updater.js';
import PDFGenerator from './js/pdf-generator.js';

/**
 * @class UIController
 * @description Handles general UI interactions like adding or removing dynamic form elements.
 */
class UIController {
    /**
     * @param {HTMLFormElement} form - The main form element.
     */
    constructor(form) {
        this.form = form;
    }

    /**
     * @description Sets up event listeners for UI controls.
     */
    listen() {
        this.form.addEventListener('click', (event) => {
            if (event.target.matches('.add-item-btn')) {
                this.addItem(event.target);
            }
            if (event.target.matches('.remove-item-btn')) {
                this.removeItem(event.target);
            }
        });
    }

    /**
     * @description Adds a new item (e.g., earning, deduction) to the form.
     * @param {HTMLButtonElement} addButton - The button that was clicked.
     */
    addItem(addButton) {
        const containerId = addButton.dataset.container;
        const container = this.form.querySelector(`#${containerId}`);
        const templateId = addButton.dataset.template;
        const template = document.getElementById(templateId);

        if (container && template) {
            const clone = template.content.cloneNode(true);
            container.appendChild(clone);
            // Dispatch a custom event so other modules can react
            this.form.dispatchEvent(new CustomEvent('form-item-added', { bubbles: true }));
        } else {
            console.error('Could not find container or template for adding item.');
        }
    }

    /**
     * @description Removes an item from the form.
     * @param {HTMLButtonElement} removeButton - The button that was clicked.
     */
    removeItem(removeButton) {
        const item = removeButton.closest('.form-row-dynamic');
        if (item) {
            item.remove();
            // Dispatch a custom event so other modules can react
            this.form.dispatchEvent(new CustomEvent('form-item-removed', { bubbles: true }));
        }
    }
}


/**
 * @description Main application entry point.
 * This function is executed when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. Get DOM Element References ---
    const mainForm = document.getElementById('paystub-form');
    const previewContainer = document.getElementById('preview-container');
    const generatePdfBtn = document.getElementById('generate-pdf-btn');

    if (!mainForm || !previewContainer || !generatePdfBtn) {
        console.error('Critical DOM elements are missing. Application cannot start.');
        return;
    }

    // --- 2. Initialize Core Modules & Services ---
    const taxTables = TaxTables2025;
    const calculator = new PaystubCalculator(taxTables);
    const uiController = new UIController(mainForm);
    const formManager = new FormManager(mainForm);
    const previewUpdater = new PreviewUpdater(calculator, mainForm, previewContainer);
    const pdfGenerator = new PDFGenerator(previewContainer);


    // --- 3. Wire Up Interactions & Load Initial Data ---

    // Activate event listeners for dynamic UI elements (add/remove buttons)
    uiController.listen();

    // Activate event listeners for live preview updates on form input
    previewUpdater.listen();

    // Load any saved data from localStorage into the form
    formManager.loadDraft();

    // Connect the "Generate PDF" button to the PDF generation logic
    generatePdfBtn.addEventListener('click', () => {
        pdfGenerator.generate();
    });

    // --- 4. Initial Render ---
    // Trigger an initial preview update to ensure the preview is populated on page load
    previewUpdater.updatePreview();

    console.log('Paystub application initialized successfully.');
});
