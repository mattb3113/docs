/**
 * @module form-manager
 * @description Manages the main input form, including saving/loading drafts to localStorage
 * and gathering data for calculations.
 */

const FORM_ID = 'paystub-form';
const DRAFT_STORAGE_KEY = 'buell_docs_v4_draft';

class FormManager {
    constructor(onFormChange) {
        this.form = document.getElementById(FORM_ID);
        if (!this.form) {
            throw new Error(`Form with ID "${FORM_ID}" not found.`);
        }
        this.onFormChange = onFormChange;
    }

    /**
     * Initializes the form manager by attaching event listeners and loading any saved drafts.
     */
    init() {
        // Use event delegation for efficiency
        this.form.addEventListener('input', (e) => {
            this.handleInput(e.target);
        });

        this.loadDraft();
        // Trigger initial calculation
        this.onFormChange(this.getFormData());
    }

    /**
     * Handles input events on the form.
     * @param {HTMLElement} target The element that triggered the event.
     */
    handleInput(target) {
        // Basic validation could be added here if needed
        const formData = this.getFormData();
        this.saveDraft(formData);
        this.onFormChange(formData);
    }

    /**
     * Gathers all data from the form into a single object.
     * @returns {object} An object containing all form field values.
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    /**
     * Saves the current form data to localStorage.
     * @param {object} formData The data to save.
     */
    saveDraft(formData) {
        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        } catch (error) {
            console.warn("Could not save draft to localStorage:", error);
        }
    }

    /**
     * Loads form data from localStorage and populates the form.
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (draft) {
                const formData = JSON.parse(draft);
                for (const key in formData) {
                    if (this.form.elements[key]) {
                        const element = this.form.elements[key];
                        if(element.type === 'radio') {
                           if(element.value === formData[key]) {
                               element.checked = true;
                           }
                        } else {
                           element.value = formData[key];
                        }
                    }
                }
                console.log("Draft loaded from localStorage.");
            }
        } catch (error) {
            console.warn("Could not load draft from localStorage:", error);
        }
    }
}

export default FormManager;
