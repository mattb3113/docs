const express = require('express');
const cors = require('cors');

// Initialize the Express application
const app = express();

// Define the port the server will run on. Fallback to 5001 if no environment variable is set.
const PORT = process.env.PORT || 5001;

// --- Middleware ---

// Enable Cross-Origin Resource Sharing (CORS) for all routes
app.use(cors());

// --- Routes ---

// A simple GET route for the root endpoint to confirm the API is operational.
app.get('/', (req, res) => {
  res.json({ message: 'BuellDocs v4 API is running' });
});

// --- Server Activation ---

// Start the server and make it listen for incoming requests on the specified port.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
