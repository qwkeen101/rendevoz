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
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
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
  const instance = useEditorInstance()
  const handleEdit = () => {
    const path = ReactEditor.findPath(editor, element)
    const selection = Editor.range(editor, path)
    Transforms.select(editor, selection)
    const nodePos = ReactEditor.toDOMNode(editor, element).getBoundingClientRect()
    instance.overlayOps?.open('linkForm', {
      x: nodePos.x,
      y: nodePos.y
    })
    setTimeout(() => {
      editor.overlayManager?.setCurrentLink?.(element.url)
    }, 100)
  }
  const renderPopover = (close: VoidFunction) => {
    if (linkTarget) {
      if (linkTarget.type === 'meta' && linkTarget.metaId) {
        return (
          <div>
            <LinkObjectRenderer
              url={element.url}
              metaId={linkTarget.metaId}
              onNavi={() => close()}
              onRemove={handleRemoveLink}
              onEdit={handleEdit}
            />
          </div>
        )
      }
      return (
        <WithBorder style={{ fontSize: 13, height: 28 }}>
          <Content flex>
            <div
              onClick={() => {
                window.open(linkTarget.url)
                close()
              }}
              className={css([
                {
                  ':hover': {
                    color: Colors.Font.Link
                  },
                  padding: '4px 6px',
                  borderRight: '1px solid var(--border-background)',
                  maxWidth: 250,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                },
                ClassName.ellipsisFont(1)
              ])}
            >
              {linkTarget.url}
            </div>
            <Content flex style={{ fontSize: 16, color: Colors.Font.Transparent, justifyContent: 'flex-end' }}>
              <Tooltip content={'Copy'}>
                <Icon
                  onClick={() => {
                    navigator.clipboard.writeText(element.url)
                  }}
                  name="park-copy"
                  className={ClassName.flatButton(0, '6px 6px')}
                  containerStyle={{
                    height: 28
                  }}
                />
              </Tooltip>
              <Tooltip content={'Edit'}>
                <Icon
                  onClick={() => {
                    handleEdit()
                  }}
                  name="park-edit"
                  containerStyle={{
                    height: 28
                  }}
                  className={ClassName.flatButton(0, '6px 6px')}
                />
              </Tooltip>
              <Tooltip content={'Delete'}>
                <Icon
                  onClick={() => {
                    handleRemoveLink()
                  }}
                  name="park-delete"
                  containerStyle={{
                    height: 28
                  }}
                  className={ClassName.flatButton(0, '6px 6px')}
                />
              </Tooltip>
            </Content>
          </Content>
        </WithBorder>
      )
    }
    return <div></div>
  }
  return (
    <span {...attributes} style={{ margin: '0 0.01em' }}>
      <Tooltip
        padding={5}
        contentTouchable={true}
        delay={500}
        content={setV => renderPopover(() => setV(false))}
        disableDefaultContent={true}
      >
        <a
          onClick={e => {
            if (!e.defaultPrevented) {
              window.open(element.url)
              editor.on({
                type: 'linkClick',
                e
              })
            }
          }}
        >
          <InlineChromiumBugfix />
          {children}
          <InlineChromiumBugfix />
        </a>
      </Tooltip>
    </span>
  )
}
const LinkObjectRenderer = ({
  metaId,
  onRemove,
  onEdit,
  url,
  onNavi
}: {
  metaId: number
  onRemove: VoidFunction
  onEdit: VoidFunction
  onNavi: VoidFunction
  url: string
}) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return (
    <WithBorder style={{ display: 'flex', fontSize: 14, maxWidth: 500, alignItems: 'center', overflow: 'hidden' }}>
      {renderInline({
        showCircle: false,
        ellipsisLine: 1,
        onClick: () => {
          window.open(url)
          onNavi()
        },
        containerStyle: {
          padding: '2px 8px',
          borderRight: '1px solid var(--border-background)'
        }
      })}
      <Icon
        onClick={() => {
          onEdit()
        }}
        name="park-edit"
        containerStyle={{
          height: 28
        }}
        className={ClassName.flatButton(0, '6px 6px')}
      />
      <Icon
        onClick={() => {
          onRemove()
        }}
        name="park-delete"
        containerStyle={{
          height: 28
        }}
        className={ClassName.flatButton(0, '6px 6px')}
      />
    </WithBorder>
  )
}
export default Link
