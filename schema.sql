CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP NOT NULL
);

INSERT INTO tasks (title, description, deadline) 
VALUES ('Backend Builder Validation', 'Build a working API for phase 1.', '2026-06-02 17:00:00');