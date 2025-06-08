/**
 * @module pdf-generator
 * @description Handles the creation and downloading of a PDF version of the paystub.
 * It uses html2canvas to capture the preview and jsPDF to create the document.
 */

// Note: jsPDF and html2canvas must be included in the HTML file via CDN.

/**
 * Generates a PDF from the paystub preview element.
 * @param {string} filename The desired filename for the downloaded PDF.
 */
export async function generatePdf(filename = 'paystub.pdf') {
    const previewElement = document.getElementById('preview-container');
    if (!previewElement) {
        console.error('Preview element not found!');
        return;
    }

    const loader = document.getElementById('loader');
    const downloadBtn = document.getElementById('download-pdf-btn');
    
    // Show loader, hide button
    if(loader) loader.style.display = 'block';
    if(downloadBtn) downloadBtn.disabled = true;

    try {
        const canvas = await html2canvas(previewElement, {
            scale: 2, // Improve resolution
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 page size: 210mm x 297mm. We'll use a 10mm margin.
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // width with margin
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Check if it fits, if not, scale down.
        const pageHeight = pdf.internal.pageSize.getHeight() - 20;
        let finalPdfHeight = pdfHeight;
        if(pdfHeight > pageHeight) {
           finalPdfHeight = pageHeight;
        }


        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, finalPdfHeight);
        pdf.save(filename);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('There was an error generating the PDF. Please try again.');
    } finally {
        // Hide loader, re-enable button
        if(loader) loader.style.display = 'none';
        if(downloadBtn) downloadBtn.disabled = false;
    }
}
