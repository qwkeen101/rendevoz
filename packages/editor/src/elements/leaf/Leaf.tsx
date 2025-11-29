import { RenderLeafProps } from '@/core'
import { CSSProperties } from 'react'
import { Colors } from '@/consts'
import classnames from 'classnames'
import ClozeLeaf from './ClozeLeaf'
import HighlightLeaf from './HighlightLeaf'

export default (props: RenderLeafProps) => {
  let { leaf, attributes, children, text } = props
  const style: CSSProperties = {
    fontSize: leaf.fontSize,
    color: leaf.fontColor,
    backgroundColor: leaf.backgroundColor
      ? `rgb(from ${Colors.getAdaptColor(leaf.backgroundColor)} r g b / var(--editor-bg-opacity))`
      : undefined
  }
  if (leaf.cloze) {
    return <ClozeLeaf {...props} />
  }
  if (leaf.sup) {
    children = <sup>{children}</sup>
  }
  if (leaf.highlight) {
    return <HighlightLeaf text={text} leaf={leaf} attributes={attributes} style={style} children={children} />
  }
  const keys = Object.keys(leaf)
  return (
    <span className={keys.length ? classnames(...keys) : undefined} {...attributes} style={style}>
      {children}
    </span>
  )
}
