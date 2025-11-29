import { RenderElementProps } from 'slate-react'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { useEffect, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, Icons, KEY } from '@/consts'
import MetaFilterer from '@/core/object/filter/MetaFilter'
import { Editor, Path, Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from '@/core'
import { useMemoizedFn } from '@/hooks'
import { ClassName } from 'rendevoz'
import { HistoryEditor } from 'slate-history'
import useEditorInstance from '../hooks/useEditorInstance'
import Id from './utils/id'
import AutoSizeTextArea from '@/components/base/AutoSizeTextArea'
import { css } from '@emotion/css'
import { MetaStore } from '@/api/stores'

const InlineMetaPicker = ({ element, children, attributes }: RenderElementProps) => {
  const editor = useSlateStatic()
  const [value, setValue] = useState('')
  const [visible, setVisible] = useState(false)
  console.log(visible)
  const handleTransformPicker = useMemoizedFn((id?: number) => {
    const path = ReactEditor.findPath(editor, element)
    if (id) {
      Transforms.setNodes(
        editor,
        {
          originId: id,
          type: 'inline-metaObject'
        },
        {
          at: path
        }
      )
      instance.on({
        type: 'getMeta',
        onSuccess: sourceId => {
          MetaStore.addMetaLink({
            sourceId,
            targetId: id
          })
        }
      })
      Transforms.setSelection(editor, Editor.range(editor, Path.next(path)))
      ReactEditor.focus(editor)
    } else {
      const text = value
      HistoryEditor.withoutSaving(editor, () => {
        Transforms.removeNodes(editor, {
          at: path
        })
      })
      const prev = element.isAt ? `@` : `[[`
      Transforms.insertText(editor, `${prev}${text}`, {
        voids: true
      })
      ReactEditor.focus(editor)
    }
  })
  const ref = useRef<HTMLElement>(null)
  const instance = useEditorInstance()
  useEffect(() => {
    instance.blockOps?.setBlockFuncs(element.id, {
      openPickMeta: () => {
        setVisible(true)
      }
    })
    return () => {
      instance.blockOps?.removeBlockFuncs(element.id)
    }
  }, [])
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        ref.current?.focus()
      })
      const existHandler = (e: KeyboardEvent) => {
        if (isHotkey(KEY.Escape, e)) {
          e.preventDefault()
          e.stopPropagation()
          handleTransformPicker()
        }
      }
      document.addEventListener('keydown', existHandler, true)
      return () => {
        document.removeEventListener('keydown', existHandler, true)
      }
    }
  }, [visible])
  return (
    <span {...attributes} className={'bg-third em:mx-2 em:pl-2 em:pr-2.5 em:py-1 em:rounded em:text-sm'}>
      <AnimatePopover
        positions={['bottom', 'top']}
        padding={8}
        reposition
        withClickCover
        content={
          <WithBorder>
            <MetaFilterer
              showCreate={{
                whiteboard: true,
                note: true
              }}
              onChange={id => {
                handleTransformPicker(id)
              }}
              withInput={false}
              currentInput={value}
            />
          </WithBorder>
        }
        visible={visible}
        onClickOutside={() => handleTransformPicker()}
      >
        <span onClick={() => setVisible(true)}>
          <span contentEditable={false}>
            <Icon name={Icons.Search} containerStyle={{ display: 'inline', marginRight: 4, fontSize: '0.9em' }} />
          </span>
          <AutoSizeTextArea
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap'
            }}
            className={css({
              br: {
                display: 'none'
              }
            })}
            defaultValue={value}
            onChange={v => setValue(v)}
            placeholder={'Mention'}
            ref={ref}
          />
          {children}
        </span>
      </AnimatePopover>
    </span>
  )
}

export default InlineMetaPicker
