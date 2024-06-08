import { GlobalInstance, useGlobalAtom, useMemoizedFn, useShortcut, useToggle } from '@/hooks'
import { Position } from '@/types'
import isHotkey from 'is-hotkey'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, PanInfo } from 'framer-motion'
import { Content, Icon, Tooltip } from '@/components'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import Id from '@/utils/id'
import ScreenShotCanvas from './ScreenShotCanvas'
import { captureWebpage, saveImageLocally } from '@/utils/img'
import { PanZoom } from 'panzoom'
import { normalizeScreenshot } from './normalizeScreenshot'
import { MetaStore, ObjectStore } from '@/api/stores'
import { atom } from 'jotai'
import ScreenShotStatus from './ScreenShotStatus'
import ScreenShotToolbar from './ScreenShotToolbar'
import OcrService from '@/api/services/ocr.service'
import Colors from '@/consts/colors'
import { delay } from '@/utils/functions'
import { GlobalInstances } from '~/typings'
import { assignProperties } from '@/utils'
import { Resizable } from 're-resizable'
import { Rnd } from 'react-rnd'

export const GlobalScreenShotOcrResult = atom<string | undefined | 'loading'>(undefined)
export const GlobalScreenShotSelectionBoxState = atom<
  | Partial<{
      visible: boolean
      startPosition: Required<Position>
      endPosition: Required<Position>
      rect: { left: number; top: number; width: number; height: number }
      stable: boolean
      isSelecting: boolean
      transition: string
    }>
  | undefined
>(undefined)

const GlobalScreenShot = () => {
  const [ocrResult, setOcrResult] = useGlobalAtom(GlobalScreenShotOcrResult)
  const [screenShotLayerVisible, setScreenShotLayerVisible] = useState(false)
  const [selectionBoxState, setSelectionBoxState] = useGlobalAtom(GlobalScreenShotSelectionBoxState)
  const selectionBoxRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const panzoomRef = useRef<PanZoom>()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (toolbarRef.current?.contains(e.target)) {
      selectionBoxState?.visible && setSelectionBoxState({ visible: false })
      return
    }
    if (canvasRef.current?.contains(e.target)) {
      return
    }
    if (e.target instanceof HTMLElement && e.target.closest(`[role='global-translate-panel']`)) return
    if (e.type === 'pointerdown') {
      if (toolbarRef.current?.contains(e.target)) {
        return
      }
      document.body.classList.remove('screenshot')
      if (selectionBoxState?.rect && !selectionBoxState.stable) {
        e.preventDefault()
        e.stopPropagation()
        setSelectionBoxState({
          ...selectionBoxState,
          stable: true,
          isSelecting: false
        })
        return
      }
      if (selectionBoxState?.stable) {
        if (selectionBoxRef.current?.contains(e.target as HTMLElement) || e.path.some(i => i.getAttribute?.('role') === 'modal')) {
          return
        }
        setScreenShotLayerVisible(false)
        setSelectionBoxState({
          visible: false
        })
      } else {
        setSelectionBoxState({
          visible: true,
          isSelecting: true,
          startPosition: {
            left: e.clientX,
            top: e.clientY
          }
        })
      }
    }
    if (e.type === 'pointerup') {
      if (!selectionBoxState?.stable) {
        if (startPos && endPos) {
          setSelectionBoxState(state => ({
            ...state,
            isSelecting: false,
            stable: true
          }))
        } else {
          setSelectionBoxState({
            ...selectionBoxState,
            isSelecting: false,
            stable: true
          })
        }
      }
    }
    if (e.type === 'pointermove') {
      if (selectionBoxState?.stable) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      if (startPos) {
        setSelectionBoxState(state => {
          const endPos = {
            left: e.clientX,
            top: e.clientY
          }
          return {
            ...state,
            rect: {
              left: Math.min(startPos.left, endPos.left),
              top: Math.min(startPos.top, endPos.top),
              width: Math.abs(startPos.left - endPos.left),
              height: Math.abs(startPos.top - endPos.top)
            },
            endPosition: endPos
          }
        })
      }
    }
  })

  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      screenshot: () => {
        setScreenShotLayerVisible(true)
      }
    }
  })
  useEffect(() => {
    if (!selectionBoxState?.stable) {
      setOcrResult(undefined)
    }
  }, [selectionBoxState?.stable])
  useEffect(() => {
    if (screenShotLayerVisible) {
      const root = document.getElementById('root')
      if (root) {
        document.body.style.overflow = 'hidden'
      }
      document.addEventListener('pointerup', pointerHandler, true)
      document.addEventListener('pointerdown', pointerHandler, true)
      document.addEventListener('pointermove', pointerHandler, true)
      document.body.classList.add('screenshot')
      return () => {
        document.getElementById('root')!.style.transform = 'none'
        document.body.style.overflow = 'auto'
        panzoomRef.current?.dispose()
        document.removeEventListener('pointerup', pointerHandler, true)
        document.removeEventListener('pointermove', pointerHandler, true)
        document.removeEventListener('pointerdown', pointerHandler, true)
        document.body.classList.remove('screenshot')
      }
    } else {
      setSelectionBoxState({ visible: false })
      setOcrResult(undefined)
    }
  }, [screenShotLayerVisible])
  useShortcut('openScreenShot', () => {
    setScreenShotLayerVisible(state => !state)
  })
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey('escape', e)) {
        setScreenShotLayerVisible(false)
        setSelectionBoxState({ visible: false })
      }
    }
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  })
  const getImageBlob = useMemoizedFn(async (): Promise<Blob | undefined> => {
    const className = css({
      outline: 'none !important',
      '*': {
        display: 'none !important'
      }
    })
    selectionBoxRef.current!.classList.add(className)
    const rect = selectionBoxState?.rect!
    await delay(20)
    const result = await captureWebpage(undefined, {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    })
    const imageDataUrl = result!
    const img = new Image()
    img.src = imageDataUrl
    await new Promise(res => {
      img.onload = () => {
        res(null)
      }
    })
    const dpr = window.devicePixelRatio
    const canvas = document.createElement('canvas')
    canvas.width = rect.width * dpr

    canvas.height = rect.height * dpr
    canvas
      .getContext('2d')
      ?.drawImage(img, rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr, 0, 0, rect.width * dpr, rect.height * dpr)
    selectionBoxRef.current!.classList.remove(className)
    const blob = await new Promise(res => {
      canvas.toBlob(b => {
        res(b)
      })
    })
    return blob
  })
  const startPos = selectionBoxState?.startPosition
  const endPos = selectionBoxState?.endPosition
  const rect = selectionBoxState?.rect
  const handleAddMeta = async (showModal?: boolean) => {
    if (selectionBoxState?.rect) {
      const blob = await getImageBlob()
      const imgPath = await saveImageLocally(blob, {
        compress: false
      })
      setScreenShotLayerVisible(false)
      const { relatedMeta, normalizedImage, normalizedImageMeta } = await normalizeScreenshot(selectionBoxState.rect, imgPath)
      if (!normalizedImageMeta) {
        return
      }
      const one = await ObjectStore('image').addOneWithMeta(
        {
          ...normalizedImage,
          url: imgPath
        },
        {
          showMetaModal: showModal,
          currentMeta: {
            type: 'image',
            coverImgSrc: imgPath,
            description: ocrResult,
            ...normalizedImageMeta
          }
        }
      )
      relatedMeta.forEach(v => {
        MetaStore.addMetaLink(
          {
            sourceId: v.id,
            targetId: one.meta.id
          },
          true
        )
      })
      return one.meta
    }
  }
  const renderScreenShotLayer = () => (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 10000,
        cursor: 'crosshair',
        pointerEvents: selectionBoxState?.stable ? 'auto' : 'none',
        background: selectionBoxState?.visible && rect ? 'none' : 'rgba(0,0,0,0.7)'
      }}
    >
      {selectionBoxState?.visible && rect && (
        <Rnd
          position={{
            x: rect.left,
            y: rect.top
          }}
          size={{
            width: rect.width,
            height: rect.height
          }}
          onDragStop={(e, data) => {
            const bounding = data.node.getBoundingClientRect()
            setSelectionBoxState(s => ({ ...s, rect: bounding }))
          }}
          onResizeStop={(e, dir, elementRef) => {
            const bounding = elementRef.getBoundingClientRect()
            setSelectionBoxState(s => ({ ...s, rect: bounding }))
          }}
          ref={ref => {
            selectionBoxRef.current = ref?.getSelfElement()
          }}
          style={{
            outline: '2px solid var(--select-color)',
            pointerEvents: selectionBoxState.startPosition || selectionBoxState.stable ? 'auto' : 'none',
            cursor: selectionBoxState.stable ? 'grab' : 'default',
            boxShadow: '0 0 0 9999em rgb(0,0,0,0.7)'
          }}
        >
          <ScreenShotStatus />
          <Content
            flex
            gap={4}
            style={{
              position: 'absolute',
              bottom: -8,
              transform:
                Math.abs(window.innerHeight - (rect.top + rect.height)) < 40
                  ? 'translateY(-50%) translateX(-50%)'
                  : 'translateY(100%) translateX(-50%)',
              userSelect: 'none',
              padding: '2px 6px',
              borderRadius: '6px',
              left: '50%',
              zIndex: 10,
              background: 'white',
              color: Colors.Font.Black,
              boxShadow: Colors.Background.PopoverBoxShadow
            }}
          >
            <ScreenShotToolbar
              on={async event => {
                switch (event.type) {
                  case 'close': {
                    setScreenShotLayerVisible(false)
                    break
                  }
                  case 'ocr': {
                    if (selectionBoxState.rect) {
                      if (!ocrResult || ocrResult === 'loading') {
                        setOcrResult('loading')
                        const blob = await getImageBlob()
                        const result = await OcrService.ocrImage(blob)
                        if (result) {
                          setOcrResult(result.result.map(i => i.words).join(' '))
                        }
                      }
                    }
                    break
                  }
                  case 'move-to': {
                    const m = await handleAddMeta()
                    if (m) {
                      GlobalInstance.metaOps?.quickAdd(m.id)
                    }
                    break
                  }
                  case 'add as object': {
                    handleAddMeta(true)
                    break
                  }
                  case 'download': {
                    const a = document.createElement('a')
                    a.download = `Rendevoz-screenshot-${Id.getStrId()}.png`
                    getImageBlob().then(blob => {
                      a.href = URL.createObjectURL(blob)
                      a.click()
                      setScreenShotLayerVisible(false)
                    })
                    break
                  }
                  case 'return': {
                    setSelectionBoxState({ visible: false })
                    break
                  }
                }
              }}
            />
          </Content>
        </Rnd>
      )}
    </div>
  )
  return createPortal(<>{screenShotLayerVisible && renderScreenShotLayer()}</>, document.body, 'screen-shot-layer')
}

export default GlobalScreenShot
