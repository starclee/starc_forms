const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded bodies (HTML form data) and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Postgres database table
let dbInitialized = false;

async function initializeDatabase() {
    if (dbInitialized) return;
    try {
        const client = new Client({
            connectionString: process.env.POSTGRES_URL,
        });
        await client.connect();
        await client.query(`CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            phone VARCHAR(50),
            email VARCHAR(255),
            city VARCHAR(100),
            country VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);
        await client.end();
        dbInitialized = true;
        console.log("Database table initialized.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
}

// Route: Handle form submission
app.post('/submit', async (req, res) => {
    const { name, phone, email, city, country } = req.body;
    
    await initializeDatabase();

    try {
        const client = new Client({
            connectionString: process.env.POSTGRES_URL,
        });
        await client.connect();
        await client.query(
            `INSERT INTO submissions (name, phone, email, city, country, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [name, phone, email, city, country]
        );
        await client.end();
        
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
    await initializeDatabase();

    try {
        const client = new Client({
            connectionString: process.env.POSTGRES_URL,
        });
        await client.connect();
        const { rows } = await client.query(`SELECT * FROM submissions ORDER BY id ASC`);
        await client.end();
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Route: API endpoint to reset (clear) all data
app.delete('/api/submissions', async (req, res) => {
    try {
        const client = new Client({
            connectionString: process.env.POSTGRES_URL,
        });
        await client.connect();
        await client.query(`TRUNCATE TABLE submissions`);
        await client.end();
        res.json({ message: "All submissions have been reset." });
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
