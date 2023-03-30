import React from 'react'
import { Editor, Range, Element as SlateElement, Ancestor, Descendant } from 'slate'

import ElementComponent from '../components/element'
import TextComponent from '../components/text'
import { ReactEditor } from '../plugin/react-editor'
import { useSlateStatic } from './use-slate-static'
import { useDecorate } from './use-decorate'
import { NODE_TO_INDEX, NODE_TO_PARENT } from '../utils/weak-maps'
import { RenderElementProps, RenderLeafProps, RenderPlaceholderProps } from '../components/editable'
import { SelectedContext } from './use-selected'
import { Virtualizer } from '@tanstack/react-virtual'

/**
 * Children.
 */

const useVirtualChildren = (props: {
  decorations: Range[]
  node: Ancestor
  renderElement?: (props: RenderElementProps) => JSX.Element
  renderPlaceholder: (props: RenderPlaceholderProps) => JSX.Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  selection: Range | null
  virtualizer?: Virtualizer<Element, Element>
}) => {
  const { decorations, node, renderElement, renderPlaceholder, renderLeaf, selection, virtualizer } = props
  const decorate = useDecorate()
  const editor = useSlateStatic()

  return virtualizer?.getVirtualItems().map(row => {
    const { index } = row
    const element = node.children[index]
    const path = [index]
    const key = ReactEditor.findKey(editor, element)
    const range = Editor.range(editor, path)
    const sel = selection && Range.intersection(range, selection)
    const ds = decorate([element, path])
    for (const dec of decorations) {
      const d = Range.intersection(dec, range)
      if (d) {
        ds.push(d)
      }
    }
    NODE_TO_INDEX.set(element, index)
    NODE_TO_PARENT.set(element, node)
    if (SlateElement.isElement(element)) {
      return (
        <ElementComponent
          decorations={ds}
          element={element}
          key={key.id}
          renderElement={renderElement}
          renderPlaceholder={renderPlaceholder}
          renderLeaf={renderLeaf}
          selection={sel}
          innerRef={virtualizer?.measureElement}
        />
      )
    }
  })
}

export default useVirtualChildren
