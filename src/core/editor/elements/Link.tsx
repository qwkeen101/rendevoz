import { RenderElementProps } from 'slate-react'
import { ReactEditor, useSlateStatic } from '../slate-react'
import { Content, Icon, Tooltip, WithBorder } from '@/components'
import { useEffect, useState } from 'react'
import { useRenderObject } from '@/core'
import { ClassName } from 'rendevoz'
import { Editor, Node, Transforms } from 'slate'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
const InlineChromiumBugfix = () => (
  <span
    contentEditable={false}
    className={css`
      font-size: 0;
    `}
  >
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
)
const Link = ({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlateStatic()
  const [linkTarget, setLinkTarget] = useState()
  useEffect(() => {
    const url = element.url
    if (!url) {
      setLinkTarget(undefined)
      return
    }
    if (url.startsWith('rendevoz://object')) {
      const metaId = parseInt(url.replace('rendevoz://object/', ''))
      if (metaId) {
        setLinkTarget({
          type: 'meta',
          metaId
        })
      }
    } else {
      setLinkTarget({
        type: 'url',
        url
      })
    }
  }, [element.url])

  const handleRemoveLink = () => {
    const path = ReactEditor.findPath(editor, element)
    const text = Node.string(element)
    const point = Editor.before(editor, path)
    Transforms.removeNodes(editor, {
      at: path
    })
    Transforms.insertText(editor, text, { at: point })
  }

  const handleEdit = () => {
    const path = ReactEditor.findPath(editor, element)
    const selection = Editor.range(editor, path)
    console.log(selection)
    Transforms.select(editor, selection)
    editor.overlayManager?.setContent('linkForm')
    editor.overlayManager?.open()
    const nodePos = ReactEditor.toDOMNode(editor, element).getBoundingClientRect()
    editor.overlayManager?.setPosition({
      left: nodePos.left,
      top: nodePos.top + 5
    })
    setTimeout(() => {
      editor.overlayManager?.setCurrentLink?.(element.url)
    }, 100)
  }
  const renderPopover = () => {
    if (linkTarget) {
      if (linkTarget.type === 'meta' && linkTarget.metaId) {
        return (
          <div>
            <LinkObjectRenderer metaId={linkTarget.metaId} onRemove={handleRemoveLink} onEdit={handleEdit} />
          </div>
        )
      }
      return (
        <WithBorder
          style={{ display: 'flex', gap: 16, fontSize: FontSize['13px'], alignItems: 'center', padding: '6px 8px 6px 12px', maxWidth: 400 }}
        >
          <Content
            flex
            gap={6}
            onClick={() => {
              window.open(linkTarget.url)
            }}
            className={css({
              ':hover': {
                color: Colors.Font.Link
              },
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            })}
            alignItems="center"
          >
            <Icon name="park-efferent-three" />
            <div style={{ textTransform: 'none' }}>{linkTarget.url}</div>
          </Content>
          <Icon
            onClick={() => {
              handleEdit()
            }}
            name="park-edit"
            className={ClassName.circleButton()}
          />
          <Icon
            onClick={() => {
              handleRemoveLink()
            }}
            name="park-delete"
            className={ClassName.circleButton()}
          />
        </WithBorder>
      )
    }
    return <div></div>
  }
  return (
    <span {...attributes} style={{ margin: '0 0.01em' }}>
      <Tooltip padding={5} contentTouchable={true} delay={500} content={renderPopover()} disableDefaultContent={true}>
        <a
          target="_blank"
          onClick={e => {
            editor.on({
              type: 'linkClick',
              e
            })
            setTimeout(() => {
              if (e.defaultPrevented) {
                return
              }
              if (navigator.userAgent.indexOf('Electron') >= 0) {
                window.open(element.url)
                e.preventDefault()
              }
            })
          }}
          href={element.url}
        >
          <InlineChromiumBugfix />
          {children}
          <InlineChromiumBugfix />
        </a>
      </Tooltip>
    </span>
  )
}
const LinkObjectRenderer = ({ metaId, onRemove, onEdit }: { metaId: number; onRemove: VoidFunction; onEdit: VoidFunction }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return (
    <WithBorder style={{ display: 'flex', gap: 16, fontSize: FontSize['13px'], padding: '6px 8px 6px 12px', maxWidth: 600 }}>
      {renderInline({
        showCircle: false,
        ellipsisLine: 100
      })}
      <Icon
        onClick={() => {
          onEdit()
        }}
        name="park-edit"
        className={ClassName.circleButton()}
      />
      <Icon
        onClick={() => {
          onRemove()
        }}
        name="park-delete"
        className={ClassName.circleButton()}
      />
    </WithBorder>
  )
}
export default Link
