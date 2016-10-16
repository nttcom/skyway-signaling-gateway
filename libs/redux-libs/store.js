/**
 * entry point : index.js
 *
 */

const { createStore, applyMiddleware } = require('redux')
const thunkMiddleware = require('redux-thunk').default
const createLogger = require('redux-logger')
const rootReducer = require('./reducers')

const loggerMiddleware = createLogger()

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
)

module.exports = store
