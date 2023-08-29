import { Editor } from '@/core'
import { useEffect, useMemo } from 'react'
import Id from '@/utils/id'
import { useUpdate } from 'react-use'
import { css } from '@emotion/css'

type SimpleEditorProps = {
  value?: string
  onChange?: (v: any[]) => void
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
      toolbarOptions={{
        fontSize: false,
        extra: false,
        highlight: false
      }}
      on={e => {
        if (e.type === 'valueChange') {
          onChange?.(e.value)
        }
      }}
      innerEditorClassName={css({
        '.ParagraphBlock': {
          marginTop: 1,
          marginBottom: 1
        }
      })}
      innerEditorStyle={{
        paddingLeft: 0,
        paddingRight: 10
      }}
      showToolbar={true}
      initialValue={initialValue}
      showTitle={false}
      showBlockHandle={false}
      showHeader={false}
      type="note"
    />
  )
}

export default SimpleEditor
