require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..'))); // serve frontend

const sessions = new Map();

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { email, formData } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'BuellDocs Paystub' },
          unit_amount: 2999
        },
        quantity: 1
      }],
      customer_email: email,
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`
    });

    sessions.set(session.id, { email, formData });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Unable to create Stripe session' });
  }
});

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stored = sessions.get(session.id);
    if (stored) {
      generatePaystubAndEmail(stored.email, stored.formData);
      sessions.delete(session.id);
    }
  }

  res.json({ received: true });
});

function generatePaystubAndEmail(email, data) {
  const doc = new PDFDocument();
  const filePath = `tmp/paystub-${Date.now()}.pdf`;
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(18).text('BuellDocs Paystub', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Employee: ${data.employeeName || 'N/A'}`);
  doc.text(`Pay Date: ${data.payDate || 'N/A'}`);
  doc.text(`Net Pay: ${data.netPay || 'N/A'}`);
  doc.end();

  doc.on('finish', () => {
    sendEmailWithAttachment(email, filePath);
  });
}

function sendEmailWithAttachment(to, filePath) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: 'Your BuellDocs Paystub',
    text: 'Attached is your generated paystub.',
    attachments: [{ filename: 'paystub.pdf', path: filePath }]
  }, (err, info) => {
    fs.unlink(filePath, () => {});
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent:', info.messageId);
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
