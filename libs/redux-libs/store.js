const { createStore, applyMiddleware } = require('redux')
const thunkMiddleware = require('redux-thunk').default
const rootReducer = require('./reducers')

const store = createStore(
  rootReducer,
  applyMiddleware(
    thunkMiddleware
  )
)

module.exports = store
