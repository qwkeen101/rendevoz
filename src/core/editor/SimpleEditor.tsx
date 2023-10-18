import { Editor } from '@/core'
import { useMemo } from 'react'
import Id from '@/utils/id'

type SimpleEditorProps = {
  value?: string
  onChange?: (v: import('slate').Descendant[]) => void
}

const SimpleEditor = ({ value, onChange }: SimpleEditorProps) => {
  const id = useMemo(() => Id.getStrId(), [])
  const initialValue = useMemo(() => {
    if (value) {
      if (typeof value === 'string') {
        if (value.startsWith('[')) {
          const newV = JSON.parse(value)
          onChange?.(newV)
          return newV
        } else {
          const newV = value.split('\n').map(i => ({
            type: 'paragraph',
            id: Id.getId(),
            children: [
              {
                text: i
              }
            ]
          }))
          onChange?.(newV)
          return newV
        }
      }
      if (typeof value === 'object') {
        return value
      }
    }
    return [
      {
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: 'Input something' }]
      }
    ]
  }, [])

  return (
    <Editor
      id={id}
      on={e => {
        if (e.type === 'valueChange') {
          onChange?.(e.value)
        }
      }}
      defaultValue={initialValue}
      styles={{
        pageMinPadding: 0
      }}
      state={{
        showSyncBlockShadow: false
      }}
      layout={{
        showTitle: false,
        showBlockHandle: false,
        showHeader: false,
        showToolbar: false,
        showBottomPadding: false
      }}
    />
  )
}

export default SimpleEditor
