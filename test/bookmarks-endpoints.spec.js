const knex = require('knex')
const fixtures = require('./bookmarks-fixtures')
const app = require('../src/app')

describe.only('Bookmarks Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('clean the table', () => db('bookmarks').truncate())

  /* -------------------------------------------------------- */
  /*                 Unauthorized Requests                    */
  /* -------------------------------------------------------- */
  describe(`Unauthorized requests`, () => {
    const testBookmarks = fixtures.makeBookmarksArray()

    beforeEach('insert bookmarks', () => {
      return db
          .into('bookmarks')
          .insert(testBookmarks)
    })

    //GET /api/bookmarks
    it(`responds with 200 and an empty list`, () => {
      return supertest(app)
        .get('/api/bookmarks')
        .expect(401)
    })

    //GET /api/bookmarks/:id
    it(`responds with 404 when no bookmark found`, () => {
      return supertest(app)
        .get(`/api/bookmarks/123`)
        .expect(401)
    })

    //DELETE /api/bookmarks/:id
    it(`responds 404 when bookmark not found`, () => {
      return supertest(app)
        .delete(`/api/bookmarks/123`)
        .expect(401)
    })

    //POST /api/bookmarks
    it('adds a new bookmark', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://test.com',
        description: 'test description',
        rating: 1,
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmark)
        .expect(401)
    })
  })

  /* -------------------------------------------------------- */
  /*                 GET /bookmarks                           */
  /* -------------------------------------------------------- */
  describe('GET /api/bookmarks', () => {
    //Given no bookmarks (200 = ok)
    context(`Given no bookmarks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, [])
      })
    })

    //Given bookmarks (200 = ok)
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
            .into('bookmarks')
            .insert(testBookmarks)
      })

      it('GET /api/bookmarks responds with 200 and all of the bookmarks', () => {
          return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks)
      })
    }) 

    //Handle XSS attack
    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          })
      })
    })
  }) 

  /* -------------------------------------------------------- */
  /*           GET /bookmarks/:bookmark_id                    */
  /* -------------------------------------------------------- */
  describe('GET /api/bookmarks/:id', () => {
    //Given no bookmarks (404 = not found)
    context(`Given no bookmarks`, () => {
      it(`responds with 404 when no bookmark found`, () => {
        return supertest(app)
          .get(`/api/bookmarks/123`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, {
            error: { message: `Bookmark not found` }
          })
      })
    })

    //Given bookmarks (200 = ok)
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
            .into('bookmarks')
            .insert(testBookmarks)
      })

      it('GET /api/bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
            .get(`/api/bookmarks/${bookmarkId}`)
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .expect(200, expectedBookmark)
      })
    })

    //Handle XSS attack
    context(`Given an XSS attack bookmark`, () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('/api/bookmarks')
          .insert([maliciousBookmark])
      })

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          })
      })
    })
  })
  
  /* -------------------------------------------------------- */
  /*               POST /bookmarks/                           */
  /* -------------------------------------------------------- */
  describe('POST /api/bookmarks', () => {
    // title error
    it(`responds with 400 missing 'title' if not supplied`, () => {
      const newBookmarkMissingTitle = {
        url: 'https://test.com',
        rating: 1,
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmarkMissingTitle)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'title' is required` }
        })
    })

    //url error
    it(`responds with 400 missing 'url' if not supplied`, () => {
      const newBookmarkMissingUrl = {
        title: 'test-title',
        rating: 1,
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmarkMissingUrl)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'url' is required` }
        })
    })

    //rating error
    it(`responds with 400 missing 'rating' if not supplied`, () => {
      const newBookmarkMissingRating = {
        title: 'test-title',
        url: 'https://test.com'
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmarkMissingRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'rating' is required` }
        })
    })

    //rating range error
    it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
      const newBookmarkInvalidRating = {
        title: 'test-title',
        url: 'https://test.com',
        rating: 'invalid',
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmarkInvalidRating)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'rating' must be a number between 0 and 5` }
        })
    })

    //invalid url error
    it(`responds with 400 invalid 'url' if not a valid URL`, () => {
      const newBookmarkInvalidUrl = {
        title: 'test-title',
        url: 'htp://invalid-url',
        rating: 1,
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmarkInvalidUrl)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(400, {
          error: { message: `'url' must be a valid URL` }
        })
    })

    //POST bookmark (201 = created)
    it('adds a new bookmark', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'https://test.com',
        description: 'test description',
        rating: 1,
      }
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(newBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        )
    })

    //Handle XSS attack
    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
      return supertest(app)
        .post(`/api/bookmarks`)
        .send(maliciousBookmark)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        })
    })
  })

  /* -------------------------------------------------------- */
  /*           DELETE /bookmarks/:bookmark_id                 */
  /* -------------------------------------------------------- */
  describe('DELETE /api/bookmarks/:id', () => {
    //Given no bookmarks (404 = not found)
    context(`Given no bookmarks`, () => {
      it(`responds 404 when bookmark not found`, () => {
        return supertest(app)
          .delete(`/api/bookmarks/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` }
          })
      })
    })

    //Given bookmarks 
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = fixtures.makeBookmarksArray()

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks)
      })

      //Remove bookmark, then verify (204 = no content)
      it('removes the bookmark by ID from the store', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bm => bm.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/api/bookmarks`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          )
      })
    })
  })
})