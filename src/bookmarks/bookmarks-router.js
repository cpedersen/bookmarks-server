const express = require('express')
const { v4: uuid } = require('uuid');
const logger = require('../logger')
//TODO - where find valid-url?
//const { isWebUri } = require('valid-url')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

/* -------------------------------------------------------- */
/*                    BOOKMARKS                             */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    BookmarksService.getBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializeBookmark))
          })
        .catch(error=>{console.log(error)})
    
    //res
    //  .json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    console.log(req.body);
    const { title, url, rating } = req.body;
    //const { title="CNN", url="http://www.cnn.com", description, rating="4" } = req.body;
    if (!title) {
      logger.error(`Title is required`);
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!url) {
      logger.error(`URL is required`);
      return res
        .status(400)
        .send('Invalid data');
    }
    if (!rating) {
      logger.error(`Rating is required`);
      return res
        .status(400)
        .send('Invalid data');
    }
    //TODO - tighten the above
    /*for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`)
        return res.status(400).send(`'${field}' is required`)
      }
    }*/


    //TODO - improve the following 

    // get an id
    const id = uuid();
  
    const card = {
      id,
      title,
      url,
      rating
    };
  
    bookmarks.push(card);
  
    logger.info(`Bookmark with id ${id} created`);
  
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(card);
  })

/* -------------------------------------------------------- */
/*                   BOOKMARKS ID                           */
/* -------------------------------------------------------- */
bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    //const bookmark = bookmarks.find(c => c.id == id);
    BookmarksService.getById(req.app.get('db'), id)
        .then(bookmark => {
          // make sure we found a bookmark
          if (!bookmark) {
            logger.error(`Bookmark with id ${id} not found.`);
            res
            .status(404)
            .send('Bookmark Not Found');
          }
          res.json(bookmark)
        })
        .catch(error=>{console.log(error)})
})

//TODO - use BookmarksService
.delete((req, res) => {
    const { id } = req.params;
  
    const bookmarkIndex = bookmarks.findIndex(li => li.id == id);
  
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }
  
    bookmarks.splice(bookmarkIndex, 1);
  
    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .status(204)
      .end();
})

module.exports = bookmarksRouter  
