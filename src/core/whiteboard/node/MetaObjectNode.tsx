import Modal from '@/components/base/Modal'
import { useMemoizedFn, useToggle, useUpdateEffect } from '@/hooks'
import { IWhiteboardNode } from '~/typings/data'
import { Icon, Tooltip } from '@/components/base'
import ClassName from '@/styles/classNames'
import { FC, memo, useEffect } from 'react'
import { InnerNodeProps } from './WrapperNode'
import { useSetWhiteboardNodes } from '../hooks'
import produce from 'immer'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { MetaStore } from '@/stores'
import ObjectForm from '@/components/form/ObjectForm'
import { useRenderObject } from '@/core'
import { css } from '@emotion/css'

const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setPopoverElements, setNodeState, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const { updateMetaObject } = MetaStore
  const updateNodes = useSetWhiteboardNodes()
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)
  const { renderWhole, metaObject } = useRenderObject({ metaObjectId: metaObjectId! })
  const hasSize = node.width && node.height
  const toggleExpanded = useMemoizedFn(() => {
    updateNodes(nodes =>
      produce(nodes, draft => {
        draft.set(node.id, {
          ...node,
          expanded: !node.expanded
        })
      })
    )
  })
  const getNodeState = useMemoizedFn(() => {
    return node
  })
  useEffect(() => {
    if (metaObject?.type) {
      if (['note', 'pdf'].includes(metaObject.type)) {
        setPopoverElements?.(eles => {
          return [
            ...eles,
            () => (
              <Tooltip position="top" content="Edit Object Details">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-edit"
                  onClick={() => {
                    toggleEditMetaVisible(true)
                    setNodeState?.(s => ({ ...s, popoverVisible: false, focused: true }))
                  }}
                />
              </Tooltip>
            ),
            () => (
              <Tooltip position="top" content={!getNodeState().expanded ? 'Expand Node' : 'Fold Node'}>
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name={getNodeState().expanded ? 'park-collapse-text-input' : 'park-expand-text-input'}
                  onClick={() => {
                    toggleExpanded()
                  }}
                />
              </Tooltip>
            )
          ]
        })
      } else {
        setPopoverElements?.(eles => {
          return [
            ...eles,
            () => (
              <Tooltip position="top" content="Edit Object Details">
                <Icon
                  size={18}
                  className={ClassName.circleButton(undefined, 4)}
                  name="park-edit"
                  onClick={() => {
                    toggleEditMetaVisible(true)
                    setNodeState?.(s => ({ ...s, popoverVisible: false, focused: true }))
                  }}
                />
              </Tooltip>
            )
          ]
        })
      }
    }
  }, [metaObject?.type])
  useUpdateEffect(() => {
    if (expanded !== undefined) {
      updateNodes(nodes =>
        produce(nodes, draft => {
          draft.set(node.id, {
            ...node,
            width: undefined,
            height: undefined
          })
        })
      )
    }
  }, [expanded])
  useEffect(() => {
    setTimeout(() => {
      metaObject?.name && onNameChange?.(metaObject?.name)
    })
  }, [metaObject?.name])
  const renderExpanded = () => {
    if (metaObject?.objectId) {
      switch (metaObject?.type) {
        case 'pdf':
          return (
            <PdfNode
              node={{
                documentId: metaObject.objectId
              }}
            />
          )
        case 'note': {
          return (
            <NoteNode
              node={{
                noteId: metaObject.objectId
              }}
            />
          )
        }
      }
    }
  }
  return (
    <>
      <Modal
        visible={editMetaVisible}
        noStyle
        onClose={() => {
          toggleEditMetaVisible(false)
          setNodeState?.(s => ({ ...s, popoverVisible: true, focused: true }))
        }}
      >
        <ObjectForm
          onBack={() => {
            toggleEditMetaVisible(false)
            setNodeState?.(s => ({ ...s, popoverVisible: true, focused: true }))
          }}
          initialObject={metaObject}
          onSubmit={obj => {
            updateMetaObject(obj)
            toggleEditMetaVisible(false)
            setNodeState?.(s => ({ ...s, popoverVisible: true, focused: true }))
          }}
        />
      </Modal>
      {expanded
        ? renderExpanded()
        : renderWhole({
            containerStyle: {
              padding: '12px 20px 10px',
              minWidth: '100%',
              width: 'auto',
              maxWidth: '400px',
              height: 'auto',
              minHeight: '100%',
              overflowY: 'overlay',
              containerType: hasSize ? 'size' : 'normal'
            },
            titleOptions: {
              style: {
                fontSize: hasSize ? 'max(4cqmax, 16px)' : undefined
              },
              fromStyle: {
                fontSize: hasSize ? 'max(2cqmax,11px)' : undefined
              }
            },
            descriptionOptions: {
              style: {
                fontSize: hasSize ? 'max(14px,3cqmax)' : undefined
              }
            },
            tagsOptions: {
              containerClassName: hasSize
                ? css({ '> *': { fontSize: 'max(10px, 2cqmax) !important' }, gap: 'max(1cqmax, 4px) !important' })
                : undefined
            }
          })}
    </>
  )
}

export default memo(MetaObjectNode)
