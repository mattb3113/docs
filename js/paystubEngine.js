/**
 * @module paystubEngine
 * @description The central engine that connects the form, calculator, and preview updater.
 */
import FormManager from './form-manager.js';
import { updatePreview } from './preview-updater.js';
import { calculatePaystub } from './paystub-calculator.js';
import { taxTables } from './tax-tables.js';
import { generatePdf } from './pdf-generator.js';

class PaystubEngine {
    constructor() {
        this.formManager = null;
    }

    /**
     * Initializes the application.
     * Loads necessary data and sets up event handlers.
     */
    async start() {
        console.log("Paystub Engine starting...");
        try {
            // Must load tax tables before doing anything else
            await taxTables.load();

            // Initialize form manager, which triggers the first calculation
            this.formManager = new FormManager(this.handleFormChange.bind(this));
            this.formManager.init();
            
            this.setupActionButtons();
            console.log("Paystub Engine started successfully.");

        } catch (error) {
            console.error("Failed to start Paystub Engine:", error);
            // Display a user-friendly error message on the page
            const errorEl = document.getElementById('error-container');
            if (errorEl) {
                errorEl.textContent = 'Critical error: Could not load application configuration. Please refresh the page.';
                errorEl.style.display = 'block';
            }
        }
    }

    /**
     * Callback function that is triggered whenever the form data changes.
     * @param {object} formData The current data from the form.
     */
    handleFormChange(formData) {
        try {
            const calculatedData = calculatePaystub(formData);
            updatePreview(formData, calculatedData);
        } catch (error) {
            console.error("Error during calculation/preview update:", error);
        }
    }
    
    /**
     * Sets up event listeners for the action buttons (PDF download, Print).
     */
    setupActionButtons() {
        const downloadBtn = document.getElementById('download-pdf-btn');
        const printBtn = document.getElementById('print-btn');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const formData = this.formManager.getFormData();
                const filename = `paystub-${formData.employeeName.replace(/\s+/g, '_')}-${formData.payDate}.pdf`;
                generatePdf(filename);
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }
}

export default PaystubEngine;
