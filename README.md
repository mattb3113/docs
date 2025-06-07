# docs
professional docs

## Performance Optimization Notes

* **Image Handling:** Uploaded logos are scaled down in the browser to a maximum of about 300 px on either side and exported with slight PNG compression (quality ≈ 0.7). This keeps the base64 Data URL small so the draft JSON stays under the ∼4 MB LocalStorage limit.
* **Lazy Loading:** Should large images be added to informational pages (e.g. `about_buelldocs.html`), add `loading="lazy"` on the `<img>` tags to defer loading until they are in view.
* **Code Splitting:** For future enhancements with heavier JavaScript, dynamic imports such as `import('./module.js').then(...)` can be used to load modules only when necessary. This requires switching the main script to an ES module.

## Running the Payment Server

A minimal Node.js server is included under `server/` to handle Stripe payments and email the generated paystub PDF. Copy `.env.example` to `.env` and fill in your Stripe and SMTP credentials.

```bash
cd server
npm install
npm start
```

The client app will post form data to `/create-checkout-session` and redirect to Stripe Checkout. After payment success, the server uses a webhook to generate the PDF and email it to the provided address.

## Final Integration Overview

The paystub generator initializes on `DOMContentLoaded` and immediately displays the first step. All navigation buttons are managed through delegated listeners so dynamically added elements work seamlessly. Every form input registers handlers for validation and live preview updates.

Event flow: **user interaction → validation → step update → preview refresh**. Missing critical elements are reported via `console.error`. Invalid data triggers inline visual feedback while preview issues fall back to placeholder values.

To verify a build:

1. Navigate through the steps and ensure next/previous controls work.
2. Confirm salary amounts format as currency when blurring the input.
3. Modify any field and check that the preview updates immediately.
4. Watch the progress indicator to verify accurate tracking of the current step.
5. Confirm that YTD values reflect the number of pay periods elapsed for the selected pay frequency.

## Tax Rate Data

The repository stores tax constants for calculations in a standalone JSON file located at `server/data/tax_rates_2025.json`. Updating the data for a new year only requires replacing this file or adding another year-specific JSON file, keeping the application logic unchanged.
