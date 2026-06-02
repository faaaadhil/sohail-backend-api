require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Securely connect to PostgreSQL using the .env variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the connection
pool.connect()
    .then(() => console.log('Connected to PostgreSQL successfully.'))
    .catch(err => console.error('Database connection error', err.stack));

// ENDPOINT 1: View all tasks (GET)
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
});

// ENDPOINT 2: Create a new task (POST)
app.post('/api/tasks', async (req, res) => {
    const { title, description, deadline } = req.body;
    
    if (!title || !deadline) {
        return res.status(400).json({ error: 'Title and deadline are required' });
    }

    try {
        const queryText = 'INSERT INTO tasks (title, description, deadline) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(queryText, [title, description, deadline]);
        res.status(201).json({ message: 'Task created', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sohail API running on port ${PORT}`);
}); 