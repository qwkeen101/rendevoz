import { FC, memo, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import { useTheme, useToggle } from '@/hooks'
import MetaKnowledgeCard from './KnowledgeCard'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { AnimatePopover, Button, Content, Icon, Image, Panel, Tooltip, WithBorder } from '@/components'
import DateFormat from '@/utils/dateFormat'
import { indexedMetaLinksAtom, metaObjectsAtom, metaStore, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import Modal from '@/components/base/Modal'
import useCardDrag from './useCardDrag'
import { GlobalDragOverlayInstance, GlobalGraphInstance, ObjectTag, useRenderObject } from '@/core'
import MetaNoteCard from './NoteCard'
import MetaDocumentCard from './DocumentCard'
import { Flipped, spring } from 'react-flip-toolkit'
import { MetaStore, globalStore } from '@/stores'
import { MetaObject } from '~/typings/data'
import { MetaDatabaseCardProps } from './types'
import MetaObjectCard from './ObjectCard'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks/jotai'
import ObjectForm from '@/components/form/ObjectForm'
import { PartialWithId } from '@/types'
import { useTranslation } from 'react-i18next'
import { GlobalEventEmitter } from '@/events'
import Colors from '@/consts/colors'
import { metaLinksAtom } from '@/stores/meta.store'
import { Zindexes } from '@/consts'
import FontSize from '@/consts/font'
import { GlobalImagePreviewerInstance } from '@/core/global/GlobalImagePreviewer'
import FromRenderer from '../FromRenderer'
import _ from 'lodash'

export const TypeToTypeName: Record<MetaObject['type'], string> = {
  pdfLabel: 'pdf label',
  note: 'note',
  pdf: 'pdf',
  image: 'image',
  normal: 'object',
  whiteboard: 'whiteboard',
  video: 'video',
  audio: 'audio',
  webpage: 'webpage',
  noteLabel: 'note label',
  noteBlock: 'note block',
  webpageLabel: 'webpage label',
  localFile: 'local file'
}
export const DatabaseCard: FC<{
  index?: number
  metaObject: MetaObject
}> = memo(({ metaObject: _m }) => {
  const metaAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(_m.id)), [_m.id])
  const metaObject = useGlobalAtomValue(metaAtom)
  const relatedAtom = useMemo(() => selectAtom(relatedMetaObjectsMapAtom, r => r.get(_m.id)), [_m.id])
  const set = useGlobalAtomValue(relatedAtom)
  const relatedNumber = set?.size
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cover = metaObject?.coverImgSrc
  const [innerCover, setInnerCover] = useState(cover)
  const showImage = !!cover || !!innerCover
  const { updateMetaObject } = MetaStore
  const iconRef = useRef<HTMLDivElement>(null)
  const { isCardDraggingInside } = useCardDrag(metaObject, iconRef, containerRef.current)

  const { t } = useTranslation()

  const renderCardContent = () => {
    if (!metaObject) return null
    switch (metaObject?.type) {
      case 'note':
        return <MetaNoteCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      case 'pdf':
        return <MetaDocumentCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      case 'normal':
        return <MetaObjectCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      default:
        return <MetaKnowledgeCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
    }
  }

  const renderToolbar = () => {
    return (
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        className={css({
          fontSize: FontSize['12px']
        })}
      >
        <Content flex gap={6} alignItems="baseline">
          <span className={css({ fontSize: FontSize['20px'], fontWeight: 650 })}>{relatedNumber || 0}</span>
          <span className={css({ fontSize: FontSize['11px'], fontWeight: 500 })}>{t('general.related objects')}</span>
        </Content>

        <AnimatePopover
          visible={showPopover}
          innerRef={iconRef}
          onClickOutside={() => setShowPopover(false)}
          positions={['bottom']}
          align="start"
          padding={10}
          content={<WithBorder>{renderPopover()}</WithBorder>}
          disableIntersection
          containerStyle={{ zIndex: '9999' }}
        >
          <Tooltip
            content={
              <Content
                flex
                column
                alignItems="center"
                style={{ textTransform: 'capitalize', fontSize: FontSize['12px'], fontFamily: 'Muli' }}
              >
                <div>Click to open menu</div>
                <div>Drag to move object</div>
              </Content>
            }
          >
            <Icon
              onClick={() => setShowPopover(!showPopover)}
              size={18}
              name="park-drag"
              className={ClassName.circleButton(3)}
              style={{
                opacity: showIcon || showPopover ? 1 : 0
              }}
            />
          </Tooltip>
        </AnimatePopover>
      </Content>
    )
  }

  const renderPopover = () => <ObjectActionPopover metaObjectId={_m.id} onClose={() => setShowPopover(false)} />

  const renderEdit = () => (
    <Modal visible={showEdit} onClose={() => setShowEdit(false)} noStyle>
      <ObjectForm
        onBack={() => setShowEdit(false)}
        initialObject={metaObject}
        onSubmit={newMeta => {
          setShowEdit(false)
          updateMetaObject(newMeta as PartialWithId<MetaObject>)
        }}
      />
    </Modal>
  )
  const renderTitleAndDescription: MetaDatabaseCardProps['renderTitleAndDescription'] = ({ title, description, onTitleClick }) => {
    return (
      <Content flex column>
        <Content className={TitleWrapperClassName}>
          <div className={TitleClassName} onClick={onTitleClick} style={{ textTransform: 'none' }}>
            {title}
          </div>
          {description?.length && (
            <div
              style={{ whiteSpace: 'pre-line', marginTop: 8, textTransform: 'none' }}
              className={css([ClassName.description(FontSize['14px']), ClassName.ellipsisFont(6)])}
            >
              {description}
            </div>
          )}
        </Content>
      </Content>
    )
  }
  const onElementAppear = (el, index) =>
    spring({
      onUpdate: val => {
        el.style.opacity = val
      },
      delay: index * 50
    })
  const onExit = (el, index, removeElement) => {
    spring({
      config: { overshootClamping: true },
      onUpdate: val => {
        el.style.transform = `scaleX(${1 - val})`
      },
      delay: index * 50,
      onComplete: removeElement
    })

    return () => {
      el.style.opacity = ''
      removeElement()
    }
  }
  if (!metaObject) return null
  return (
    <Flipped onAppear={onElementAppear} onExit={onExit} flipId={_m.id} key={metaObject.id}>
      <div
        ref={containerRef}
        onPointerEnter={() => setShowIcon(true)}
        onPointerLeave={() => setShowIcon(false)}
        style={{ gridRowEnd: showImage ? 'span 2' : undefined }}
        className={css({
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          willChange: 'transform'
        })}
      >
        {renderEdit()}
        <motion.div
          style={{
            pointerEvents: isCardDraggingInside ? 'auto' : 'none'
          }}
          initial={{ backgroundColor: 'rgba(255,255,255,0)' }}
          animate={{
            backgroundColor: isCardDraggingInside ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0)',
            backdropFilter: isCardDraggingInside ? 'blur(4px)' : 'blur(0px)'
          }}
          transition={{ duration: 0.3 }}
          className={css({
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            borderRadius: 16,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FontSize['18px'],
            fontWeight: 600
          })}
        >
          <div style={{ opacity: isCardDraggingInside ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {GlobalDragOverlayInstance.draggingDetails?.type === 'image' ? 'Drop to change cover' : 'Drop to add Link'}
          </div>
        </motion.div>
        <Content
          flex
          column
          className={css({
            transition: 'box-shadow 0.3s cubic-bezier(0.2, 0.91, 0.85, 0.96) 0s, background-color 0.3s ease 0s',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            ':hover': {
              boxShadow: 'rgba(100, 100, 111, 0.35) 0px 7px 29px 0px'
            }
          })}
          style={{
            height: 'fit-content',
            overflow: 'hidden',
            borderRadius: 16,
            cursor: 'pointer'
          }}
        >
          {showImage && (
            <img
              onClick={() => GlobalImagePreviewerInstance.open?.(innerCover || cover)}
              src={cover}
              style={{ height: '100%', objectFit: 'cover', maxHeight: 250 }}
            />
          )}
          <Content
            flex
            column
            fullWidth
            className={css({
              background: Colors.Background.Linear
            })}
          >
            <div
              className={css({
                position: 'relative',
                padding: '16px',
                zIndex: 1
              })}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: FontSize['11px'],
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textTransform: 'uppercase'
                }}
              >
                <span>{t(`general.${TypeToTypeName[metaObject.type] || 'object'}`)}</span>
                <span style={{ display: 'flex', gap: 5, fontSize: FontSize['10px'], alignItems: 'center', lineHeight: 1 }}>
                  <Icon size={13} name="park-time" />
                  {t('general.ago', { time: DateFormat.formatDistanceToNowStrict(metaObject.createdAt) })}
                </span>
              </div>
              {metaObject.tags && metaObject.tags.length > 0 && (
                <Content flex gap={4} style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {metaObject.tags?.map(i => (
                    <ObjectTag small hideSize hideDelete tag={i} key={i} />
                  ))}
                </Content>
              )}
              <div>{renderCardContent()}</div>
              <FromRenderer
                style={{
                  marginTop: 8
                }}
                metaObject={metaObject}
              />
            </div>
            <div
              className={css({
                padding: '0 16px 8px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              })}
            >
              {renderToolbar()}
            </div>
          </Content>
        </Content>
      </div>
    </Flipped>
  )
})

export const ObjectActionPopover: FC<
  Partial<{
    onClose: VoidFunction
    onEdit: VoidFunction
    onPin: VoidFunction
    onGraph: VoidFunction
    onDelete: VoidFunction
    onJump: VoidFunction
    onGraphPin: VoidFunction
    onShowRelated: VoidFunction
    visibility: {
      jumpToVisible?: boolean
      graphPinVisible?: boolean
      showRelatedVisible?: boolean
      graphPinned?: boolean
      relatedNum?: number
    }
  }> & { metaObjectId: number }
> = ({ onClose, onEdit, onPin, onGraph, onDelete, metaObjectId, visibility, onJump, onGraphPin, onShowRelated }) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const [relatedVisible, toggleRelatedVisible] = useToggle(false)
  const metaObject = MetaStore.useValue(metaObjectId)
  const containerRef = useRef<HTMLDivElement>(null)
  if (!metaObject) return null
  return (
    <Content flex column style={{ padding: 6, fontWeight: 500, width: 180 }} ref={containerRef} role="object-popover-panel">
      {visibility?.jumpToVisible && <Button.IconButton onClick={onJump} text="Focus" icon="park-share-two" />}
      {visibility?.graphPinVisible && (
        <Button.IconButton
          icon="park-pin"
          text={visibility.graphPinned ? t('graph.unpin') : t('graph.pin on graph')}
          style={{ color: visibility.graphPinned ? 'color' : undefined }}
          onClick={onGraphPin}
        />
      )}
      {visibility?.showRelatedVisible && (
        <Button.IconButton
          onClick={onShowRelated}
          text={t(`graph.show more related nodes`, { num: visibility.relatedNum })}
          icon="park-circle-four"
        />
      )}
      <Button.IconButton
        text={t('general.edit')}
        icon="park-edit"
        onClick={() => {
          onClose?.()
          GlobalEventEmitter().emit('global', {
            type: 'globalNeedEditMetaObject',
            data: {
              metaObjectId
            }
          })
          onEdit?.()
        }}
      />
      <Button.IconButton
        onClick={() => {
          updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })
          onPin?.()
          onClose?.()
        }}
        icon="park-like"
        text={metaObject.pinned ? t('general.unpin') : t('general.pin')}
      />
      <Button.IconButton
        text={t('general.global graph')}
        icon="park-circle-four-line"
        onClick={() => {
          GlobalGraphInstance?.open?.(metaObject)
          onGraph?.()
          onClose?.()
        }}
      />
      <Button.IconButton
        text={t('general.partial graph')}
        icon="park-share-one"
        onClick={() => {
          GlobalGraphInstance?.open?.(metaObject, true)
          onGraph?.()
          onClose?.()
        }}
      />
      <AnimatePopover
        positions={['right', 'left']}
        visible={relatedVisible}
        onClickOutside={toggleRelatedVisible}
        boundaryInset={20}
        padding={10}
        containerStyle={{
          zIndex: String(Zindexes.Tooltip)
        }}
        reposition
        boundaryElement={document.body}
        parentElement={containerRef.current}
        content={
          <WithBorder
            onClick={e => e.stopPropagation()}
            padding={8}
            style={{
              minWidth: 200,
              maxWidth: 400
            }}
          >
            <RelatedPanel metaId={metaObjectId} />
          </WithBorder>
        }
      >
        <Button.IconButton
          text={t('general.related')}
          icon="park-link-one"
          onClick={e => {
            toggleRelatedVisible()
            e.preventDefault()
            e.stopPropagation()
          }}
        ></Button.IconButton>
      </AnimatePopover>
      <Button.IconButton
        text={t('general.delete')}
        dangerous
        onClick={() => {
          deleteMetaObject(metaObject.id, false, true)
          onDelete?.()
        }}
        icon="park-delete"
      />
    </Content>
  )
}

const RelatedPanel = memo(({ metaId }: { metaId: number }) => {
  const sourceToTarget = useGlobalAtomValue(indexedMetaLinksAtom)?.sourceIdToLinkIdsMap.get(metaId)
  const targetToSource = useGlobalAtomValue(indexedMetaLinksAtom)?.targetIdToLinkIdMap.get(metaId)

  const [showIn, toggleShowIn] = useToggle(false)
  const [showOut, toggleShowOut] = useToggle(false)
  const { t } = useTranslation()

  const { sortedInbounds, sortedOutbounds } = useMemo(() => {
    const inboundLinkIds = Array.from(targetToSource?.values() || [])
    const outboundLinkIds = Array.from(sourceToTarget?.values() || [])
    const inboundObjects = inboundLinkIds.map(i => globalStore.get(metaObjectsAtom).get(globalStore.get(metaLinksAtom).get(i)!.sourceId))
    const outboundObjects = outboundLinkIds.map(i => globalStore.get(metaObjectsAtom).get(globalStore.get(metaLinksAtom).get(i)!.targetId))

    const sortedInbounds = _.groupBy(inboundObjects, b => b?.type)
    const sortedOutbounds = _.groupBy(outboundObjects, b => b?.type)
    return {
      sortedInbounds,
      sortedOutbounds
    }
  }, [metaId])

  return (
    <Content
      flex
      column
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      className={css({
        maxHeight: '600px',
        overflowY: 'auto',
        minWidth: 300,
        maxWidth: 500
      })}
    >
      <Content>
        <Button.IconButton
          onClick={toggleShowIn}
          text={`${t('general.inbound links')} ${targetToSource?.size || 0}`}
          icon={!showIn ? 'park-right' : 'park-down'}
        />
        {showIn && Object.entries(sortedInbounds).map(i => <RelatedGroup key={i[0]} groupType={i[0]} metaIds={i[1].map(i => i?.id)} />)}
      </Content>
      <Content>
        <Button.IconButton
          onClick={toggleShowOut}
          text={`${t('general.outbound links')} ${sourceToTarget?.size || 0}`}
          icon={!showOut ? 'park-right' : 'park-down'}
        />
        {showOut && Object.entries(sortedOutbounds).map(i => <RelatedGroup key={i[0]} groupType={i[0]} metaIds={i[1].map(i => i?.id)} />)}
      </Content>
    </Content>
  )
})
const RelatedGroup = ({ groupType, metaIds }: { groupType: MetaObject['type']; metaIds: number[] }) => {
  const { t } = useTranslation()
  return (
    <Panel style={{ padding: '4px 12px' }} defaultVisible={false} title={`${t(`general.${TypeToTypeName[groupType]}`)} ${metaIds.length}`}>
      {metaIds.map(i => (
        <RelatedItem metaId={i} key={i} />
      ))}
    </Panel>
  )
}
const RelatedItem = ({ metaId }: { metaId: number }) => {
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })

  return (
    <div>
      {renderWhole({
        renderOptions: {
          renderDescription: false,
          renderOption: true,
          renderFrom: false
        },
        mainContainerStyle: {
          flex: 1
        },
        titleOptions: {
          ellipsisLine: 1,
          style: {
            fontSize: FontSize['14px']
          }
        },
        containerStyle: {
          width: '100%',
          padding: '4px 0px',
          flex: 1
        }
      })}
    </div>
  )
}
export const TitleClassName = classNames(
  css({
    fontWeight: 600,
    fontSize: FontSize['15px'],
    userSelect: 'none',
    textTransform: 'none'
  }),
  ClassName.ellipsisFont(2)
)
export const TitleWrapperClassName = css({
  // padding: '8px 12px 0px'
})
