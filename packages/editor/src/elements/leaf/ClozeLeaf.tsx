import { RenderLeafProps } from '@/core'
import { CSSProperties, useState } from 'react'
import { Colors } from '@/consts'
import classnames from 'classnames'
import HighlightLeaf from './HighlightLeaf'

export default (props: RenderLeafProps) => {
  const [disableCloze, setDisableCloze] = useState(false)
  let { leaf, attributes, children, text } = props
  const { text: leafText, ...rest } = leaf
  const style: CSSProperties = {
    color: leaf.cloze && !disableCloze ? 'transparent' : leaf.fontColor,
    fontSize: leaf.fontSize,
    backgroundColor: leaf.cloze && !disableCloze ? 'var(--emphasis)' : Colors.getAdaptColor(leaf.backgroundColor),
    boxShadow: leaf.cloze && disableCloze ? '0 0 0 1px var(--emphasis)' : undefined
  }
  const handleClick = e => {
    e.preventDefault()
    setDisableCloze(!disableCloze)
  }
  if (leaf.sup) {
    children = <sup>{children}</sup>
  }
  if (leaf.highlight) {
    return <HighlightLeaf text={text} leaf={leaf} attributes={attributes} style={style} children={children} />
  }
  return (
    <span className={classnames(...Object.keys(rest))} {...attributes} onClick={handleClick} style={style}>
      {children}
    </span>
  )
}
