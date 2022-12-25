import { getElementId } from '@/components/dragReposition/utils/element'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { Position } from '@/types'
import _ from 'lodash'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { EditorOverlayManager } from '../components/overlay/useEditorOverlay'
import ScrollManager from '../ScrollManager'
import { CustomEditor } from '../types'
import { searchBlock } from '../utils/algorithm'
import { getDistanceBetweenElementAndScrollableElement, getDistanceBetweenPointAndScrollableElement } from '../utils/scroll'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP, SELECT_AREA_MAP } from '../weakMaps'
import useIsSelecting from './useIsSelecting'

const useEditorSelect = (editor: CustomEditor, overlayManager: EditorOverlayManager, scrollElement?: HTMLElement | null) => {
  const scrollManager = useMemo(() => new ScrollManager(), [])
  const blockElementsArrayRef = useRef<any[]>([])
  const blockElementsMapRef = useRef<Map<any, any>>(new Map())
  const isPressed = useRef(false)
  const [isSelecting, setIsSelecting] = useIsSelecting()

  const mouseDownHandler = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      isPressed.current = true
    }
  }

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
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
        console.log('return 1')
        return
      }
      if (currRect.bottom < firstBlockRect.top) {
        const prevSelectedBlocks = SELECTED_BLOCKS_MAP.get(editor)
        if (prevSelectedBlocks) {
          Array.from(prevSelectedBlocks.values()).forEach(i => {
            const id = getElementId(i)
            blocksMap?.get(id)?.collisionSelectBlock()
          })
        }
        console.log('return 2')
        return
      }
      if (currRect.top > lastBlockRect.top + lastBlockRect.height) {
        console.log('return 3')
        return
      }
      const blockEntriesArray = Array.from(blockElementsMapRef.current.entries())
      const topBlock = searchBlock(blockEntriesArray, currRect.top)
      const bottomBlock = searchBlock(blockEntriesArray, currRect.bottom)
      const topIdx = topBlock === -1 ? 0 : blockElementsArrayRef.current.findIndex(i => i === topBlock)
      let finalBottomBlock = bottomBlock
      if (bottomBlock !== -1) {
        finalBottomBlock = _.findLast(blockEntriesArray, i => {
          return i[1].top === blockElementsMapRef.current.get(bottomBlock)?.top ? true : false
        })?.[0]
      }

      const bottomIdx =
        finalBottomBlock === -1
          ? blockElementsArrayRef.current.length
          : blockElementsArrayRef.current.findIndex(i => i === finalBottomBlock) + 1
      const blocks = blockElementsArrayRef.current.slice(topIdx, bottomIdx)
      const prevSelectedBlocks = SELECTED_BLOCKS_MAP.get(editor)
      if (prevSelectedBlocks) {
        Array.from(prevSelectedBlocks.values())
          .filter(i => !blocks.some(o => o === i))
          .forEach(i => {
            const id = getElementId(i)
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
    if (!scrollElement) return
    if (isSelecting) {
      document.body.style.cursor = 'default'
      prepareSelect()
    }
  }, [isSelecting])
  const prepareSelect = () => {
    blockElementsMapRef.current.clear()
    blockElementsArrayRef.current = []
    Array.from(scrollElement.querySelector(`[role="textbox"]`)?.querySelectorAll('[data-spec-type="common-block"]') || []).forEach(i => {
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
    if (scrollElement) {
      scrollManager.registerScrollElement(scrollElement)
      scrollElement.addEventListener('mousedown', mouseDownHandler)
      document.addEventListener('mousemove', realMouseMoveHandler, true)
      document.addEventListener('mouseup', mouseUpHandler)
      return () => {
        scrollElement.removeEventListener('mousedown', mouseDownHandler)
        document.removeEventListener('mousemove', realMouseMoveHandler, true)
        document.removeEventListener('mouseup', mouseUpHandler)
      }
    }
  })
}

export default useEditorSelect
