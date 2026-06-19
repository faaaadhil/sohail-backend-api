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

## Running Automated Tests
This API is fully tested using Jest and Supertest. To run the integration test suite:
1. Ensure your `.env` file is properly configured with your PostgreSQL credentials.
2. Run the following command in your terminal:
   `npm test`

## Deployment

This API is deployed live on [Render](https://render.com/) and uses a managed PostgreSQL cloud database.
git add README.md
**Live Base URL:** `https://sohail-backend-api.onrender.com`

### How it's Hosted & Redeployment
The application is connected directly to the `main` branch of this GitHub repository. Render is configured for continuous deployment. Any new features or fixes that are pushed or merged into the `main` branch will automatically trigger a new build and redeploy the live server within minutes.

### Security Confirmation
All sensitive variables (including the `DATABASE_URL` and `JWT_SECRET`) are securely injected directly into the Render host environment variables. The local `.env` file is strictly included in `.gitignore` to ensure no production secrets are ever committed to version control.