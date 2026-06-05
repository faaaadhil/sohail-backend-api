# Suhail Smart Solutions — Phase 3 Backend API

## Project Overview
This repository contains the Phase 3 implementation of our secure, RESTful backend API built with Node.js, Express, and PostgreSQL. This phase extends the existing CRUD functionality by introducing a robust JWT-based authentication layer, user management, and relational database constraints to ensure secure resource ownership.

## Features Completed So Far
* Full CRUD functionality for tasks (Create, Read, Update, Delete).
* Global error handling and input validation.
* User registration with `bcrypt` password hashing.
* User login with JSON Web Token (JWT) generation.
* Custom authentication middleware to protect specific routes.
* Relational database enforcement (Tasks belong to specific Users).

## Database Structure
The PostgreSQL database consists of two tables with a one-to-many relationship:

**1. `users` Table**
* `id`: UUID (Primary Key)
* `email`: VARCHAR (Unique, Not Null)
* `password_hash`: VARCHAR (Not Null)
* `full_name`: VARCHAR (Not Null)
* `role`: VARCHAR (Default: 'Student')
* `created_at` / `updated_at`: TIMESTAMP

**2. `tasks` Table**
* `task_id`: SERIAL (Primary Key)
* `title`: VARCHAR (Not Null)
* `description`: TEXT
* `deadline`: TIMESTAMP (Not Null)
* `user_id`: UUID (Foreign Key referencing `users.id` ON DELETE CASCADE)
* `created_at`: TIMESTAMP

## Authentication Flow Overview
1.  **Registration:** A client sends user details to `/api/auth/register`. The server hashes the password and stores the user in the database.
2.  **Login:** A client sends credentials to `/api/auth/login`. The server verifies the password and issues a signed JWT valid for 2 hours.
3.  **Access:** The client attaches the JWT to the `Authorization` header (`Bearer <token>`) for all subsequent requests to protected routes.
4.  **Verification:** Custom middleware intercepts requests to `/api/tasks/*`, verifies the JWT signature, extracts the `user_id`, and attaches it to the request object to enforce ownership rules.

## API Endpoints

### Public Routes
* `POST /api/auth/register` - Register a new user account.
* `POST /api/auth/login` - Authenticate user and receive JWT.

### Protected Routes (Require JWT)
* `GET /api/tasks` - Retrieve all tasks owned by the authenticated user.
* `POST /api/tasks` - Create a new task assigned to the authenticated user.
* `PUT /api/tasks/:id` - Update a task (only if owned by the user).
* `DELETE /api/tasks/:id` - Delete a task (only if owned by the user).

## Setup Instructions
1. Clone the repository: `git clone <repo-url>`
2. Install dependencies: `npm install`
3. Configure your local PostgreSQL database (`sohail_db`) using the provided `schema.sql`.
4. Create a `.env` file in the root directory (ensure this is in your `.gitignore`):
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=sohail_db
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=3000
   JWT_SECRET=your_secure_random_secret_string