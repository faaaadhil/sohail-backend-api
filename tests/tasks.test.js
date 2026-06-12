const request = require('supertest');
const app = require('../server');

let token;
let taskId;

// We create a fresh user for this specific test file
const testUser = {
  full_name: "Task Tester",
  email: `tasktester_${Date.now()}@example.com`,
  password: "password123"
};

describe('Task API Tests (CRUD)', () => {

  // Arrange: Before any tests run, register the user and get their token
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    token = res.body.token; // Save the token to use in the headers below!
  });

  it('should create a new task (POST)', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: "Automated Test Task",
        description: "Testing POST route",
        deadline: "2026-12-31"
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('task');
    taskId = res.body.task.task_id; // Save the ID so we can update/delete it later
  });

  it('should retrieve all tasks for the user (GET)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it('should update the existing task (PUT)', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: "Updated Title via Jest" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.task.title).toEqual("Updated Title via Jest");
  });

  it('should delete the task (DELETE)', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
  });
});