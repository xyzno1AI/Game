const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Game = require('../../models/Game');

describe('Game Integration', () => {
  let authToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Game.deleteMany({});

    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'password123'
    });
    await user.save();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('Game Creation and Joining', () => {
    test('should create and join game successfully', async () => {
      const createResponse = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          boardSize: 19,
          timeControl: { mainTime: 1800, increment: 30 }
        })
        .expect(201);

      const gameId = createResponse.body.data.game._id;
      expect(gameId).toBeDefined();

      const user2 = new User({
        username: 'testuser2',
        email: 'test2@example.com',
        passwordHash: 'password123'
      });
      await user2.save();

      const login2Response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser2',
          password: 'password123'
        });

      const joinResponse = await request(app)
        .post(`/api/games/${gameId}/join`)
        .set('Authorization', `Bearer ${login2Response.body.data.token}`)
        .expect(200);

      expect(joinResponse.body.data.game.players).toHaveLength(2);
      expect(joinResponse.body.data.game.status).toBe('playing');
    });
  });

  describe('Game Moves', () => {
    test('should make valid moves', async () => {
      const createResponse = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ boardSize: 19 });

      const gameId = createResponse.body.data.game._id;

      const user2 = new User({
        username: 'testuser2',
        email: 'test2@example.com',
        passwordHash: 'password123'
      });
      await user2.save();

      const login2Response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser2',
          password: 'password123'
        });

      await request(app)
        .post(`/api/games/${gameId}/join`)
        .set('Authorization', `Bearer ${login2Response.body.data.token}`);

      const moveResponse = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: { x: 3, y: 3 }
        })
        .expect(200);

      expect(moveResponse.body.data.move.position).toEqual({ x: 3, y: 3 });
    });

    test('should reject invalid moves', async () => {
      const createResponse = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ boardSize: 19 });

      const gameId = createResponse.body.data.game._id;

      const moveResponse = await request(app)
        .post(`/api/games/${gameId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          position: { x: -1, y: 3 }
        })
        .expect(400);

      expect(moveResponse.body.error.code).toBe('INVALID_MOVE');
    });
  });
});
