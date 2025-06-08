/**
 * @file pdf-generator.js
 * @description A professional PDF creation module using jsPDF and html2canvas.
 * This class captures an HTML element, converts it to a high-quality image,
 * and places it within a PDF document with standard check stub dimensions.
 *
 * It is crucial that the host HTML file includes the following libraries,
 * preferably from a CDN, before this script is loaded:
 * - jsPDF: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
 * - html2canvas: https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
 */

// We expect jsPDF to be available on the window object from the CDN script.
const { jsPDF } = window.jspdf;

class PDFGenerator {
  /**
   * Asynchronously generates and downloads a PDF from an HTML element.
   *
   * @param {HTMLElement} previewElement The HTML element representing the paystub preview to be captured.
   * @param {string} employeeName The full name of the employee, used for generating a dynamic filename.
   * @param {string} payDate The pay date in 'YYYY-MM-DD' format, also used for the filename.
   * @returns {Promise<void>} A promise that resolves when the PDF has been saved.
   */
  async generate(previewElement, employeeName, payDate) {
    // --- 1. Input Validation ---
    if (!previewElement || !employeeName || !payDate) {
      console.error("PDFGenerator.generate() requires a preview element, employee name, and pay date.");
      alert("Could not generate PDF: missing required information.");
      return;
    }
    if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') {
        console.error("html2canvas or jsPDF is not loaded. Please include them in your HTML.");
        alert("A required library for PDF generation is missing. Please contact support.");
        return;
    }

    // --- 2. Prepare Element for High-Quality Capture ---
    // We clone the element to apply temporary styles for capture without altering the live UI.
    // This ensures a consistent, high-quality output.
    const clone = previewElement.cloneNode(true);
    
    // Create a temporary container to hold the clone off-screen.
    const captureContainer = document.createElement('div');
    
    // Style the container to be rendered off-screen but with a fixed width
    // that approximates the desired aspect ratio of a check stub. This helps
    // html2canvas render the layout correctly.
    Object.assign(captureContainer.style, {
        position: 'absolute',
        left: '-9999px', // Position it far off-screen to the left.
        top: '0px',
        width: '850px', // A standard width to ensure layout consistency.
        backgroundColor: 'white', // Ensure a solid background.
        padding: '0',
        margin: '0',
    });

    captureContainer.appendChild(clone);
    document.body.appendChild(captureContainer);

    try {
      // --- 3. Capture the Element with html2canvas ---
      const canvas = await html2canvas(clone, {
        scale: 3, // Increase scale for higher DPI (3x resolution). This is key to avoiding blurry text.
        useCORS: true, // Allows loading cross-origin images if any are present.
        logging: false, // Disables console logging from the library for a cleaner output.
        width: clone.offsetWidth,
        height: clone.offsetHeight,
      });

      // --- 4. Initialize jsPDF Document ---
      // Standard US check stubs are typically 8.5" x 3.5" or 8.5" x 3.67".
      const pdf = new jsPDF({
        orientation: 'landscape', // The width is greater than the height.
        unit: 'in', // We specify dimensions in inches.
        format: [8.5, 3.67], // [width, height]
      });

      // --- 5. Add the Captured Image to the PDF ---
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the image's aspect ratio to scale it correctly within the PDF.
      const imgProps = pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let finalImgWidth = pdfWidth;
      let finalImgHeight = pdfWidth / aspectRatio;

      // If the scaled height is too large, we adjust based on the height instead.
      if (finalImgHeight > pdfHeight) {
          finalImgHeight = pdfHeight;
          finalImgWidth = finalImgHeight * aspectRatio;
      }
      
      // Center the image on the page
      const x = (pdfWidth - finalImgWidth) / 2;
      const y = (pdfHeight - finalImgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);

      // --- 6. Save the PDF with a Dynamic Filename ---
      const formattedName = employeeName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `Paystub_${formattedName}_${payDate}.pdf`;
      
      pdf.save(filename);

    } catch (error) {
      console.error("An error occurred during PDF generation:", error);
      alert("Sorry, there was an unexpected error while creating the PDF.");
    } finally {
      // --- 7. Cleanup ---
      // Always remove the temporary container from the DOM after capture.
      document.body.removeChild(captureContainer);
    }
  }
}

export default PDFGenerator;
