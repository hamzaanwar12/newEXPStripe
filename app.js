const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/payment-sheet', async (req, res) => {
  // Log the request body
  console.log("Request Received:", req.body);

  try {
    // Create a new customer
    const customer = await stripe.customers.create();

    // Create an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2024-09-30.acacia' }
    );

    // Extract amount from the request body
    const { amount } = req.body; // Amount should be in cents

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // Change the currency if needed
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true, // Enable automatic payment methods
      },
    });

    // Respond with the payment intent, ephemeral key, customer id, and publishable key
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY, // Ensure you have this in your .env file
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
