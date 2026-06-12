const request = require('supertest');
const app = require('../server'); 

// We use Date.now() to create a unique email every time the test runs, 
// so the database doesn't crash from "email already exists" errors!
const testUser = {
  full_name: "Automated Tester",
  email: `test_${Date.now()}@example.com`,
  password: "securepassword123"
};

describe('Authentication API Tests', () => {
  
  describe('POST /api/auth/register', () => {
    it('should register a new user and return a 201 status', async () => {
      // Act
      const res = await request(app).post('/api/auth/register').send(testUser);
      
      // Assert
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
    });

    it('should block duplicate emails and return an error status', async () => {
      // Act (Sending the exact same user again)
      const res = await request(app).post('/api/auth/register').send(testUser);
      
      // Assert
      expect(res.statusCode).not.toEqual(201); 
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in and return a JWT token', async () => {
      // Act
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password
      });

      // Assert
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject login with wrong password and return 401', async () => {
      // Act
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: "wrongpassword"
      });

      // Assert
      expect(res.statusCode).toEqual(401);
    });
  });
});