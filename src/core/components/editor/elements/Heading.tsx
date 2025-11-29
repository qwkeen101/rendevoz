import { cloneElement, FC, ReactElement, useEffect, useRef, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import { CustomElement, HeadingElement } from '~/typings'
import useEditorInstance from '../hooks/useEditorInstance'

export const HeadingToLevel: Partial<Record<CustomElement['type'], number>> = {
  'heading-one': 1,
  'heading-two': 2,
  'heading-three': 3,
  'heading-four': 4,
  'heading-five': 5,
  'heading-six': 6
}
const HeadingToElement: Partial<Record<CustomElement['type'], ReactElement>> = {
  'heading-one': <h1></h1>,
  'heading-two': <h2></h2>,
  'heading-three': <h3></h3>,
  'heading-four': <h4></h4>,
  'heading-five': <h5></h5>,
  'heading-six': <h6></h6>
}

const Heading: FC<RenderElementProps> = ({ element, children }) => {
  const { folded } = element as HeadingElement
  const editor = useSlateStatic()
  const instance = useEditorInstance()
  useEffect(() => {
    if (folded) {
      const currentPath = ReactEditor.findPath(editor, element)
      instance.toggleOps?.untoggleBlock(currentPath)
    }
  }, [])

  return cloneElement(
    HeadingToElement[element.type] || <h1></h1>,
    {
      id: element.id,
      style: {
        '--placeholder': `'Heading ${HeadingToLevel[element.type]}'`
      }
    },
    children
  )
}

export default Heading
