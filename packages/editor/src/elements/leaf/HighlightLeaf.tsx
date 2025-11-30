import { RenderLeafProps, useRenderLabel, useSlateStatic } from '@/core'
import { CSSProperties, useContext } from 'react'
import useEditorInstance from '../hooks/useEditorInstance'
import { useAtomValue } from 'jotai/react'
import PageConfigContext from '../../PageConfigContext'
import classnames from 'classnames'
import { Icon } from '@/components'
import { selectAtom } from 'jotai/utils'
import { EditorStateAtom } from '../hooks/useEditorState'
const labelTypeAtom = selectAtom(EditorStateAtom, s => s.labelType)
export default (props: RenderLeafProps & { style?: CSSProperties }) => {
  let { leaf, attributes, children, style } = props
  const { text, ...rest } = leaf
  const editor = useSlateStatic()
  const instance = useEditorInstance()
  const labelType = useAtomValue(labelTypeAtom, { store: instance.values.editorLevelStore })
  const pageConfig = useContext(PageConfigContext)
  const { label, labelMeta } = useRenderLabel({
    objectId: leaf.highlight,
    type: labelType
  })
  if (!label || labelMeta?.deleted)
    return (
      <span {...attributes} className={classnames(...Object.keys(rest))} style={style}>
        {children}
      </span>
    )
  return (
    <span
      {...attributes}
      onClick={e => {
        e.preventDefault()
        editor.onHighlightClick?.(leaf.highlight, e)
      }}
      data-highlight={leaf.highlight}
      className={classnames('textHighlight', ...Object.keys(rest))}
      style={style}
    >
      {label?.name && pageConfig.isInContentDisplayer !== true && (
        <Icon
          size={16}
          style={{
            position: 'absolute',
            top: -16,
            left: -16,
            zIndex: 99,
            pointerEvents: 'none',
            transform: 'rotateY(180deg)'
          }}
          className={'text-yellow-500'}
          theme={'filled'}
          name={'park-message'}
        />
      )}
      {children}
    </span>
  )
}
