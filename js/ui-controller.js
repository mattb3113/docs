/**
 * @file ui-controller.js
 * @description Manages the overall user interface state, including tab navigation, modals, and loading indicators.
 */

class UIController {
    /**
     * Initializes the UIController, binding event listeners and setting initial state.
     * @param {object} options - An object containing references to other modules.
     * @param {FormManager} options.formManager - The form manager instance.
     * @param {PDFGenerator} options.pdfGenerator - The PDF generator instance.
     */
    constructor({ formManager, pdfGenerator }) {
        this.formManager = formManager;
        this.pdfGenerator = pdfGenerator;

        // DOM element references
        this.formSteps = document.querySelectorAll('.form-step');
        this.nextBtn = document.getElementById('next-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.tabIndicators = document.querySelectorAll('.tab-indicator');
        this.togglePreviewBtn = document.getElementById('toggle-preview-btn');
        this.previewContainer = document.querySelector('.paystub-preview-container');
        this.generatePdfBtn = document.getElementById('generate-pdf-btn');
        this.resetFormBtn = document.getElementById('reset-form-btn');
        this.saveDraftBtn = document.getElementById('save-draft-btn');
        this.loadDraftBtn = document.getElementById('load-draft-btn');
        
        // UI state
        this.currentStep = 0;

        // Initialize
        this._bindEvents();
        this.showStep(this.currentStep);
    }

    /**
     * Binds all necessary event listeners for UI interactions.
     * @private
     */
    _bindEvents() {
        this.nextBtn.addEventListener('click', () => this.showStep(this.currentStep + 1));
        this.prevBtn.addEventListener('click', () => this.showStep(this.currentStep - 1));
        this.togglePreviewBtn.addEventListener('click', () => this.togglePreviewVisibility());

        // --- Primary Action Buttons ---
        this.generatePdfBtn.addEventListener('click', () => this._handlePdfGeneration());
        this.resetFormBtn.addEventListener('click', () => this._handleFormReset());
        this.saveDraftBtn.addEventListener('click', () => {
            this.formManager.saveDraft();
            // Optional: Show a success message
            alert('Draft saved successfully!'); 
        });
        this.loadDraftBtn.addEventListener('click', () => {
             this.formManager.loadDraft();
             // Optional: Show a success message
             alert('Draft loaded successfully!');
        });
    }

    /**
     * Displays the specified form step and hides others.
     * @param {number} stepIndex - The index of the form step to display.
     */
    showStep(stepIndex) {
        // Ensure step index is within bounds
        if (stepIndex < 0 || stepIndex >= this.formSteps.length) {
            return;
        }
        
        // Hide all steps
        this.formSteps.forEach(step => step.classList.remove('active'));

        // Show the target step
        this.formSteps[stepIndex].classList.add('active');
        this.currentStep = stepIndex;

        // Update button visibility
        this.prevBtn.style.display = (stepIndex === 0) ? 'none' : 'inline-block';
        this.nextBtn.style.display = (stepIndex === this.formSteps.length - 1) ? 'none' : 'inline-block';
        this.generatePdfBtn.style.display = (stepIndex === this.formSteps.length - 1) ? 'inline-block' : 'none';

        // Update tab indicator
        this._updateTabIndicators();
    }
    
    /**
     * Updates the visual state of the tab indicators.
     * @private
     */
    _updateTabIndicators() {
        this.tabIndicators.forEach((indicator, index) => {
            if (index === this.currentStep) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    /**
     * Toggles the visibility of the paystub preview on mobile.
     */
    togglePreviewVisibility() {
        this.previewContainer.classList.toggle('preview-visible');
        const isVisible = this.previewContainer.classList.contains('preview-visible');
        this.togglePreviewBtn.textContent = isVisible ? 'Hide Preview' : 'Show Preview';
    }

    /**
     * Handles the entire PDF generation process, including user feedback.
     * @private
     */
    async _handlePdfGeneration() {
        this.showLoading('Generating PDF...');
        try {
            const formData = this.formManager.getFormData();
            await this.pdfGenerator.generate(formData);
        } catch (error) {
            console.error('PDF Generation Failed:', error);
            this.showModal('There was an error generating the PDF. Please check the console for details.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Shows a confirmation modal before resetting the form.
     * @private
     */
    _handleFormReset() {
        this.showModal(
            'Are you sure you want to reset the entire form? All unsaved data will be lost.',
            () => { // onConfirm
                this.formManager.resetForm();
                this.showStep(0); // Go back to the first tab
                alert('Form has been reset.');
            }
        );
    }
    
    /**
     * Displays a loading spinner and overlay.
     * @param {string} [message='Loading...'] - Optional message to display.
     */
    showLoading(message = 'Loading...') {
        // Prevent creating multiple loaders
        if (document.getElementById('loading-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Hides the loading spinner and overlay.
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Displays a confirmation or informational modal dialog.
     * @param {string} message - The text to display in the modal.
     * @param {Function} [onConfirm] - Callback executed when the confirm button is clicked. If not provided, only an "OK" button is shown.
     * @param {Function} [onCancel] - Callback executed when the cancel button is clicked or the modal is dismissed.
     */
    showModal(message, onConfirm, onCancel) {
        // Prevent creating multiple modals
        if (document.getElementById('modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal-content';

        modal.innerHTML = `<p>${message}</p>`;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';

        // If onConfirm is provided, it's a confirmation dialog (Confirm/Cancel)
        // Otherwise, it's an informational dialog (OK)
        if (onConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirm';
            confirmBtn.className = 'modal-confirm-btn';
            confirmBtn.onclick = () => {
                onConfirm();
                this._closeModal();
            };
            buttonContainer.appendChild(confirmBtn);

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'modal-cancel-btn';
            cancelBtn.onclick = () => {
                if (onCancel) onCancel();
                this._closeModal();
            };
            buttonContainer.appendChild(cancelBtn);
        } else {
            const okBtn = document.createElement('button');
            okBtn.textContent = 'OK';
            okBtn.className = 'modal-confirm-btn';
            okBtn.onclick = () => this._closeModal();
            buttonContainer.appendChild(okBtn);
        }

        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);

        // Close modal if user clicks outside of it
        overlay.addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                if (onCancel) onCancel();
                this._closeModal();
            }
        });

        document.body.appendChild(overlay);
    }

    /**
     * Removes the modal from the DOM.
     * @private
     */
    _closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

export default UIController;
