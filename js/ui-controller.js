/**
 * @file ui-controller.js
 * @description Main entry point for the paystub generator wizard.
 * This module initializes the application, manages UI state (like step navigation),
 * and coordinates between different modules (form management, preview updates, etc.).
 */

// Import necessary modules with corrected relative paths
import * as FormManager from './form-manager.js';
import * as PreviewUpdater from './preview-updater.js';
import * as PaystubCalculator from './paystub-calculator.js';
import * as PdfGenerator from './pdf-generator.js';

// --- DOM Element Selectors ---
// A centralized place for DOM element selectors for easier management.
const DOMElements = {
    form: document.getElementById('paystub-form'),
    steps: document.querySelectorAll('.form-step'),
    nextBtn: document.getElementById('next-btn'),
    prevBtn: document.getElementById('prev-btn'),
    submitBtn: document.getElementById('submit-btn'),
    stepCounter: document.getElementById('step-counter'),
    formContainer: document.getElementById('form-container'),
    previewContainer: document.getElementById('preview-container'),
    downloadPdfBtn: document.getElementById('download-pdf-btn')
};

// --- State Management ---
// Manages the current state of the wizard.
let currentStep = 0;

/**
 * Updates the visibility of form steps based on the current step index.
 */
function updateStepVisibility() {
    DOMElements.steps.forEach((step, index) => {
        step.classList.toggle('active', index === currentStep);
    });

    if (DOMElements.stepCounter) {
        DOMElements.stepCounter.textContent = `Step ${currentStep + 1} of ${DOMElements.steps.length}`;
    }
}

/**
 * Updates the visibility and state of navigation buttons (Next, Back, Submit).
 */
function updateButtonVisibility() {
    if (!DOMElements.prevBtn || !DOMElements.nextBtn || !DOMElements.submitBtn) return;

    // Show/hide the 'Back' button
    DOMElements.prevBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';

    // Show/hide the 'Next' button
    DOMElements.nextBtn.style.display = currentStep < DOMElements.steps.length - 1 ? 'inline-block' : 'none';

    // Show/hide the 'Submit' button on the final step
    DOMElements.submitBtn.style.display = currentStep === DOMElements.steps.length - 1 ? 'inline-block' : 'none';
}


/**
 * Handles the 'Next' button click. Validates the current step and proceeds.
 */
function handleNext() {
    // Validate the current step before proceeding
    if (FormManager.validateStep(currentStep)) {
        if (currentStep < DOMElements.steps.length - 1) {
            currentStep++;
            updateStepVisibility();
            updateButtonVisibility();
        }
    } else {
        console.warn(`Validation failed for step ${currentStep + 1}.`);
        // Optionally, show a message to the user that validation failed.
    }
}

/**
 * Handles the 'Back' button click.
 */
function handleBack() {
    if (currentStep > 0) {
        currentStep--;
        updateStepVisibility();
        updateButtonVisibility();
    }
}

/**
 * Handles the form submission.
 */
async function handleSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    if (FormManager.validateStep(currentStep)) {
        console.log('Form submitted successfully!');
        try {
            // 1. Get all form data
            const formData = FormManager.getFormData();

            // 2. Calculate paystub details
            const paystubData = await PaystubCalculator.calculate(formData);

            // 3. Update the final preview with calculated data
            PreviewUpdater.updateFinalPreview(paystubData);

            // 4. Switch view from form to the final preview/download screen
            if (DOMElements.formContainer && DOMElements.previewContainer) {
                DOMElements.formContainer.style.display = 'none';
                DOMElements.previewContainer.style.display = 'block';
            }

        } catch (error) {
            console.error('An error occurred during form submission and processing:', error);
            // Optionally, display an error message to the user
            alert('There was an error processing your paystub. Please check the console for details.');
        }
    } else {
        console.warn('Submit validation failed.');
        alert('Please fill out all required fields before submitting.');
    }
}

/**
 * Main initialization function for the application.
 * Sets up event listeners and initial UI state.
 * Exported to be used as the single entry point.
 */
export function init() {
    try {
        // Ensure all required DOM elements are present before proceeding.
        if (!DOMElements.form || DOMElements.steps.length === 0 || !DOMElements.nextBtn) {
            console.error('Essential DOM elements are missing. UI Controller cannot initialize.');
            return;
        }

        // --- Event Listener Setup ---
        DOMElements.nextBtn.addEventListener('click', handleNext);
        DOMElements.prevBtn.addEventListener('click', handleBack);
        DOMElements.form.addEventListener('submit', handleSubmit);

        // Add a single event listener to the form to handle live preview updates.
        DOMElements.form.addEventListener('input', (event) => {
            const formData = FormManager.getFormData();
            PreviewUpdater.updateLivePreview(formData, event.target);
        });

        // Initialize PDF generation button
        if (DOMElements.downloadPdfBtn) {
            DOMElements.downloadPdfBtn.addEventListener('click', () => {
                 const paystubPreview = document.getElementById('paystub-preview');
                 if(paystubPreview){
                    PdfGenerator.generate(paystubPreview);
                 } else {
                    console.error("Could not find 'paystub-preview' element to generate PDF.");
                 }
            });
        }

        // --- Initial UI State ---
        updateStepVisibility();
        updateButtonVisibility();
        FormManager.initStateTaxability(); // Initialize state taxability checkboxes

        console.log('UI Controller initialized successfully.');

    } catch (error) {
        // Robust error handling for the entire initialization sequence.
        console.error('A critical error occurred during UI Controller initialization:', error);
        // Optionally, display a user-friendly error message on the page.
        const body = document.querySelector('body');
        if (body) {
            body.innerHTML = '<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #f00;"><h1>Application Error</h1><p>Sorry, the application could not be started. Please contact support.</p></div>';
        }
    }
}

// --- Application Entry Point ---
// Wait for the DOM to be fully loaded before initializing the application.
// This ensures that all scripts are loaded and the DOM is ready to be manipulated.
document.addEventListener('DOMContentLoaded', init);
