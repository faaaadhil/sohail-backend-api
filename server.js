require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
// AUTHENTICATION MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ error: 'Access Denied: No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
        req.user = user; // Attach the decoded user info to the request
        next();
    });
};

// Role-Based Authorization Middleware
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        // Double-check that the user exists (authenticateToken should have caught this, but it's safe to check)
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: No user data found." });
        }

        // Check if the user's role is in the list of allowed roles for this route
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: "Forbidden: You do not have the required role to access this resource." 
            });
        }

        // If their role matches, let them through!
        next();
    };
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Validation Error: Email, password, and full name are required.' });
    }

    try {
        // Check for duplicate email
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert into database
        const queryText = 'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role';
        const result = await pool.query(queryText, [email, passwordHash, full_name]);

        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Validation Error: Email and password are required.' });
    }

    try {
        // Find user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==========================================
// PROTECTED TASK ENDPOINTS (Require Auth)
// ==========================================

// 1. READ: View all tasks owned by the logged-in user (GET)
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        // ONLY fetch tasks belonging to req.user.id
        const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY task_id ASC', [req.user.id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching tasks' });
    }
});

// 2. CREATE: Add a new task for the logged-in user (POST)
app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { title, description, deadline } = req.body;
    
    if (!title || !deadline) {
        return res.status(400).json({ error: 'Validation Error: Title and deadline are required fields.' });
    }

    try {
        // Insert task AND attach the user_id
        const queryText = 'INSERT INTO tasks (title, description, deadline, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(queryText, [title, description, deadline, req.user.id]);
        res.status(201).json({ message: 'Task created successfully', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating task' });
    }
});

// 3. UPDATE: Modify an existing task owned by the user (PUT)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline } = req.body;

    if (!title && !description && !deadline) {
        return res.status(400).json({ error: 'Validation Error: Please provide fields to update.' });
    }

    try {
        // Update ONLY if task_id AND user_id match
        const queryText = 'UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), deadline = COALESCE($3, deadline) WHERE task_id = $4 AND user_id = $5 RETURNING *';
        const result = await pool.query(queryText, [title, description, deadline, id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task not found or you do not have permission to edit it.` });
        }

        res.status(200).json({ message: 'Task updated successfully', task: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating task' });
    }
});

// 4. DELETE: Remove a task owned by the user (DELETE)
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Delete ONLY if task_id AND user_id match
        const result = await pool.query('DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: `Task not found or you do not have permission to delete it.` });
        }

        res.status(200).json({ message: `Task deleted successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting task' });
    }
});

// ==========================================
// ADMIN ONLY ENDPOINTS
// ==========================================

// View all users in the system (Admin only)
app.get('/api/admin/users', authenticateToken, authorizeRoles('Admin', 'Supervisor'), async (req, res) => {
    try {
        // Fetch all users (excluding passwords for safety)
        const result = await pool.query('SELECT id, email, full_name, role, created_at FROM users');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// Global Error Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sohail API running on port ${PORT} with JWT Auth`);
});