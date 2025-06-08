/**
 * Main application entry point for BuellDocs v4.
 * This script waits for the DOM to be fully loaded, then initializes the paystub engine.
 */
import PaystubEngine from './js/paystubEngine.js';

// Wait for the DOM to be ready before starting the application
document.addEventListener('DOMContentLoaded', () => {
    const engine = new PaystubEngine();
    engine.start();
});
