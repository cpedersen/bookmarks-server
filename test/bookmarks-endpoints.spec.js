const knex = require('knex')
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

  afterEach('cleanup', () => db('bookmarks').truncate())

  context('Given there are bookmarks in the database', () => {
    const testBookmarks = [
      {
        id: 1,
        title: 'CNN',
        url: 'https://www.cnn.com',
        description: 'Neo-liberal news source',
        rating: 3
      },
      {
        id: 2,
        title: 'FOX',
        url: 'https://www.fox.com',
        description: 'Right wing news source',
        rating: 1
      },
      {
        id: 3,
        title: 'Market Watch',
        url: 'https://www.marketwatch.com',
        description: 'Financial news',
        rating: 5
      },
    ];

    beforeEach('insert bookmarks', () => {
      return db
          .into('bookmarks')
          .insert(testBookmarks)
    })

    it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
        return supertest(app)
        .get('/bookmarks')
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .expect(200, testBookmarks)
    })

    it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2
        const expectedBookmark = testBookmarks[bookmarkId - 1]
        return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .expect(200, expectedBookmark)
    })
  })
})
