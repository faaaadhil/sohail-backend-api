require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Securely connect to PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL successfully.'))
    .catch(err => console.error('Database connection error', err.stack));

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. READ: View all tasks (GET)
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tasks ORDER BY task_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
});

// 2. CREATE: Add a new task (POST)
app.post('/api/tasks', async (req, res) => {
    const { title, description, deadline } = req.body;
    
    // Validation: Check for required fields
    if (!title || !deadline) {
        return res.status(400).json({ error: 'Validation Error: Title and deadline are required fields.' });
    }

    try {
        const queryText = 'INSERT INTO tasks (title, description, deadline) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(queryText, [title, description, deadline]);
        res.status(201).json({ message: 'Task created successfully', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

// 3. UPDATE: Modify an existing task (PUT)
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline } = req.body;

    // Validation: Ensure body has data to update
    if (!title && !description && !deadline) {
        return res.status(400).json({ error: 'Validation Error: Please provide fields to update.' });
    }

    try {
        const queryText = 'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), deadline = COALESCE($3, deadline) WHERE task_id = $4 RETURNING *';
        const result = await pool.query(queryText, [title, description, deadline, id]);

        // Error Handling: Missing record
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task with ID ${id} not found.` });
        }

        res.status(200).json({ message: 'Task updated successfully', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

// 4. DELETE: Remove a task (DELETE)
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [id]);

        // Error Handling: Missing record
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task with ID ${id} not found.` });
        }

        res.status(200).json({ message: `Task ${id} deleted successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting task' });
    }
});

// Global Error Handler for unknown routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sohail API running on port ${PORT}`);
});