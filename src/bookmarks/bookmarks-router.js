const express = require('express')
const { v4: uuid } = require('uuid');
const logger = require('../logger')
const { bookmarks } = require('../store')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

/* -------------------------------------------------------- */
/*                    BOOKMARKS                             */
/* -------------------------------------------------------- */

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res
      .json(bookmarks);
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
    const bookmark = bookmarks.find(c => c.id == id);
  
    // make sure we found a bookmark
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Bookmark Not Found');
    }
  
    res.json(bookmark);
})
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
