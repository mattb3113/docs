import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import autoTable from 'jspdf-autotable'; // Conceptually used, actual implementation is manual for pdfkit

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Store form data and calculation results temporarily keyed by session ID
const sessionStore = new Map();

// Helper to format currency
const formatCurrency = (value) => {
    const num = Number(value || 0);
    return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { formData, stubsData, amount } = req.body;
    if (!formData || !stubsData || !formData.userEmail) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Paystub Package' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: formData.userEmail,
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
    });
    sessionStore.set(session.id, { formData, stubsData });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating checkout session', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionData = sessionStore.get(session.id);
    if (sessionData) {
      sendPaystubEmail(sessionData).catch(err => console.error('Email error', err));
      sessionStore.delete(session.id);
    }
  }

  res.json({ received: true });
});

async function sendPaystubEmail({ formData, stubsData }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const pdfBuffer = await generatePaystubPdf(formData, stubsData);

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: formData.userEmail,
    subject: 'Your BuellDocs Paystub Order is Complete',
    text: 'Thank you for your order! Your generated paystub PDF is attached.',
    attachments: [{ filename: 'paystubs.pdf', content: pdfBuffer, contentType: 'application/pdf' }],
  });
   console.log(`Email sent to ${formData.userEmail}`);
}

async function generatePaystubPdf(formData, stubsData) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    
    for (const stub of stubsData) {
        // Header
        doc.fontSize(16).font('Helvetica-Bold').text(formData.companyName || 'Company Name', { continued: true });
        doc.font('Helvetica').fontSize(12).text('EARNINGS STATEMENT', { align: 'right' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(formData.companyStreetAddress || '');
        doc.text(`${formData.companyCity || ''}, ${formData.companyState || ''} ${formData.companyZip || ''}`);
        doc.moveDown(1.5);

        // Employee and Pay Period Info in a simple table
        const infoTop = doc.y;
        doc.text(`Employee: ${formData.employeeFullName || ''}`, { width: 250 });
        doc.text(formData.employeeStreetAddress || '', { width: 250 });
        doc.text(`${formData.employeeCity || ''}, ${formData.employeeState || ''} ${formData.employeeZip || ''}`, { width: 250 });
        doc.text(`SSN: XXX-XX-${(formData.employeeSsn || '').slice(-4)}`, { width: 250 });

        const payDate = new Date(stub.payDate);
        const startDate = new Date(stub.payPeriodStartDate);
        const endDate = new Date(stub.payPeriodEndDate);
        
        doc.text(`Pay Date: ${payDate.toLocaleDateString()}`, 300, infoTop);
        doc.text(`Pay Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 300, doc.y);
        doc.moveDown(2);
        
        const tableStartY = doc.y;

        // Manually draw tables for full control
        const drawTable = (headers, rows, startY) => {
            doc.y = startY;
            const startX = doc.page.margins.left;
            const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const colWidths = headers.map(() => tableWidth / headers.length);
            
            // Header
            doc.font('Helvetica-Bold');
            headers.forEach((header, i) => doc.text(header, startX + (colWidths.slice(0, i).reduce((a, b) => a + b, 0)), doc.y, {width: colWidths[i], align: 'center'}));
            doc.moveDown();

            // Rows
            doc.font('Helvetica');
            rows.forEach(row => {
                const rowY = doc.y;
                row.forEach((cell, i) => doc.text(cell, startX + (colWidths.slice(0, i).reduce((a, b) => a + b, 0)), rowY, {width: colWidths[i], align: 'left'}));
                doc.moveDown();
            });
            return doc.y;
        };

        const earningsHeaders = ['Description', 'Rate', 'Hours', 'Current', 'YTD'];
        const earningsRows = [
            ['Regular Salary', '--', '--', formatCurrency(Number(stub.grossPay) - Number(stub.bonus)), formatCurrency(Number(stub.ytd.gross) + (Number(stub.grossPay) - Number(stub.bonus)))]
        ];
        if (Number(stub.bonus) > 0) {
            earningsRows.push(['Bonus', '--', '--', formatCurrency(stub.bonus), formatCurrency(Number(stub.ytd.bonus) + Number(stub.bonus))]);
        }
        
        let finalY = drawTable(earningsHeaders, earningsRows, tableStartY);
        doc.moveDown(2);

        const deductionsHeaders = ['Deduction', 'Current', 'YTD'];
        const deductionsRows = [
            ['Federal Tax', formatCurrency(stub.federalTax), formatCurrency(Number(stub.ytd.federal) + Number(stub.federalTax))],
            ['Social Security', formatCurrency(stub.socialSecurity), formatCurrency(Number(stub.ytd.ss) + Number(stub.socialSecurity))],
            ['Medicare', formatCurrency(stub.medicare), formatCurrency(Number(stub.ytd.medicare) + Number(stub.medicare))],
            ['Health Insurance', formatCurrency(formData.healthInsurance), formatCurrency(Number(stub.ytd.otherDeductions) + Number(formData.healthInsurance))],
        ];
        if (formData.employeeState === 'New Jersey') {
            deductionsRows.push(['NJ State Tax', formatCurrency(stub.stateTax), formatCurrency(Number(stub.ytd.state) + Number(stub.stateTax))]);
            deductionsRows.push(['NJ SDI', formatCurrency(stub.sdi), formatCurrency(Number(stub.ytd.sdi) + Number(stub.sdi))]);
        }

        finalY = drawTable(deductionsHeaders, deductionsRows, doc.y);
        doc.moveDown(2);

        const summaryHeaders = ['Summary', 'Current', 'YTD'];
        const ytdGross = Number(stub.ytd.gross) + Number(stub.grossPay);
        const ytdDeductions = Number(stub.ytd.federal) + Number(stub.federalTax) + Number(stub.ytd.ss) + Number(stub.socialSecurity) + Number(stub.ytd.medicare) + Number(stub.medicare) + Number(stub.ytd.otherDeductions) + Number(formData.healthInsurance);
        
        const summaryRows = [
            ['Gross Pay', formatCurrency(stub.grossPay), formatCurrency(ytdGross)],
            ['Total Deductions', formatCurrency(stub.totalDeductions), formatCurrency(ytdDeductions)],
            ['Net Pay', formatCurrency(stub.netPay), formatCurrency(ytdGross - ytdDeductions)]
        ];
        
        finalY = drawTable(summaryHeaders, summaryRows, doc.y);

        if (stubsData.indexOf(stub) < stubsData.length - 1) {
            doc.addPage();
        }
    }

    doc.end();
    
    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
    });
}


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
