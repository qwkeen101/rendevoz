/* eslint-disable @typescript-eslint/no-namespace */
import Notification from './notification'
import Open from './open'
import State from './state'
import Layout from './layout'
import Emit from './event'
import Object from './utils/object'
import DOM from './events/dom'

export namespace Rendevoz {
  export const Actions = {
    Open,
    State,
    Notification,
    Layout
  }
  export const Events = {
    Emit,
    DOM
  }

  export const Utils = {
    Object
  }
}
