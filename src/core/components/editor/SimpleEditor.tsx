import { Editor } from '@/core'
import { useMemo } from 'react'
import Id from '@/utils/id'
import { IEditorInstance } from '~/typings'

type SimpleEditorProps = {
  value?: string
  onChange?: (v: import('slate').Descendant[]) => void
  onInstanceInitialized: (i: IEditorInstance) => void
}

const SimpleEditor = ({ value, onChange, onInstanceInitialized }: SimpleEditorProps) => {
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
      },
      {
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: 'Input something' }]
      },
      {
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: 'Input something' }]
      },
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
        pageMinPadding: 0,
        containerHeight: 'auto',
        containerMaxHeight: '100%',
        containerStyle: {
          maxWidth: '100%',
          minWidth: '100%'
        }
      }}
      state={{
        fontSize: 17,
        pageWidth: 'Max',
        showSyncBlockShadow: false
      }}
      onInstanceInitialized={onInstanceInitialized}
      toolbar={{
        highlight: false
      }}
      layout={{
        showTitle: false,
        showBlockHandle: false,
        showHeader: false,
        showBottomPadding: false
      }}
    />
  )
}

export default SimpleEditor
