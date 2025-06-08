// server/server.js

const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Serve static files (HTML, CSS, JS) from the parent directory (the project root)
app.use(express.static(path.join(__dirname, '..')));

// --- API Endpoints ---

// API endpoint to get tax rates for a specific year
app.get('/api/tax-rates/:year', (req, res) => {
  const { year } = req.params;
  const filePath = path.join(__dirname, 'data', `tax_rates_${year}.json`);

  // Check if the requested data file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Tax data for the year ${year} not found.` });
  }

  // Read the JSON file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tax data file:', err);
      // Send a server error response
      return res.status(500).json({ error: 'Failed to read tax data.' });
    }

    try {
      // Parse the file content as JSON
      const taxRates = JSON.parse(data);
      // Send the JSON data as the response
      res.json(taxRates);
    } catch (parseErr) {
      console.error('Error parsing tax data JSON:', parseErr);
      // Send a server error response if JSON is malformed
      return res.status(500).json({ error: 'Failed to parse tax data.' });
    }
  });
});

// --- Server Activation ---

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
