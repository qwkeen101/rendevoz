import { RenderElementProps } from 'slate-react'
import { ReactEditor, useSlateStatic } from '../slate-react'
import { ToolbarV2, Tooltip, WithBorder } from '@/components'
import { useMemo } from 'react'
import { InlineObject } from '@/core'
import { Editor, Node, Transforms } from 'slate'
import { Icons } from '@/consts'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
// 需要这玩意，不然光标放在link右边会一直是link
const InlineChromiumBugfix = () => (
  <span contentEditable={false} style={{ fontSize: 0 }}>
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
)

const Link = ({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlateStatic()
  const readOnly = useReadOnlyEditor()
  const linkTarget = useMemo(() => {
    const url = element.url
    if (!url) {
      return undefined
    }
    if (url.startsWith('rendevoz://object')) {
      const metaId = parseInt(url.replace('rendevoz://object/', ''))
      if (metaId) {
        return {
          type: 'meta',
          metaId
        }
      }
    } else {
      return {
        type: 'url',
        url
      }
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
  const { t } = useTranslation()
  const handleEdit = () => {
    const path = ReactEditor.findPath(editor, element)
    const selection = Editor.range(editor, path)
    Transforms.select(editor, selection)
    const nodePos = ReactEditor.toDOMNode(editor, element).getBoundingClientRect()
    instance.overlayOps?.open('linkForm', {
      x: nodePos.x + nodePos.width / 2,
      y: nodePos.bottom - 16
    })
    setTimeout(() => {
      editor.overlayManager?.setCurrentLink?.(element.url)
    }, 100)
  }

  const renderPopover = (close: VoidFunction) => {
    if (linkTarget) {
      if (linkTarget.type === 'meta' && linkTarget.metaId) {
        return (
          <div className={'font-size-13'}>
            <LinkObjectRenderer
              url={element.url}
              metaId={linkTarget.metaId}
              onNavi={() => close()}
              onRemove={() => {
                close()
                handleRemoveLink()
              }}
              onEdit={() => {
                close()
                handleEdit()
              }}
            />
          </div>
        )
      }
      return (
        <WithBorder className={'!rounded-lg font-size-13'}>
          <ToolbarV2
            layout={[
              {
                type: 'button',
                key: 'link',
                element: (
                  <a
                    href={linkTarget.url}
                    target={'_blank'}
                    onClick={() => {
                      close()
                    }}
                    className={'link max-w-64 line-clamp-1 px-2 break-all'}
                  >
                    {linkTarget.url}
                  </a>
                )
              },
              {
                type: 'button',
                icon: Icons.Copy,
                onClick: () => {
                  navigator.clipboard.writeText(element.url)
                  toast.success(t(trans.Copied))
                },
                key: 'copy'
              },
              {
                type: 'button',
                icon: Icons.Edit,
                onClick: () => {
                  close()
                  handleEdit()
                },
                key: 'edit'
              },
              {
                type: 'button',
                icon: Icons.Delete,
                onClick: () => {
                  close()
                  handleRemoveLink()
                },
                key: 'delete'
              }
            ]}
          />
        </WithBorder>
      )
    }
    return null
  }
  const linkAttrs = { ...attributes }
  delete linkAttrs['ref']
  return (
    <Tooltip
      padding={5}
      contentTouchable={true}
      delay={500}
      ref={attributes.ref}
      content={setV => renderPopover(() => setV(false))}
      disableDefaultContent={true}
    >
      <a
        {...linkAttrs}
        style={{ margin: '0 0.1px' }}
        onClick={e => {
          if (!readOnly) {
            window.open(element.url)
            e.preventDefault()
          }
        }}
        href={element.url}
        target={'_blank'}
      >
        {children}
        {!readOnly && <InlineChromiumBugfix />}
      </a>
    </Tooltip>
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
  return (
    <WithBorder className={'!rounded-lg'} style={{ display: 'flex', maxWidth: 400, alignItems: 'center', overflow: 'hidden' }}>
      <ToolbarV2
        layout={[
          {
            type: 'button',
            key: 'display',
            element: (
              <InlineObject
                onClick={() => {
                  window.open(url)
                  onNavi()
                }}
                id={metaId}
                style={{
                  padding: '0px 4px'
                }}
              />
            )
          },
          {
            type: 'button',
            icon: Icons.Edit,
            onClick: () => onEdit?.(),
            key: 'edit'
          },
          {
            type: 'button',
            icon: Icons.Delete,
            onClick: () => onRemove?.(),
            key: 'delete'
          }
        ]}
      />
    </WithBorder>
  )
}
export default Link
