// At the very top of the test file
process.env.NODE_ENV = 'test'; // Set NODE_ENV immediately to suppress logs

import request from 'supertest';
import app from '../../app.js'; 
import { connection } from '../../databases/dbConnection.js'; 
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

// Import the named export
import { cardiologistSchema } from '../../databases/models/cardiologists.js';

// Mock the cardiologistSchema
jest.mock('../../databases/models/cardiologists.js', () => {
  const mockCardiologist = {
    id: 1,
    email: 'cardiologist@example.com',
    password: 'hashedPassword123',
    toJSON: jest.fn(function () {
      return { id: this.id, email: this.email, password: this.password };
    }),
  };

  return {
    cardiologistSchema: {
      findOne: jest.fn(),
      mockCardiologist,
    },
    cardiologistValidationSchema: jest.fn(),
    cardiologistUpdateSchema: jest.fn(),
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(), 
  hash: jest.fn(), 
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

let server;

beforeAll((done) => {
  // Set JWT_SECRET_KEY for tests
  process.env.JWT_SECRET_KEY = 'test-secret';
  server = app.listen(0, () => {
    done();
  });
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await connection.close();
  // Increase timeout to ensure all async operations complete
  await new Promise((resolve) => setTimeout(resolve, 2000));
});

describe('POST /home/cardiologist/login', () => {
  // beforeEach(() => {
  //   jest.clearAllMocks();
  //   // Ensure mocks are properly set
  //   cardiologistSchema.findOne = jest.fn();
  //   // bcrypt.compare.mockClear(); 
  // });

  test('should login a cardiologist successfully', async () => {
    const { mockCardiologist } = cardiologistSchema;
    cardiologistSchema.findOne.mockResolvedValue(mockCardiologist);
    bcrypt.compare.mockResolvedValue(true); // Mock async behavior
    jwt.sign.mockReturnValue('mocked-jwt-token');

    const response = await request(app)
      .post('/home/cardiologist/login')
      .send({
        email: 'cardiologist@example.com',
        password: 'password123',
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({
      message: 'Logged in successfully',
      cardiologist: {
        id: 1,
        email: 'cardiologist@example.com',
      },
      Token: 'mocked-jwt-token',
    });

    expect(cardiologistSchema.findOne).toHaveBeenCalledWith({
      where: { email: 'cardiologist@example.com' },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    expect(jwt.sign).toHaveBeenCalledWith(
      { email: 'cardiologist@example.com', id: 1, role: 'cardiologist' },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );
  });

  test('should return 404 if email is incorrect', async () => {
    cardiologistSchema.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/home/cardiologist/login')
      .send({
        email: 'wrong@example.com',
        password: 'password123',
      })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toEqual({
      message: 'Invalid email or password',
    });

    expect(cardiologistSchema.findOne).toHaveBeenCalledWith({
      where: { email: 'wrong@example.com' },
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('should return 404 if password is incorrect', async () => {
    const { mockCardiologist } = cardiologistSchema;
    cardiologistSchema.findOne.mockResolvedValue(mockCardiologist);
    bcrypt.compare.mockResolvedValue(false); // Mock async behavior

    const response = await request(app)
      .post('/home/cardiologist/login')
      .send({
        email: 'cardiologist@example.com',
        password: 'wrongPassword',
      })
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toEqual({
      message: 'Invalid email or password',
    });

    expect(cardiologistSchema.findOne).toHaveBeenCalledWith({
      where: { email: 'cardiologist@example.com' },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword123');
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test('should return 500 if there is a server error', async () => {
    cardiologistSchema.findOne.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/home/cardiologist/login')
      .send({
        email: 'cardiologist@example.com',
        password: 'password123',
      })
      .expect('Content-Type', /json/)
      .expect(500);

    expect(response.body).toEqual({
      message: 'Error logging in cardiologist',
      error: 'Database error',
    });

    expect(cardiologistSchema.findOne).toHaveBeenCalledWith({
      where: { email: 'cardiologist@example.com' },
    });
  });
});