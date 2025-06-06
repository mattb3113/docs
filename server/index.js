import express from 'express';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Store form data temporarily keyed by session ID
const formStore = new Map();

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { formData, amount } = req.body;
    if (!formData || !formData.userEmail) {
      return res.status(400).json({ error: 'Missing form data' });
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
    formStore.set(session.id, formData);
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
    const formData = formStore.get(session.id);
    if (formData) {
      formStore.delete(session.id);
      sendPaystubEmail(formData).catch(err => console.error('Email error', err));
    }
  }

  res.json({ received: true });
});

async function sendPaystubEmail(formData) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const pdfBuffer = await generatePlaceholderPdf(formData);

  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: formData.userEmail,
    subject: 'Your Paystub',
    text: 'Attached is your generated paystub.',
    attachments: [{ filename: 'paystub.pdf', content: pdfBuffer }],
  });
}

async function generatePlaceholderPdf(formData) {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument();
  const chunks = [];
  doc.text(`Paystub for ${formData.employeeName || 'Employee'}`);
  doc.text(`Company: ${formData.companyName || ''}`);
  doc.text(`Amount: ${formData.desiredIncomeAmount || ''}`);
  doc.end();
  return new Promise(resolve => {
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
