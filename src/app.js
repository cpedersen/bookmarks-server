require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const validateBearerToken = require('./validate-bearer-token')
const errorHandler = require('./error-handler')
const bookmarksRouter = require('./bookmarks/bookmarks-router')
const winston = require('winston');

const app = express()

/* -------------------------------------------------------- */
/*                  Winston setup                           */
/* -------------------------------------------------------- */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/* -------------------------------------------------------- */
/*                  Morgan setup                            */
/* -------------------------------------------------------- */
/*
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
*/

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}))


/* -------------------------------------------------------- */
/*                  Other setup                             */
/* -------------------------------------------------------- */
app.use(cors())
app.use(helmet())
app.use(validateBearerToken)

/* -------------------------------------------------------- */
/*        Set router after validateBearerToken              */
/* -------------------------------------------------------- */
app.use(bookmarksRouter)
app.use('/api/bookmarks', bookmarksRouter)

/* -------------------------------------------------------- */
/*                         GET /                            */
/* -------------------------------------------------------- */
app.get('/', (req, res) => {
  res.send('Hello, world!')
})

/* -------------------------------------------------------- */
/*                    ERROR HANDLER                         */
/* -------------------------------------------------------- */
app.use(errorHandler)
  

module.exports = app