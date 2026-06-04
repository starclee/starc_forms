const express = require('express');
const { sql } = require('@vercel/postgres');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded bodies (HTML form data) and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Postgres database table
(async () => {
    try {
        await sql`CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            phone VARCHAR(50),
            email VARCHAR(255),
            city VARCHAR(100),
            country VARCHAR(100)
        );`;
        console.log("Database table initialized.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
})();

// Route: Handle form submission
app.post('/submit', async (req, res) => {
    const { name, phone, email, city, country } = req.body;
    
    try {
        await sql`INSERT INTO submissions (name, phone, email, city, country) VALUES (${name}, ${phone}, ${email}, ${city}, ${country})`;
        
        // Send a simple success response
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h2>Thank you, ${name}! Your form has been submitted successfully.</h2>
                <a href="/">Submit another response</a> 
            </div>
        `);
    } catch (err) {
        console.error(err);
        return res.status(500).send("An error occurred while saving your data.");
    }
});

// Route: API endpoint to fetch all stored data for the admin page
app.get('/api/submissions', async (req, res) => {
    try {
        const { rows } = await sql`SELECT * FROM submissions ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Start the server (only if not running in Vercel's serverless environment)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;
