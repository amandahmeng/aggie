require('./init');
var expect = require('chai').expect;
var request = require('supertest');
var _ = require('underscore');
var sourceController = require('../lib/api/' + API_VERSION + '/source-controller')();
var Source = require('../models/source');

describe('Source controller', function() {
  before(function(done) {
    source = {
      type: 'twitter',
      keywords: 'test'
    };
    done();
  });

  describe('POST /api/' + API_VERSION + '/source', function() {
    it('should create a new source', function(done) {
      request(sourceController)
        .post('/api/' + API_VERSION + '/source')
        .send(source)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('_id');
          source._id = res.body._id;
          done();
        });
    });
    it('should not allow the creation of multiple twitter sources', function(done) {
      request(sourceController)
        .post('/api/' + API_VERSION + '/source')
        .send({type: 'twitter', keywords: 'test2'})
        .expect(422, 'only_one_twitter_allowed', done);
    });
  });

  describe('GET /api/' + API_VERSION + '/source/:_id', function() {
    it('should return source', function(done) {
      request(sourceController)
        .get('/api/' + API_VERSION + '/source/' + source._id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          compare.call(this, res.body, source);
          done();
        });
    });

    it('should get latest logged events', function(done) {
      // Make sure we use the correct model instance
      Source.findById(source._id, function(err, foundSource) {
        // Log a new event
        foundSource.logEvent('warning', 'This is a test', function(err) {
          request(sourceController)
            .get('/api/' + API_VERSION + '/source/' + source._id)
            .expect(200)
            .end(function(err, res) {
              if (err) return done(err);
              expect(res.body).to.have.property('events');
              expect(res.body).to.have.property('unreadErrorCount')
              expect(res.body.events).to.be.an.instanceof(Array);
              expect(res.body.events).to.have.length(1);
              expect(res.body.unreadErrorCount).to.equal(1);
              source.events = res.body.events;
              source.unreadErrorCount = res.body.unreadErrorCount;
              done();
            });
        });
      });
    });
  });

  describe('PUT /api/' + API_VERSION + '/source/:_id', function() {
    it('should update source', function(done) {
      source.keywords = 'e';
      request(sourceController)
        .put('/api/' + API_VERSION + '/source/' + source._id)
        .send(source)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          compare.call(this, res.body, source);
          done();
        });
    });
    it('should not allow updating source type', function(done) {
      request(sourceController)
        .put('/api/' + API_VERSION + '/source/' + source._id)
        .send({type: 'dummy'})
        .expect(422, 'source_type_change_not_allowed', done);
    });
  });

  describe('PUT /api/' + API_VERSION + '/source/_events/:_id', function() {
    it('should reset unread error count', function(done) {
      expect(source.unreadErrorCount).to.equal(1);
      request(sourceController)
        .put('/api/' + API_VERSION + '/source/_events/' + source._id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('unreadErrorCount');
          expect(res.body.unreadErrorCount).to.equal(0);
          source.unreadErrorCount = res.body.unreadErrorCount;
          done();
        });
    });
    it('should return an empty events array', function(done) {
      request(sourceController)
        .get('/api/' + API_VERSION + '/source/' + source._id)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.have.property('events');
          expect(res.body.events).to.be.an.instanceof(Array);
          expect(res.body.events).to.be.empty;
          done();
        });
    });
  });

  describe('GET /api/' + API_VERSION + '/source', function() {
    it('should get a list of all sources', function(done) {
      request(sourceController)
        .get('/api/' + API_VERSION + '/source')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          expect(res.body).to.be.an.instanceof(Array);
          expect(res.body).to.not.be.empty;
          compare(_.findWhere(res.body, {_id: source._id}), source);
          done();
        });
    });
  });

  describe('DELETE /api/' + API_VERSION + '/source/:_id', function() {
    it('should delete source', function(done) {
      request(sourceController)
        .del('/api/' + API_VERSION + '/source/' + source._id)
        .expect(200)
        .end(function(err, res) {
          request(sourceController)
            .get('/api/' + API_VERSION + '/source/' + source._id)
            .expect(404, done);
        });
    });
  });

  describe('DELETE /api/' + API_VERSION + '/source/_all', function() {
    it('should delete all sources', function(done) {
      request(sourceController)
        .del('/api/' + API_VERSION + '/source/_all')
        .expect(200)
        .end(function(err, res) {
          request(sourceController)
            .get('/api/' + API_VERSION + '/source')
            .expect(200, [], done);
        });
    });
  });

});

var compare = function(a, b) {
  for (var attr in a) {
    if (b[attr]) {
      expect(a[attr]).to.equal(b[attr]);
    }
  }
}
