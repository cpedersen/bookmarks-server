module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DB_URL || 'postgresql://dunder_mifflin@localhost/bookmarks',
  //API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
  API_TOKEN: process.env.API_TOKEN || 'a564a5e6-1dcb-4024-98d7-408705e51acb',
  TEST_DB_URL: process.env.TEST_DB_URL || 'postgresql://dunder_mifflin@localhost/bookmarks_test',
}
