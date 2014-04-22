require('./init');
var expect = require('chai').expect;
var request = require('supertest');
var _ = require('underscore');
var userController = require('../lib/api/' + API_VERSION + '/user-controller')();

describe('User controller', function() {
  before(function(done) {
    user = {
      provider: 'test',
      username: 'test-user',
      email: 'test@example.com',
      password: 'letmein'
    };
    done();
  });

  describe('POST /api/' + API_VERSION + '/user', function() {
    it('should create a new user', function(done) {
      request(userController)
        .post('/api/' + API_VERSION + '/user')
        .send(user)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('_id');
          user._id = res.body._id;
          done();
        });
    });
  });

  describe('GET /api/' + API_VERSION + '/user/:username', function() {
    it('should return user', function(done) {
      request(userController)
        .get('/api/' + API_VERSION + '/user/' + user.username)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          compare.call(this, res.body, user);
          done();
        });
    });
  });

  describe('PUT /api/' + API_VERSION + '/user/:username', function() {
    it('should update user', function(done) {
      user.email = 'updated@example.com';
      request(userController)
        .put('/api/' + API_VERSION + '/user/' + user.username)
        .send(user)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          compare.call(this, res.body, user);
          done();
        });
    });
  });

  describe('GET /api/' + API_VERSION + '/user', function() {
    it('should get a list of all users', function(done) {
      request(userController)
        .get('/api/' + API_VERSION + '/user')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.an.instanceof(Array);
          expect(res.body).to.not.be.empty;
          compare(_.findWhere(res.body, {_id: user._id}), user);
          done();
        });
    });
  });

  describe('DELETE /api/' + API_VERSION + '/user/:username', function() {
    it('should delete user', function(done) {
      request(userController)
        .del('/api/' + API_VERSION + '/user/' + user.username)
        .expect(200)
        .end(function(err, res) {
          request(userController)
            .get('/api/' + API_VERSION + '/user/' + user.username)
            .expect(404, done);
        });
    });
  });

});

var compare = function(a, b) {
  for (var attr in a) {
    if (attr === 'password') {
      expect(a[attr]).to.not.equal(b[attr]);
    } else if (b[attr]) {
      expect(a[attr]).to.equal(b[attr]);
    }
  }
}
