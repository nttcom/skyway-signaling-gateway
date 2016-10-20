/**
 * entry point : index.js
 *
 */

const { createStore, applyMiddleware } = require('redux')
const thunkMiddleware = require('redux-thunk').default
const rootReducer = require('./reducers')

// const createLogger = require('redux-logger')
// const loggerMiddleware = createLogger()

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware
  )
)

module.exports = store
