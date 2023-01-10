import * as Font from './font'
import * as Display from './display'
import * as Button from './button'
import * as Input from './input'
import * as Tag from './tag'
import * as _Drag from './drag'
const ClassName = {
  ...Font,
  ...Display,
  ...Button,
  ...Input,
  ...Tag,
  Drag: { ..._Drag }
}

export default ClassName
