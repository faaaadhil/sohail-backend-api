const request = require('supertest');
const app = require('../server');

let tokenA;
let tokenB;
let taskIdFromUserA;

// We need TWO users to test IDOR (User B trying to touch User A's stuff)
const userA = { full_name: "Alice", email: `alice_${Date.now()}@example.com`, password: "password123" };
const userB = { full_name: "Bob", email: `bob_${Date.now()}@example.com`, password: "password123" };

describe('Security & Authorization Tests', () => {

  // Arrange: Set up our two users and have User A create a task
  beforeAll(async () => {
    // Register and login User A
    await request(app).post('/api/auth/register').send(userA);
    const loginA = await request(app).post('/api/auth/login').send({ email: userA.email, password: userA.password });
    tokenA = loginA.body.token;

    // Register and login User B
    await request(app).post('/api/auth/register').send(userB);
    const loginB = await request(app).post('/api/auth/login').send({ email: userB.email, password: userB.password });
    tokenB = loginB.body.token;

    // User A creates a task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: "Alice's Secret Task", deadline: "2026-10-10" });
    
    taskIdFromUserA = taskRes.body.task.task_id;
  });

  it('should deny access if no JWT token is provided (401)', async () => {
    // Act: Try to get tasks without an Authorization header
    const res = await request(app).get('/api/tasks');
    
    // Assert
    expect(res.statusCode).toEqual(401);
  });

  it('should block a standard Student from accessing Admin routes (403)', async () => {
    // Act: User A (a student) tries to view the admin user list
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenA}`);
    
    // Assert
    expect(res.statusCode).toEqual(403);
  });

  it('should prevent User B from deleting User A\'s task [IDOR Protection] (404)', async () => {
    // Act: User B uses THEIR token to try and delete User A's task ID
    const res = await request(app)
      .delete(`/api/tasks/${taskIdFromUserA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    
    // Assert: Our SQL query blocks this and returns a 404!
    expect(res.statusCode).toEqual(404);
  });
});