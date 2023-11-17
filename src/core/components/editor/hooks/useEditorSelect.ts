import { getElementId } from '@/utils'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { Position } from '@/types'
import _ from 'lodash'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { EditorOverlayManager } from '../components/overlay/useEditorOverlay'
import ScrollManager from '../ScrollManager'
import { CustomEditor } from '~/typings'
import { searchBlock } from '../utils/algorithm'
import { getDistanceBetweenElementAndScrollableElement, getDistanceBetweenPointAndScrollableElement } from '../utils/scroll'
import { ID_TO_ELEMENTS_MAP, SELECT_AREA_MAP } from '../weakMaps'
import useIsSelecting from './useIsSelecting'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'

const useEditorSelect = (editor: CustomEditor, overlayManager: EditorOverlayManager, scrollElement?: HTMLElement | null) => {
  const scrollManager = useMemo(() => new ScrollManager(), [])
  const blockElementsArrayRef = useRef<any[]>([])
  const blockElementsMapRef = useRef<Map<any, any>>(new Map())
  const isPressed = useRef(false)
  const [isSelecting, setIsSelecting] = useIsSelecting()
  const readonly = useReadOnlyEditor()
  const instance = useEditorInstance()
  const mouseDownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    // target is title or textbox

    if (target.getAttribute('role') === 'inner-editor') {
      isPressed.current = true
    }
    if (instance.values.selectedBlocks.size > 0) {
      instance.values.selectingAll = false
      const selected = instance.values.selectedBlocks
      if (e.target instanceof HTMLElement) {
        const closestBlock = e.target.closest('[data-type="block"]')
        if (closestBlock) {
          const id = getElementId(closestBlock)
          if (id) {
            const originSelected = selected.get(id)
            selected.delete(id)
            selected.forEach(i => {
              i.removeSelectedState?.()
            })
            selected.clear()
            if (originSelected) {
              selected.set(id, originSelected)
            }
          }
        } else {
          selected.forEach(i => i.removeSelectedState?.())
          selected.clear()
        }
      } else {
        selected.forEach(i => i.removeSelectedState?.())
        selected.clear()
      }
    }
    // target is self
    if (target === e.currentTarget) {
      isPressed.current = true
    }
  }
  const keyDownHandler = (e: KeyboardEvent) => {
    const selected = instance.values.selectedBlocks
    if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
      instance.blockOps?.deleteBlock()
      if (selected.size) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    if (isHotkey(KEY.Escape, e)) {
      if (selected.size) {
        selected.forEach(v => {
          v.pathRef?.unref()
          v.removeSelectedState?.()
        })
        selected.clear()
      }
      window.getSelection()?.empty()
    }
  }
  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    if (!scrollElement) return
    if (isPressed.current) {
      setIsSelecting(true)
      if (scrollManager.isScrolling()) {
        scrollManager.endScroll()
      }
      if (scrollManager.canScroll()) {
        scrollManager.startScroll(e)
        prepareSelect()
      }
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
      const selectedMap = instance.values.selectedBlocks
      const prevRect = SELECT_AREA_MAP.get(editor)
      let startPoint: Required<Position>
      if (!prevRect) {
        startPoint = { ...distanceToScrollElement }
      } else {
        startPoint = prevRect.startPoint as Required<Position>
      }
      const endPoint = { ...distanceToScrollElement }
      const currRect = {
        startPoint,
        endPoint,
        left: Math.min(startPoint.left, endPoint.left),
        top: Math.min(startPoint.top, endPoint.top),
        right: Math.min(startPoint.left, endPoint.left) + Math.abs(endPoint.left - startPoint.left),
        bottom: Math.min(startPoint.top, endPoint.top) + Math.abs(endPoint.top - startPoint.top)
      }
      SELECT_AREA_MAP.set(editor, currRect)
      overlayManager.setContent('selectArea')
      overlayManager.open()
      // start search selected blocks
      const firstBlock = blockElementsArrayRef.current[0]
      const lastBlock = blockElementsArrayRef.current[blockElementsArrayRef.current.length - 1]
      const firstBlockRect = blockElementsMapRef.current.get(firstBlock)
      const lastBlockRect = blockElementsMapRef.current.get(lastBlock)
      const blocksMap = ID_TO_ELEMENTS_MAP.get(editor)
      if (!firstBlockRect || !lastBlockRect) {
        return
      }
      if (currRect.bottom < firstBlockRect.top) {
        const prevSelectedBlocks = selectedMap
        if (prevSelectedBlocks.size) {
          Array.from(prevSelectedBlocks.values()).forEach(i => {
            const id = i.element.id
            blocksMap?.get(id)?.collisionSelectBlock()
          })
        }
        return
      }
      if (currRect.top > lastBlockRect.top + lastBlockRect.height) {
        return
      }
      const blockEntriesArray = Array.from(blockElementsMapRef.current.entries())
      const topBlock = searchBlock(blockEntriesArray, currRect.top)
      const bottomBlock = searchBlock(blockEntriesArray, currRect.bottom)
      const topIdx = topBlock === -1 ? 0 : blockElementsArrayRef.current.findIndex(i => i === topBlock)
      let finalBottomBlock = bottomBlock
      if (bottomBlock !== -1) {
        finalBottomBlock = _.findLast(blockEntriesArray, i => {
          return i[1].top === blockElementsMapRef.current.get(bottomBlock)?.top
        })?.[0]
      }

      const bottomIdx =
        finalBottomBlock === -1
          ? blockElementsArrayRef.current.length
          : blockElementsArrayRef.current.findIndex(i => i === finalBottomBlock) + 1
      const blocks = blockElementsArrayRef.current.slice(topIdx, bottomIdx)
      const prevSelectedBlocks = selectedMap
      if (prevSelectedBlocks.size) {
        Array.from(prevSelectedBlocks.values())
          .filter(i => !blocks.some(o => o === i))
          .forEach(i => {
            const id = i.element.id
            blocksMap?.get(id)?.collisionSelectBlock()
          })
      }

      blocks.forEach(i => {
        const id = getElementId(i)
        blocksMap?.get(id)?.collisionSelectBlock()
      })
    }
  })

  const mouseUpHandler = (e: MouseEvent) => {
    if (readonly) return
    isPressed.current = false
    if (isSelecting) {
      overlayManager.close()
      document.body.style.cursor = 'auto'
      setTimeout(() => {
        setIsSelecting(false)
      }, 50)
    }
    scrollManager.endScroll()
    SELECT_AREA_MAP.delete(editor)
  }
  const throttledMoveMove = useRafFn(mouseMoveHandler)

  const realMouseMoveHandler = (e: MouseEvent) => {
    if (readonly) return
    if (isPressed.current) {
      e.preventDefault()
      e.stopPropagation()
      try {
        throttledMoveMove(e)
      } catch (e) {
        console.error(e)
      }
    }
  }
  useLayoutEffect(() => {
    if (readonly) return
    if (!scrollElement) return
    if (isSelecting) {
      document.body.style.cursor = 'default'
      prepareSelect()
    }
  }, [isSelecting])
  const prepareSelect = () => {
    blockElementsMapRef.current.clear()
    blockElementsArrayRef.current = []
    Array.from(scrollElement.querySelector(`[role="textbox"]`)?.querySelectorAll('[data-type="block"]') || []).forEach(i => {
      const { left, top, width, height } = i.getBoundingClientRect()
      const distance = getDistanceBetweenPointAndScrollableElement({ x: left, y: top }, scrollElement)
      blockElementsArrayRef.current.push(i)
      blockElementsMapRef.current.set(i, {
        left: distance.left,
        top: distance.top,
        width,
        height
      })
    })
  }
  useEffect(() => {
    if (readonly) return
    if (scrollElement) {
      scrollManager.registerScrollElement(scrollElement)
      scrollElement.addEventListener('pointerdown', mouseDownHandler)
      document.addEventListener('pointermove', realMouseMoveHandler, true)
      document.addEventListener('pointerup', mouseUpHandler)
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        scrollElement.removeEventListener('pointerdown', mouseDownHandler)
        document.removeEventListener('pointermove', realMouseMoveHandler, true)
        document.removeEventListener('pointerup', mouseUpHandler)
        document.removeEventListener('keydown', keyDownHandler)
      }
    }
  })
}

export default useEditorSelect
