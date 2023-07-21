import { AnimatePopover, Tooltip } from '@/components/base'
import Modal from '@/components/base/Modal'
import CollectionForm from '@/components/form/CollectionForm'
import { useGlobalIsDragging } from '@/core'
import Zindexes from '@/consts/zindex'
import { useMemoizedFn, useToggle } from '@/hooks'
import useCollectionStore, { rootCollectionsAtom } from '@/stores/collection.store'
import { CollectionStore, globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { CSSProperties, forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import Content from '../../base/Content'
import Icon from '../../base/Icon'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import { sidebarDraggingState } from './useSidebarItemDrag'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import FontSize from '@/consts/font'

const SidebarCollection = () => {
  const rootCollections = useAtomValue(rootCollectionsAtom, {
    store: globalStore
  })
  const sortedCollections = rootCollections.slice().sort((a, b) => (a.name || '1')[0].localeCompare((b.name || '1')[0]))
  const [newCollectionVisible, setNewCollectionVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropVisible, toggleDropVisible] = useState(false)
  const [collapsed, toggleCollapsed] = useToggle(false)
  const { moveItems } = useCollectionStore()
  const { t } = useTranslation()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerleave') {
      toggleDropVisible(false)
    }
    if (e.type === 'pointerup') {
      toggleDropVisible(false)
    }
    const draggingEle = Rendevoz.Actions.State.Drag.getDraggingDetails()
    if (draggingEle) {
      if (draggingEle.type === 'collection') {
        if (e.type === 'pointerenter') {
          toggleDropVisible(true)
        }
        if (e.type === 'pointerup') {
          if (sidebarDraggingState.current?.draggingItemType === 'collection') {
            const dragState = sidebarDraggingState.current
            moveItems({
              sourceFromId: dragState.sourceFromId,
              sourceFromType: dragState.sourceFromType,
              sourceIsRoot: dragState.itemIsInRoot,
              item: {
                id: dragState.draggingItemId,
                type: dragState.draggingItemType
              },
              targetIsRoot: true,
              targetToType: 'collection'
            })
          }
        }
      }
    }
  })
  useEffect(() => {
    if (globalIsDragging) {
      containerRef.current?.addEventListener('pointerenter', pointerHandler)
      containerRef.current?.addEventListener('pointerleave', pointerHandler)
      containerRef.current?.addEventListener('pointerup', pointerHandler)
      return () => {
        containerRef.current?.removeEventListener('pointerenter', pointerHandler)
        containerRef.current?.removeEventListener('pointerleave', pointerHandler)
        containerRef.current?.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [globalIsDragging])
  const { addCollection } = CollectionStore
  return (
    <>
      <Modal noStyle visible={newCollectionVisible} onClose={() => setNewCollectionVisible(false)}>
        <CollectionForm
          onSubmit={collection => {
            setNewCollectionVisible(false)
            addCollection({ ...collection, parentId: 0 })
          }}
          onBack={() => setNewCollectionVisible(false)}
        />
      </Modal>
      <AnimatePopover
        visible={dropVisible}
        positions={['top']}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
        content={
          <div
            style={{
              color: 'white',
              background: 'rgba(0,0,0,0.8)',
              padding: '2px 4px',
              borderRadius: 4,
              fontSize: '0.857rem'
            }}
          >
            Move collection to root
          </div>
        }
        innerRef={containerRef}
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          className={dropVisible ? ClassName.Drag.droppableItemHovered(true) : undefined}
          style={{ transition: 'all 0.3s ease' }}
        >
          <div style={{ cursor: 'pointer', fontSize: FontSize['13px'] }} onClick={toggleCollapsed}>
            {t('sidebar.collections')}
          </div>
          <Tooltip position="top" content={t('sidebar.create new collection')}>
            <Icon
              name="park-plus"
              size={14}
              onClick={() => {
                setNewCollectionVisible(true)
              }}
              className={ClassName.circleButton(2, 4)}
            />
          </Tooltip>
        </Content>
      </AnimatePopover>
      {!collapsed && (
        <Content flex column gap={2}>
          {sortedCollections.map(i => (
            <SidebarCollectionItem key={i.id} id={i.id} parentId={0} parentType="collection" />
          ))}
        </Content>
      )}
    </>
  )
}
const linearToSvg = (linear: string) => {
  return linear.match(/rgba\([^()]*\)|#\w+/g)
}
export const IconNameItem = memo(
  forwardRef(
    (
      {
        name,
        icon,
        color,
        onClick,
        style,
        className
      }: {
        name?: string
        icon?: string
        color?: string
        onClick?: React.MouseEventHandler
        style?: CSSProperties
        className?: string
      },
      ref
    ) => {
      const isPark = icon?.startsWith('park')
      const emoji = useMemo(() => !isPark && icon && getEmoji(icon), [icon])
      const linearFontColor = color?.startsWith('linear')
      const linearColors = color && linearFontColor && linearToSvg(color)
      const [imgDisplayOk, toggleImgDisplayOk] = useToggle(true)
      return (
        <Content
          flex
          alignItems="center"
          gap={8}
          style={{ overflow: 'hidden', ...style }}
          className={className}
          onClick={onClick}
          ref={ref}
        >
          {emoji ? (
            <img
              src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
              style={{
                width: '1em',
                height: '1em',
                backgroundImage: `url(${emoji?.imageSrc})`,
                backgroundPositionX: `${(emoji?.x * 100) / 60}%`,
                backgroundPositionY: `${(emoji?.y * 100) / 60}%`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '6100% 6100%',
                verticalAlign: '-0.1em',
                marginRight: 2
              }}
            />
          ) : (
            <>
              {icon &&
                (isPark ? (
                  <Icon fill={linearColors ? linearColors[(linearColors.length / 2) | 0] : color} name={icon} />
                ) : (
                  <img
                    style={{
                      height: '1em',
                      width: '1em'
                    }}
                    onLoad={e => {
                      e.currentTarget.style.display = 'block'
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                    src={icon}
                  />
                ))}
            </>
          )}
          <div
            style={{
              color: color,
              backgroundImage: linearFontColor ? color : undefined,
              textTransform: 'none'
            }}
            className={css([
              ClassName.ellipsisFont(1),
              linearFontColor && {
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }
            ])}
          >
            {name}
          </div>
        </Content>
      )
    }
  )
)
export default SidebarCollection
