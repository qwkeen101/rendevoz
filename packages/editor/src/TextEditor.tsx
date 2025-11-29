import { CSSProperties, memo, useMemo } from 'react'
import { CustomEditor, IEditorInstance } from '~/typings'
import { Editor, withReact } from '@/core'
import { Id } from '@/utils'
import { Descendant } from 'slate'

type Props = {
  style?: CSSProperties
  className?: string
  onInstanceInitialized?: (i: IEditorInstance) => void
  placeholder?: string
  defaultValue?: Descendant[]
  readOnly?: boolean
  onChange?: (v: Descendant[]) => void
  fontSize?: number
}
export default memo(({ style, readOnly, className, fontSize, onChange, defaultValue, onInstanceInitialized, placeholder }: Props) => {
  const id = useMemo(() => Id.getStrId(), [])
  const validValue = useMemo(() => {
    if (typeof defaultValue === 'string') {
      return [
        {
          type: 'paragraph',
          id: Id.getId(),
          children: [
            {
              text: defaultValue
            }
          ]
        }
      ]
    }
    return defaultValue
  }, [defaultValue])
  return (
    <Editor
      id={id}
      textboxMode
      readOnly={readOnly}
      onInstanceInitialized={onInstanceInitialized}
      defaultValue={validValue}
      state={{
        fontSize
      }}
      plugins={{
        addUnderLastLine: false
      }}
      on={e => {
        if (e.type === 'valueChange') {
          onChange?.(e.value)
        }
      }}
      layout={{
        virtualizer: false,
        firstLinePlaceholder: placeholder
      }}
    />
  )
})
