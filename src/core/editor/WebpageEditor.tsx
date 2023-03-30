import { Content, Icon } from '@/components'
import { KEY } from '@/consts'
import Id from '@/utils/id'
import isHotkey from 'is-hotkey'
import { useMemo, useState } from 'react'
import { Editor, EditorProps } from './Editor'
import { EditorTitleClassName } from './EditorTitle'
import Outliner from './utils/outline/outliner'

type IWebpageEditor = {} & EditorProps
const WebpageEditor = ({
  initialValue,
  title,
  onLinkClick,
  noteId,
  onEditorInstanceInitialized,
  onHighlight,
  onHighlightDrag
}: // readonly = true
Omit<IWebpageEditor, 'title'> & { title: string }) => {
  const id = useMemo(() => Id.getStrId(), [])
  const [readonly, toggleReadonly] = useState(true)
  document.addEventListener('keydown', e => {
    if (isHotkey(KEY.Escape, e)) {
      toggleReadonly(false)
    }
  })
  return (
    <Editor
      titleContainerStyle={{
        width: 800,
        padding: '20px 0px',
        maxWidth: 'calc(100% - 100px)'
      }}
      readonly={readonly}
      showToolbar
      onHighlight={onHighlight}
      onHighlightDrag={onHighlightDrag}
      id={id}
      titleEditable={false}
      initialValue={initialValue}
      onEditorInstanceInitialized={onEditorInstanceInitialized}
      noteId={noteId}
      title={
        <Content
          flex
          column
          style={{
            maxWidth: 'calc(100% - 100px)',
            width: 800,
            padding: '20px 0px',
            margin: 'auto'
          }}
        >
          <div
            className={EditorTitleClassName}
            onClick={() => {
              // console.log(Outliner.headingListToTree(initialValue))
              toggleReadonly(!readonly)
            }}
          >
            {title}
          </div>
          <Content>
            <Icon name="park-more" />
          </Content>
        </Content>
      }
      onLinkClick={onLinkClick}
    />
  )
}

export default WebpageEditor
