import * as Font from './font'
import * as Display from './display'
import * as Button from './button'
import * as Input from './input'
import * as Tag from './tag'
import * as _Drag from './drag'
import * as _Background from './background'
import { css } from '@emotion/css'
const disableUserSelectClassName = css({
  '*': {
    userSelect: 'none !important'
  },
  userSelect: 'none !important'
})
const ClassName = {
  ...Font,
  ...Display,
  ...Button,
  ...Input,
  ...Tag,
  Drag: { ..._Drag },
  Background: { ..._Background },
  disableUserSelect: disableUserSelectClassName
}

export default ClassName
