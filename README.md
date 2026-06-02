# Sohail Smart Solutions — Phase 1 Backend API

**Developer:** Abdul Rahim Riaz Ahamed  
**Stack:** Node.js, Express, PostgreSQL  

## Overview
This is a minimal, working backend API built for the Phase 1 Backend Builder Validation. It connects to a local PostgreSQL database, manages environment variables securely, and exposes two fundamental REST endpoints.

## Setup Instructions
1. Install dependencies: `npm install express pg dotenv`
2. Create a local PostgreSQL database named `sohail_db`.
3. Run the SQL commands in `schema.sql` to build the database table.
4. Update the `.env` file with your local database credentials.
5. Start the server: `node server.js`

## API Endpoints

### 1. View Tasks
* **Method:** `GET`
* **URL:** `/api/tasks`
* **Description:** Retrieves a list of all current tasks in the database.

### 2. Create Task
* **Method:** `POST`
* **URL:** `/api/tasks`
* **Body (JSON):**
  ```json
  {
    "title": "New Assignment",
    "description": "Test description",
    "deadline": "2026-06-10 12:00:00"
  }