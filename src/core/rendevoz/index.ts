import Notification from './notification'
import Open from './open'
import State from './state'
import Layout from './layout'
import Emit from './event'
import Object from './utils/object'
import DOM from './events/dom'
import { default as ActionUtils } from './utils'
import { IRendevoz } from '~/typings'
import Store from './store'
import MetaUtils from './utils/meta'
import * as InnerHooks from './hooks'
import * as InnerComponents from './components'

export const Rendevoz: IRendevoz = {
  Actions: {
    Open,
    State,
    Notification,
    Layout,
    Utils: ActionUtils,
    Store
  },
  Events: {
    Emit,
    DOM
  },
  Utils: {
    Object,
    Meta: MetaUtils
  },
  InnerHooks,
  InnerComponents
}
