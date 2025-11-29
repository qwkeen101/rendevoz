import { RefObject, useEffect, useMemo, useState } from 'react'
import { Box, ICollectionItem, Point } from '~/typings'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/components/editor/utils/scroll'
import { useAutoScroll, useMemoizedFn } from '@/hooks'
import { createPortal } from 'react-dom'
import { boxesIntersect } from '@/utils'
import produce from 'immer'
import { CheckBox, Icon, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import { CollectionStore, MetaStore } from '@/api/stores'
import classnames from 'classnames'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import { IHomeItem } from '@/scenes/home/useHomeItems'

export default ({ scrollElementRef, items }: { scrollElementRef: RefObject<HTMLElement>; items: IHomeItem[] }) => {
  const [selectBox, setSelectBox] = useState<Box & { startPoint: Point; endPoint: Point }>()
  const [isSelecting, setIsSelecting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const homeConfig = useHomeConfig()
  const { run, end } = useAutoScroll({
    scrollElementRef,
    onScroll: useMemoizedFn(() => {
      const scrollElement = scrollElementRef.current
      if (!scrollElement || !selectBox) return
      const startPoint = selectBox.startPoint
      const [x, y] = mousePos.current
      const distanceToScrollElement = getDistanceBetweenElementAndScrollableElement(
        {
          left: x,
          top: y,
          x,
          y,
          right: x,
          bottom: y,
          width: 0,
          height: 0
        },
        scrollElement
      )
      if (!distanceToScrollElement) return
      const endPoint = {
        x: distanceToScrollElement.left,
        y: distanceToScrollElement.top
      }
      const currRect = {
        startPoint,
        endPoint,
        left: Math.min(startPoint.x, endPoint.x),
        top: Math.min(startPoint.y, endPoint.y),
        right: Math.min(startPoint.x, endPoint.x) + Math.abs(endPoint.x - startPoint.x),
        bottom: Math.min(startPoint.y, endPoint.y) + Math.abs(endPoint.y - startPoint.y)
      }
      const scrollElementRect = scrollElement.getBoundingClientRect()
      const width = currRect.right - currRect.left
      const height = currRect.bottom - currRect.top
      const left = scrollElementRect.left + currRect.left
      const top = scrollElementRect.top + currRect.top - scrollElement.scrollTop
      const items = Array.from(scrollElement.querySelectorAll('[data-id]').values()) as HTMLElement[]
      const box = {
        width,
        left,
        top,
        height
      }
      setSelected(s =>
        produce(s, draft => {
          items.forEach(i => {
            const bound = i.getBoundingClientRect()
            const id = Number(i.getAttribute('data-id'))
            if (boxesIntersect(bound, box)) {
              draft.add(id)
            } else {
              draft.delete(id)
            }
          })
        })
      )
    })
  })
  const all = useMemo(() => items.map(i => i.id), [items])
  const { t } = useTranslation()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return
    const scrollElementRect = scrollElement.getBoundingClientRect()
    const distanceToScrollElement = getDistanceBetweenElementAndScrollableElement(
      {
        left: e.clientX,
        top: e.clientY,
        x: e.clientX,
        y: e.clientY,
        right: e.clientX,
        bottom: e.clientY,
        width: 0,
        height: 0
      },
      scrollElement
    )
    if (!distanceToScrollElement) return
    if (e.type === 'pointerdown') {
      if (e.target !== e.currentTarget && e.target !== (e.currentTarget as HTMLElement).firstElementChild) return
      setSelected(new Set())
      e.preventDefault()
      setIsSelecting(true)
      if (distanceToScrollElement) {
        setSelectBox({
          width: 0,
          height: 0,
          left: distanceToScrollElement.left + scrollElementRect.left,
          top: distanceToScrollElement.top + scrollElementRect.top - scrollElement.scrollTop,
          startPoint: {
            x: distanceToScrollElement.left,
            y: distanceToScrollElement.top
          },
          endPoint: {
            x: distanceToScrollElement.left,
            y: distanceToScrollElement.top
          }
        })
        scrollElement.addEventListener('pointermove', pointerHandler)
        document.addEventListener('pointerup', pointerHandler)
      }
    }
    if (e.type === 'pointermove') {
      run(e)
      if (selectBox?.startPoint) {
        const startPoint = selectBox.startPoint
        const endPoint = {
          x: distanceToScrollElement.left,
          y: distanceToScrollElement.top
        }
        const currRect = {
          startPoint,
          endPoint,
          left: Math.min(startPoint.x, endPoint.x),
          top: Math.min(startPoint.y, endPoint.y),
          right: Math.min(startPoint.x, endPoint.x) + Math.abs(endPoint.x - startPoint.x),
          bottom: Math.min(startPoint.y, endPoint.y) + Math.abs(endPoint.y - startPoint.y)
        }
        const width = currRect.right - currRect.left
        const height = currRect.bottom - currRect.top
        const left = scrollElementRect.left + currRect.left
        const top = scrollElementRect.top + currRect.top - scrollElement.scrollTop
        const items = Array.from(scrollElement.querySelectorAll('[data-id]').values()) as HTMLElement[]
        const box = { width, height, left, top }
        setSelected(s =>
          produce(s, draft => {
            items.forEach(i => {
              const bound = i.getBoundingClientRect()
              const id = Number(i.getAttribute('data-id'))
              if (boxesIntersect(bound, box)) {
                draft.add(id)
              } else {
                draft.delete(id)
              }
            })
          })
        )
        setSelectBox({
          startPoint: currRect.startPoint,
          endPoint: currRect.endPoint,
          width,
          height,
          left,
          top
        })
      }
    }
    if (e.type === 'pointerup') {
      setIsSelecting(false)
      end()
      scrollElement.removeEventListener('pointermove', pointerHandler)
      document.removeEventListener('pointerup', pointerHandler)
    }
  })
  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      if (isEditing) {
        scrollElement.addEventListener('pointerdown', pointerHandler)
        return () => {
          scrollElement.removeEventListener('pointerdown', pointerHandler)
        }
      } else {
        setIsSelecting(false)
        setSelected(new Set())
      }
    }
  }, [isEditing])

  const renderSelectBox = () => {
    if (selectBox && isSelecting) {
      return createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              ...selectBox,
              background: 'rgba(39, 158, 255, 0.2)',
              position: 'absolute',
              borderRadius: 0
            }}
          ></div>
        </div>,
        document.body
      )
    }
  }

  const getSelected = () => {
    const items = Array.from(selected.values())
      .map(i => {
        if (MetaStore.getCachedMetaObject(i)) {
          return {
            type: 'meta',
            id: i
          }
        }
        if (CollectionStore.getCachedCollectionById(i)) {
          return {
            type: 'collection',
            id: i
          }
        }
      })
      .filter(Boolean) as ICollectionItem[]
    return items
  }
  const renderToolbar = () => {
    const ele = scrollElementRef.current
    if (ele && isEditing) {
      const checked = all.length > 0 && all.length === selected.size && all.every(i => selected.has(i))
      const inter = !checked && all.some(i => selected.has(i))
      const haveSelected = selected.size > 0
      return createPortal(
        <WithBorder className={'fixed z-20 transparent-font !rounded-3xl px-3 py-2 bottom-6 left-1/2 flex items-center -translate-x-1/2'}>
          <div className={'flex items-center gap-3 border-right pr-5 mr-3'}>
            <CheckBox
              className={'ml-1'}
              indeterminate={inter}
              checked={checked}
              onChange={() => {
                if (checked) {
                  setSelected(new Set())
                } else {
                  setSelected(new Set(all))
                }
              }}
            />
            <div className={'font-size-13'}>{t('general.Selected', { num: selected.size })}</div>
          </div>
          <div className={'flex gap-2'}>
            <Icon
              tooltip={t(trans.Meta.MoveTo)}
              className={classnames('rounded-button', !haveSelected && 'opacity-50 !cursor-not-allowed')}
              name={Icons.MoveTo}
              onClick={() => {
                const items = getSelected()
                if (items.some(o => o.type === 'collection')) {
                  Global.collectionOps?.selectCollection().then(res => {
                    if (items.length) {
                      const breadcrumbs = homeConfig.breadcrumbs || []
                      const currentCollection = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1] : undefined
                      CollectionStore.moveItems(items, currentCollection || 0, typeof res === 'number' ? 0 : res.id)
                      setSelected(new Set())
                    }
                  })
                  return
                }
                const metas = items.filter(i => i.type === 'meta')
                if (metas.length) {
                  Global.metaOps.quickAdd?.(metas.map(i => i.id))
                }
              }}
            />
            <Icon
              tooltip={t(trans.Delete)}
              className={classnames('rounded-button', !haveSelected && 'opacity-50 !cursor-not-allowed')}
              name={Icons.Delete}
              onClick={() => {
                if (selected.size) {
                  const items = getSelected()
                  Global.dialogOps?.confirm(t('general.You will delete selected files')).then(res => {
                    if (res) {
                      items.forEach(i => {
                        if (i.type === 'meta') {
                          MetaStore.deleteMetaObject(i.id)
                        } else {
                          const collectionMeta = MetaStore.getMetaObjectByObjectId(i.id, false)
                          if (collectionMeta) {
                            MetaStore.deleteMetaObject(collectionMeta.id)
                          }
                        }
                      })
                      setSelected(new Set())
                    }
                  })
                }
              }}
            />
            <Icon onClick={() => setIsEditing(false)} name={Icons.Close} className={'rounded-button'} />
          </div>
        </WithBorder>,
        ele
      )
    }
  }

  return {
    renderSelectBox,
    selectBox,
    isEditing,
    setIsEditing,
    selected,
    setSelected,
    renderToolbar
  }
}
