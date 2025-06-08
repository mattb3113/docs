/**
 * @file form-manager.js
 * @description Manages the dynamic behavior, validation, and data persistence of a form.
 * This class is designed to be reusable and handles adding/removing dynamic fields,
 * validating inputs with real-time feedback, and saving/loading form data to/from localStorage.
 */

class FormManager {
    /**
     * Initializes the FormManager.
     * @param {string} formId The ID of the form element to manage.
     * @param {object} options Optional configuration for selectors and keys.
     */
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            throw new Error(`Form with ID "${formId}" not found.`);
        }

        // --- Configuration with default values ---
        this.config = {
            storageKey: options.storageKey || 'formDraft',
            earningsContainerId: options.earningsContainerId || 'earnings-container',
            deductionsContainerId: options.deductionsContainerId || 'deductions-container',
            addEarningBtnId: options.addEarningBtnId || 'add-earning-btn',
            addDeductionBtnId: options.addDeductionBtnId || 'add-deduction-btn',
            resetBtnId: options.resetBtnId || 'reset-form-btn',
            ssnInputId: options.ssnInputId || 'employeeSsn',
            einInputId: options.einInputId || 'companyEin',
            payPeriodStartId: options.payPeriodStartId || 'payPeriodStart',
            payPeriodEndId: options.payPeriodEndId || 'payPeriodEnd'
        };

        // --- Regex Patterns for Validation ---
        this.patterns = {
            ssn: /^\d{3}-\d{2}-\d{4}$/,
            ein: /^\d{2}-\d{7}$/
        };

        this.earningsContainer = document.getElementById(this.config.earningsContainerId);
        this.deductionsContainer = document.getElementById(this.config.deductionsContainerId);

        this._init();
    }

    /**
     * Private method to initialize event listeners and load data.
     * @private
     */
    _init() {
        // Debounced save function to avoid excessive localStorage writes
        const debouncedSave = this._debounce(() => this.saveDraft(), 300);

        // Listen for any input on the form to trigger validation and save
        this.form.addEventListener('input', (event) => {
            this.validateField(event.target);
            debouncedSave();
        });
        
        // Listen for form reset
        const resetBtn = document.getElementById(this.config.resetBtnId);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetForm());
        }

        // Listen for adding dynamic fields
        const addEarningBtn = document.getElementById(this.config.addEarningBtnId);
        if (addEarningBtn) {
            addEarningBtn.addEventListener('click', () => this.addEarningField());
        }
        
        const addDeductionBtn = document.getElementById(this.config.addDeductionBtnId);
        if (addDeductionBtn) {
            addDeductionBtn.addEventListener('click', () => this.addDeductionField());
        }
        
        // Use event delegation for removing dynamic fields
        this.earningsContainer?.addEventListener('click', this._handleRemoveClick.bind(this));
        this.deductionsContainer?.addEventListener('click', this._handleRemoveClick.bind(this));


        // Load existing draft from localStorage on initialization
        this.loadDraft();
    }

    /**
     * Adds a new row of input fields for an earning.
     */
    addEarningField() {
        if (!this.earningsContainer) return;

        const row = document.createElement('div');
        row.className = 'grid grid-cols-5 gap-2 items-center dynamic-row';
        row.innerHTML = `
            <input type="text" name="earningDescription" class="col-span-2 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="Description">
            <input type="number" name="earningRate" step="0.01" class="block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="Amount/Rate">
            <input type="number" name="earningHours" step="0.01" class="block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="Hours (opt)">
            <input type="number" name="earningYtd" step="0.01" class="block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="YTD">
            <button type="button" class="text-slate-400 hover:text-red-500 remove-btn"><i class="fas fa-trash"></i></button>
        `;
        this.earningsContainer.appendChild(row);
    }
    
    /**
     * Adds a new row of input fields for a deduction.
     */
    addDeductionField() {
        if (!this.deductionsContainer) return;
        
        const row = document.createElement('div');
        row.className = 'grid grid-cols-4 gap-2 items-center dynamic-row';
        row.innerHTML = `
            <input type="text" name="deductionDescription" class="col-span-2 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="Description">
            <input type="number" name="deductionAmount" step="0.01" class="block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="Amount">
            <input type="number" name="deductionYtd" step="0.01" class="block w-full rounded-md border-slate-300 shadow-sm sm:text-sm" placeholder="YTD">
            <button type="button" class="text-slate-400 hover:text-red-500 remove-btn"><i class="fas fa-trash"></i></button>
        `;
        this.deductionsContainer.appendChild(row);
    }

    /**
     * Validates the entire form and returns its validity state.
     * @returns {boolean} True if the form is valid, otherwise false.
     */
    validate() {
        let isFormValid = true;
        const inputs = this.form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }

    /**
     * Validates a single input field based on its attributes and type.
     * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input The input element to validate.
     * @returns {boolean} True if the field is valid, otherwise false.
     */
    validateField(input) {
        let isValid = true;
        let errorMessage = '';

        // Rule 1: Required fields
        if (input.required && !input.value.trim()) {
            isValid = false;
            errorMessage = `${input.previousElementSibling?.textContent || 'This field'} is required.`;
        }

        // Rule 2: Regex for specific fields
        if (isValid && input.id === this.config.ssnInputId && input.value && !this.patterns.ssn.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid SSN (XXX-XX-XXXX).';
        }
        if (isValid && input.id === this.config.einInputId && input.value && !this.patterns.ein.test(input.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid EIN (XX-XXXXXXX).';
        }

        // Rule 3: Valid numeric inputs
        if (isValid && input.type === 'number' && input.value && isNaN(parseFloat(input.value))) {
            isValid = false;
            errorMessage = 'Please enter a valid number.';
        }

        // Rule 4: Logical dates
        if (isValid && (input.id === this.config.payPeriodStartId || input.id === this.config.payPeriodEndId)) {
            const startDate = document.getElementById(this.config.payPeriodStartId).value;
            const endDate = document.getElementById(this.config.payPeriodEndId).value;
            if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
                isValid = false;
                errorMessage = 'End date must be after the start date.';
            }
        }
        
        this._updateFieldValidationState(input, isValid, errorMessage);
        return isValid;
    }

    /**
     * Saves the current form data to localStorage.
     */
    saveDraft() {
        const formData = new FormData(this.form);
        const data = {};

        // Process standard inputs
        for (const [key, value] of formData.entries()) {
            if (!data[key]) {
                data[key] = value;
            } else if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        }
        
        // Serialize logo separately if needed
        const logoInput = this.form.querySelector('#logoUpload');
        if (logoInput && logoInput.files[0]) {
             // For simplicity, we won't store the file itself, but a real app might store a temporary URL or base64 string
        }

        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        console.log('Draft saved to localStorage.');
    }

    /**
     * Loads a saved draft from localStorage and populates the form.
     */
    loadDraft() {
        const draft = localStorage.getItem(this.config.storageKey);
        if (!draft) return;

        console.log('Loading draft from localStorage.');
        const data = JSON.parse(draft);
        
        this._clearDynamicFields();

        for (const key in data) {
            const elements = this.form.querySelectorAll(`[name="${key}"]`);
            if (elements.length > 1 && Array.isArray(data[key])) { // Handle dynamic fields
                 if (key === 'earningDescription') { // Recreate earning rows
                    data[key].forEach((desc, index) => {
                        this.addEarningField();
                        const newRow = this.earningsContainer.lastChild;
                        newRow.querySelector('[name="earningDescription"]').value = desc;
                        newRow.querySelector('[name="earningRate"]').value = data.earningRate[index];
                        newRow.querySelector('[name="earningHours"]').value = data.earningHours[index];
                        newRow.querySelector('[name="earningYtd"]').value = data.earningYtd[index];
                    });
                } else if (key === 'deductionDescription') { // Recreate deduction rows
                    data[key].forEach((desc, index) => {
                        this.addDeductionField();
                        const newRow = this.deductionsContainer.lastChild;
                        newRow.querySelector('[name="deductionDescription"]').value = desc;
                        newRow.querySelector('[name="deductionAmount"]').value = data.deductionAmount[index];
                        newRow.querySelector('[name="deductionYtd"]').value = data.deductionYtd[index];
                    });
                }
            } else if (elements.length === 1) { // Handle static fields
                const el = elements[0];
                if (el.type === 'checkbox' || el.type === 'radio') {
                    el.checked = el.value === data[key];
                } else {
                    el.value = data[key];
                }
            }
        }
        this.validate(); // Re-validate all fields after loading
    }

    /**
     * Clears all form fields and removes the saved draft.
     */
    resetForm() {
        if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
            this.form.reset();
            this._clearDynamicFields();
            localStorage.removeItem(this.config.storageKey);
            
             // Remove validation classes
            this.form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
                const errorSpan = el.nextElementSibling;
                if(errorSpan && errorSpan.classList.contains('error-message')) {
                    errorSpan.textContent = '';
                }
            });
            
            console.log('Form reset and draft removed.');
        }
    }

    // --- Private Helper Methods ---

    /**
     * Adds/removes CSS classes and displays/hides error messages.
     * @private
     */
    _updateFieldValidationState(input, isValid, message) {
        const errorSpan = input.parentElement.querySelector('.error-message'); // Assumes error span is a sibling

        input.classList.toggle('is-valid', isValid && input.value !== '');
        input.classList.toggle('is-invalid', !isValid);

        if (errorSpan) {
            errorSpan.textContent = message;
            errorSpan.style.display = message ? 'block' : 'none';
        }
    }
    
    /**
     * Removes all dynamically added field rows.
     * @private
     */
    _clearDynamicFields() {
        this.earningsContainer.querySelectorAll('.dynamic-row').forEach(row => row.remove());
        this.deductionsContainer.querySelectorAll('.dynamic-row').forEach(row => row.remove());
    }

    /**
     * Handles the click event for removing a dynamic field row.
     * @private
     */
    _handleRemoveClick(event) {
        const removeBtn = event.target.closest('.remove-btn');
        if (removeBtn) {
            removeBtn.closest('.dynamic-row').remove();
            this.saveDraft(); // Re-save after removal
        }
    }
    
    /**
     * A simple debounce utility.
     * @private
     */
    _debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// Export the class for use in other modules (e.g., in app-integration.js)
export default FormManager;

