const path = require('path')
const express = require('express')
const xss = require('xss')
const logger = require('../logger')
const BookmarksService = require('./bookmarks-service')

const { v4: uuid } = require('uuid');
const { isWebUri } = require('valid-url')

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
/*              BOOKMARKS - get all, post                       */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializeBookmark))
          })
        .catch(next)
  })
  .post(bodyParser, (req, res, next) => {
    console.log(req.body);
    //Store all fields in req.body
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating }

    //Add checks that required fields are provided
    for (const field of ['title', 'url', 'rating']) {
      if (!newBookmark[field]) {
        logger.error(`${field} is required`)
        return res.status(400).json({error: { message: `'${field}' is required` }})
      }
    }
    const ratingNum = Number(rating)

    //Check rating value
    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      logger.error(`Invalid rating '${ratingNum}'`)
      return res.status(400).json({error: { message: `'rating' must be a number between 0 and 5` }}) 
    }

    //Check url format
    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`)
      //return res.status(400).send(`'url' must be a valid URL`)
      return res.status(400).json({error: {message: `'url' must be a valid URL`}})
    }
    
    //Create valid bookmark
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        logger.info(`Card with id ${bookmark.id} created.`)
        res
          .status(201)
          //.location(`/api/bookmarks/${bookmark.id}`)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(serializeBookmark(bookmark))
      })
      .catch(next)
  })

/* -------------------------------------------------------- */
/*      BOOKMARKS ID - all, get id, delete, patch           */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/:bookmark_id')
  .all((req, res, next) => {
    const { bookmark_id } = req.params;
    //console.log("bookmark_id: " + bookmark_id);
    BookmarksService.getById(req.app.get('db'), bookmark_id)
        .then(bookmark => {
          // Make sure we found a bookmark
          //console.log("bookmark: " + bookmark);
          if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found`);
            return res.status(404).json({ 
              error: {message: `Bookmark Not Found`}
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
  .patch(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const bookmarkToUpdate = { title, url, description, rating }
    console.log("bookmarkToUpdate: " + JSON.stringify(bookmarkToUpdate))

    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
        }
      })

    if (rating) {
      const ratingNum = Number(rating)
      //Check rating value
      if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        logger.error(`Invalid rating '${ratingNum}'`)
        return res.status(400).json({error: { message: `'rating' must be a number between 0 and 5` }}) 
      }
    }

    if (url) {
      //Check url format
      if (!isWebUri(url)) {
        logger.error(`Invalid url '${url}' supplied`)
        //return res.status(400).send(`'url' must be a valid URL`)
        return res.status(400).json({error: {message: `'url' must be a valid URL`}})
      }
    }

    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.bookmark_id,
      bookmarkToUpdate
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = bookmarksRouter
