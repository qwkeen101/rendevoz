import Modal from '@/components/base/Modal'
import EditMetaObjectForm, { Tag } from '@/components/form/EditMetaObjectForm'
import { metaObjectsAtom } from '@/stores/meta.store'
import { useMemoizedFn, useToggle, useUpdateEffect } from '@/hooks'
import { IWhiteboardNode } from '~/typings/data'
import { Content, Icon, Image, Tooltip } from '@/components/base'
import { TypeToTypeName } from '@/components/database/card/DatabaseCard'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { FC, memo, useEffect, useMemo } from 'react'
import { InnerNodeProps } from './WrapperNode'
import { selectAtom } from 'jotai/utils'
import { atom } from 'jotai'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { useSetWhiteboardNodes } from '../hooks'
import produce from 'immer'
import PdfNode from './PdfNode'
import NoteNode from './NoteNode'
import { metaStore } from '@/stores'

const imageClassName = css({
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  position: 'absolute',
  top: 0,
  marginBottom: -16,
  overflow: 'hidden',
  height: '100%'
})
const MetaObjectNode: FC<InnerNodeProps> = ({ node: n, setPopoverElements, setNodeState, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'metaObject' }
  const { expanded } = node
  const { metaObjectId } = node
  const metaObjectAtom = useMemo(() => (metaObjectId ? selectAtom(metaObjectsAtom, m => m.get(metaObjectId)) : atom(null)), [metaObjectId])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const { updateMetaObject } = metaStore
  const updateNodes = useSetWhiteboardNodes()
  const [editMetaVisible, toggleEditMetaVisible] = useToggle(false)

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
    console.log('sadad', expanded)
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
        <EditMetaObjectForm
          title="Edit Object"
          onClose={() => {
            toggleEditMetaVisible(false)
            setNodeState?.(s => ({ ...s, popoverVisible: true, focused: true }))
          }}
          metaObject={metaObject}
          onUpdate={obj => {
            updateMetaObject(obj)
            toggleEditMetaVisible(false)
            setNodeState?.(s => ({ ...s, popoverVisible: true, focused: true }))
          }}
        />
      </Modal>
      {expanded ? (
        renderExpanded()
      ) : (
        <>
          {metaObject?.coverImgSrc && <Image src={metaObject.coverImgSrc} width="100%" className={imageClassName} />}
          <Content
            flex
            column
            gap={3}
            style={{
              padding: 16,
              borderRadius: 16,
              minWidth: '100%',
              width: 'auto',
              maxWidth: '400px',
              height: '100%',
              marginTop: metaObject?.coverImgSrc ? 150 : undefined,
              background: 'white'
            }}
          >
            <Content
              flex
              gap={4}
              style={{ flexWrap: 'wrap' }}
              className={css({
                '> *': {
                  fontSize: '11px !important'
                }
              })}
            >
              <div
                style={{
                  background: 'rgb(220,227,232)',
                  color: 'rgb(82,102,116)',
                  borderRadius: '4px',
                  padding: '0px 6px 0px 6px',
                  fontFamily: 'Muli',
                  width: 'fit-content',
                  whiteSpace: 'nowrap',
                  textTransform: 'capitalize'
                }}
              >
                {TypeToTypeName[metaObject?.type || 'normal']}
              </div>
              {metaObject?.tags?.map(tag => (
                <Tag key={tag} tag={tag} small hideSize hideDetails />
              ))}
            </Content>
            <div className={ClassName.title('18px')}>{metaObject?.name}</div>
            <div className={ClassName.description('14px')} style={{ whiteSpace: 'pre-wrap', overflow: 'auto' }}>
              {metaObject?.description}
            </div>
          </Content>
        </>
      )}
    </>
  )
}

export default memo(MetaObjectNode)
