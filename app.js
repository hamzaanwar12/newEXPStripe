// appp.js

const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClerkClient } = require("@clerk/backend");

dotenv.config();

const app = express();

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY, // Ensure this is defined in your .env file
});

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-10-28.acacia", // Update to your desired Stripe API version
});

// console.log("Stripe API Secret Key:", process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// POST /payment-sheet endpoint
app.post("/payment-sheet", async (req, res) => {
  // Log the request body for debugging
  console.log("Request Received:", req.body);

  try {
    // Create a new customer
    const customer = await stripe.customers.create();

    // Create an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-10-28.acacia" } // Ensure this matches your Stripe API version
    );

    // Extract amount from the request body
    const { amount } = req.body; // Amount should be in cents

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ error: "Invalid amount provided." });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd", // Change the currency if needed
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
    console.error("Error in /payment-sheet:", error);
    res.status(500).send({ error: error.message });
  }
});

// Corrected GET / route
app.get("/", (req, res) => {
  // res.send(`Hello, World! + Stripe API Secret Key: ${process.env.STRIPE_SECRET_KEY}`);
  res.send(`Hello, World! `);
});

// DELETE /delete-user/:userID endpoint
app.delete("/delete-user/:userID", async (req, res) => {
  const { userID } = req.params;

  try {
    // Check if userID is provided
    if (!userID) {
      return res.status(400).json({ error: "User ID is required." });
    }
    console.log("Attempting to delete user with ID:", userID);

    // Attempt to delete the user
    await clerkClient.users.deleteUser(userID);

    res
      .status(200)
      .json({
        message: `User with ID ${userID} has been deleted successfully.`,
      });
  } catch (error) {
    console.error(`Error deleting user with ID ${userID}:`, error);

    // Respond with appropriate error messages
    if (error.status === 404) {
      return res
        .status(404)
        .json({ error: `User with ID ${userID} not found.` });
    }

    res
      .status(500)
      .json({ error: "An error occurred while trying to delete the user." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
