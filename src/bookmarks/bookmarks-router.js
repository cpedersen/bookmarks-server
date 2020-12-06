const express = require('express')
const { v4: uuid } = require('uuid');
const logger = require('../logger')
const { isWebUri } = require('valid-url')
const xss = require('xss')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

/* -------------------------------------------------------- */
/*                 SERIALIZE BOOKMARKS                      */
/* -------------------------------------------------------- */
const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})

/* -------------------------------------------------------- */
/*                    BOOKMARKS                             */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    BookmarksService.getBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializeBookmark))
          })
        .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    console.log(req.body);
    //Add checks that required fields are provided
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`${field} is required`)
      }
    }
    
    //Store all fields in req.body
    const { title, url, description, rating } = req.body
    const ratingNum = Number(rating)

    //Check rating value
    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      logger.error(`Invalid rating '${ratingNum}'`)
      return res.status(400).send(`'rating' must be between 0 and 5`)
    }

    //Check url format
    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      return res.status(400).send(`'url' must be a valid URL`)
    }

    //Store all fields in newBookmark var
    const newBookmark = { title, url, description, rating }
    
    //Create valid bookmark
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        logger.info(`Card with id ${bookmark.id} created.`)
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  })

/* -------------------------------------------------------- */
/*                   BOOKMARKS ID                           */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.getById(req.app.get('db'), bookmark_id)
        .then(bookmark => {
          // Make sure we found a bookmark
          if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found`);
            return res.status(404).json({ 
              error: {message: `Bookmark not found`}
            })
          }
          // Set the correct bookmark
          res.bookmark = bookmark
          next()
        })
        .catch(next)
})
.get((req, res) => {
  res.json(serializeBookmark(res.bookmark))
})
.delete((req, res, next) => {
    const { bookmark_id } = req.params;
    //Delete bookmark in the DB
    BookmarksService.deleteBookmark(
        req.app.get('db'),
        bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted`)
        res.status(204).end()
      })
      .catch(next)
})

module.exports = bookmarksRouter  
