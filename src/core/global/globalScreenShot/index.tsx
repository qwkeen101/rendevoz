import { useGlobalAtom, useMemoizedFn, useToggle } from '@/hooks'
import { Position } from '@/types'
import isHotkey, { compareHotkey } from 'is-hotkey'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, PanInfo, useAnimationControls } from 'framer-motion'
import { Content, Icon, Toolbar, Tooltip } from '@/components'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { takeScreenshotCanvas } from './screenshot'
import produce from 'immer'
import Id from '@/utils/id'
import ScreenShotCanvas from './ScreenShotCanvas'
import { GlobalPocketInstance } from '../GlobalPocket'
import { saveImageLocally } from '@/utils/img'
import panzoom, { PanZoom } from 'panzoom'
import getSetting from '@/core/setting/getSetting'
import { GlobalEventEmitter } from '@/events'
import { normalizeScreenshot } from './normalizeScreenshot'
import { ObjectStore } from '@/stores'
import { useTranslation } from 'react-i18next'
import { atom } from 'jotai'
import ScreenShotStatus from './ScreenShotStatus'
import ScreenShotToolbar from './ScreenShotToolbar'
import OcrService from '@/services/ocr.service'
import Colors from '@/consts/colors'

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
  const [previewState, setPreviewState] = useState<
    Partial<{
      visible: boolean
      src: string
      rect: { left: number; top: number; width: number; height: number }
    }>
  >()
  const [drawing, toggleDrawing] = useToggle(false)
  const [erase, toggleErase] = useToggle(false)
  const [freeCut, setFreeCut] = useState(true)
  const selectionBoxRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const panzoomRef = useRef<PanZoom>()
  const isPressed = useRef(false)
  const framerId = useRef(0)
  const controls = useAnimationControls()
  const { t } = useTranslation()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (toolbarRef.current?.contains(e.target)) {
      selectionBoxState?.visible && setSelectionBoxState({ visible: false })
      return
    }
    if (canvasRef.current?.contains(e.target)) {
      return
    }
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
          setSelectionBoxState({ ...selectionBoxState, isSelecting: false, stable: true })
        }
      }
    }
    if (e.type === 'pointermove') {
      if (selectionBoxState?.stable) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      if (!freeCut && !selectionBoxState?.startPosition) {
        let target = e.target as HTMLElement
        let rect = target.getBoundingClientRect()
        while (rect.height < 200 && rect.width < 200 && target.parentElement) {
          target = target.parentElement
          rect = target.getBoundingClientRect()
        }
        setSelectionBoxState({
          visible: true,
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width + rect.left > window.innerWidth ? window.innerWidth - rect.left : rect.width,
            height: rect.height + rect.top > window.innerHeight ? window.innerHeight - rect.top : rect.height
          }
        })
        return
      }
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

  const selectionBoxLines: {
    pos: string
    style: CSSProperties
    drag: 'x' | 'y'
    onDrag: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
    onDragEnd?: VoidFunction
  }[] = [
    {
      pos: 'right',
      drag: 'x',
      style: {
        position: 'absolute',
        cursor: 'ew-resize',
        right: -3,
        top: 0,
        width: 5,
        height: '100%'
      },
      onDrag: (e, info) => {
        const dx = info.delta.x
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.width += dx
              }
            })
          )
        }
      }
    },
    {
      pos: 'left',
      drag: 'x',
      style: {
        position: 'absolute',
        cursor: 'ew-resize',
        left: -3,
        top: 0,
        width: 5,
        height: '100%'
      },
      onDrag: (e, info) => {
        const dx = info.delta.x
        if (selectionBoxRef.current && selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.width -= dx
                draft.rect.left += dx
              }
            })
          )
        }
      }
    },
    {
      pos: 'top',
      drag: 'y',
      style: {
        position: 'absolute',
        cursor: 'ns-resize',
        top: -3,
        left: 0,
        height: 5,
        width: '100%'
      },
      onDrag: (e, info) => {
        const dy = info.delta.y
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.top += dy
                draft.rect.height -= dy
              }
            })
          )
        }
      }
    },
    {
      pos: 'bottom',
      drag: 'y',
      style: {
        position: 'absolute',
        cursor: 'ns-resize',
        bottom: -3,
        left: 0,
        height: 5,
        width: '100%'
      },
      onDrag: (e, info) => {
        const dy = info.delta.y
        if (selectionBoxState && selectionBoxRef.current) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.height += dy
              }
            })
          )
        }
      }
    }
  ]

  selectionBoxLines.forEach(i => {
    i.style = {
      ...i.style,
      backgroundColor: '#39f',
      opacity: 0.15
    }
    i.onDragEnd = () => {
      setSelectionBoxState(
        produce(selectionBoxState, draft => {
          if (draft?.rect) {
            if (draft.rect.width < 0) {
              draft.rect.left += draft.rect.width
              draft.rect.width = Math.abs(draft.rect.width)
            }
            if (draft.rect.height < 0) {
              draft.rect.top += draft.rect.height
              draft.rect.height = Math.abs(draft.rect.height)
            }
          }
        })
      )
    }
  })
  const selectionBoxPoints: {
    pos: 'tl' | 'tc' | 'tr' | 'l' | 'r' | 'bl' | 'bc' | 'br'
    drag: 'x' | 'y' | 'all'
    style?: CSSProperties
    onDrag?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
    onDragEnd?: VoidFunction
  }[] = [
    {
      pos: 'tl',
      style: {
        cursor: 'nwse-resize',
        left: -3,
        top: -3
      },
      drag: 'all',
      onDrag: (e, info) => {
        const { x: dx, y: dy } = info.delta
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.left += dx
                draft.rect.top += dy
                draft.rect.width -= dx
                draft.rect.height -= dy
              }
            })
          )
        }
      }
    },
    {
      pos: 'tc',
      style: {
        cursor: 'ns-resize',
        top: -3,
        left: '50%',
        marginLeft: -3
      },
      onDrag: selectionBoxLines[2].onDrag,
      drag: 'y'
    },
    {
      pos: 'tr',
      style: {
        cursor: 'nesw-resize',
        right: -3,
        top: -3
      },
      drag: 'all',
      onDrag: (e, info) => {
        const { x: dx, y: dy } = info.delta
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.top += dy
                draft.rect.width += dx
                draft.rect.height -= dy
              }
            })
          )
        }
      }
    },
    {
      pos: 'l',
      onDrag: selectionBoxLines[1].onDrag,
      drag: 'x',
      style: {
        cursor: 'ew-resize',
        left: -3,
        top: '50%',
        marginTop: -3
      }
    },
    {
      pos: 'r',
      onDrag: selectionBoxLines[0].onDrag,
      drag: 'x',
      style: {
        cursor: 'ew-resize',
        marginTop: -3,
        right: -3,
        top: '50%'
      }
    },
    {
      pos: 'bl',
      drag: 'all',
      style: {
        bottom: -3,
        cursor: 'nesw-resize',
        left: -3
      },
      onDrag: (e, info) => {
        const { x: dx, y: dy } = info.delta
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.left += dx
                draft.rect.width -= dx
                draft.rect.height += dy
              }
            })
          )
        }
      }
    },
    {
      pos: 'br',
      drag: 'all',
      style: {
        cursor: 'nwse-resize',
        bottom: -3,
        right: -3
      },
      onDrag: (e, info) => {
        const { x: dx, y: dy } = info.delta
        if (selectionBoxState) {
          setSelectionBoxState(
            produce(selectionBoxState, draft => {
              if (draft.rect) {
                draft.rect.width += dx
                draft.rect.height += dy
              }
            })
          )
        }
      }
    },
    {
      pos: 'bc',
      onDrag: selectionBoxLines[3].onDrag,
      drag: 'y',
      style: {
        cursor: 's-resize',
        bottom: -3,
        left: '50%',
        marginLeft: -3
      }
    }
  ]
  selectionBoxPoints.forEach(i => {
    if (i.style) {
      i.style = {
        ...i.style,
        position: 'absolute',
        background: '#39f',
        width: 5,
        height: 5,
        opacity: 0.75
      }
    }
    i.onDragEnd = () => {
      setSelectionBoxState(
        produce(selectionBoxState, draft => {
          if (draft?.rect) {
            if (draft.rect.width < 0) {
              draft.rect.left += draft.rect.width
              draft.rect.width = Math.abs(draft.rect.width)
            }
            if (draft.rect.height < 0) {
              draft.rect.top += draft.rect.height
              draft.rect.height = Math.abs(draft.rect.height)
            }
          }
        })
      )
    }
  })
  useEffect(() => {
    if (selectionBoxState?.stable) {
      const _pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerdown') {
          if (e.target === e.currentTarget) {
            isPressed.current = true
          }
        }
        if (e.type === 'pointermove') {
          if (isPressed.current) {
            cancelAnimationFrame(framerId.current)
            framerId.current = requestAnimationFrame(() => {
              setSelectionBoxState(state =>
                produce(state, draft => {
                  if (draft?.rect) {
                    const newLeft = draft.rect.left + e.movementX
                    const newTop = draft.rect.top + e.movementY
                    const newBottom = newTop + draft.rect.height
                    const newRight = newLeft + draft.rect.width
                    newLeft >= 0 && newRight <= window.innerWidth && (draft.rect.left += e.movementX)
                    newTop >= 0 && newBottom <= window.innerHeight && (draft.rect.top += e.movementY)
                  }
                })
              )
            })
          }
        }
        if (e.type === 'pointerup') {
          isPressed.current = false
        }
      }
      selectionBoxRef.current?.addEventListener('pointerdown', _pointerHandler)
      document?.addEventListener('pointermove', _pointerHandler)
      document?.addEventListener('pointerup', _pointerHandler)
      return () => {
        selectionBoxRef.current?.removeEventListener('pointerdown', _pointerHandler)
        document?.removeEventListener('pointermove', _pointerHandler)
        document?.removeEventListener('pointerup', _pointerHandler)
      }
    } else {
      setOcrResult(undefined)
    }
  }, [selectionBoxState?.stable])
  useEffect(() => {
    if (screenShotLayerVisible) {
      const root = document.getElementById('root')
      if (root) {
        document.body.style.overflow = 'hidden'
        const instance = panzoom(root, {
          beforeMouseDown: e => {
            return true
          },
          zoomSpeed: 0.05
        })
        panzoomRef.current = instance
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
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      const openScreenShotKey = getSetting().shortcut.openScreenShot
      if (openScreenShotKey && compareHotkey(openScreenShotKey, e)) {
        setScreenShotLayerVisible(state => !state)
      }
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
    const canvas = (await takeScreenshotCanvas()) as HTMLCanvasElement
    selectionBoxRef.current!.classList.remove(className)
    const rect = selectionBoxState?.rect
    const dpr = window.devicePixelRatio
    if (rect) {
      const newCanvas = document.createElement('canvas')
      newCanvas.height = rect.height * dpr
      newCanvas.width = rect.width * dpr
      const ctx = newCanvas.getContext('2d')
      if (ctx && canvas) {
        ctx.drawImage(
          canvas,
          rect.left * dpr,
          rect.top * dpr,
          rect.width * dpr,
          rect.height * dpr,
          0,
          0,
          rect.width * dpr,
          rect.height * dpr
        )
        return new Promise(resolve => {
          newCanvas.toBlob(b => resolve(b), 'image/png')
        })
      }
    }
  })
  const closeAndSaveToGallery = () => {
    getImageBlob().then((blob: Blob) => {
      saveImageLocally(Id.getStrId(), blob).then(data => {
        const url = data.data
        setScreenShotLayerVisible(false)
        setPreviewState({
          src: url,
          visible: true
        })
      })
    })
  }
  useEffect(() => {
    if (previewState?.visible) {
      controls.set({
        x: rect?.left,
        y: rect?.top,
        width: rect?.width,
        height: rect?.height,
        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 30px',
        position: 'absolute'
      })
      setTimeout(async () => {
        const galleryRect = GlobalPocketInstance?.getRect()
        if (galleryRect) {
          console.log(galleryRect)
          await controls.start({
            y: galleryRect.top - 50,
            x: galleryRect.left,
            width: 30,
            height: 30,
            scale: 1,
            transition: { duration: 1 }
          })
          await controls.start({
            y: galleryRect.top + 10,
            opacity: 0,
            transition: { duration: 0.5 }
          })
        }
        GlobalPocketInstance?.addObject({
          type: 'image',
          url: previewState.src
        })
        setPreviewState({ visible: false })
      }, 1300)
    }
  }, [previewState?.visible])
  const startPos = selectionBoxState?.startPosition
  const endPos = selectionBoxState?.endPosition
  const rect = selectionBoxState?.rect
  const renderTopRightToolbar = () => {
    return (
      <Content
        flex
        position="absolute"
        ref={toolbarRef}
        gap={10}
        className={css({
          width: 'fit-content',
          position: 'absolute',
          left: 20,
          top: 10,
          zIndex: 1000001,
          pointerEvents: 'auto',
          '> div': {
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 9999,
            cursor: 'pointer !important'
          }
        })}
      >
        <Tooltip style={{ zIndex: 1000001 }} content="Auto fit">
          <Icon onClick={() => setFreeCut(false)} className={ClassName.circleButton()} name="park-auto-width" />
        </Tooltip>
        <Tooltip style={{ zIndex: 1000001 }} content="Free clip">
          <Icon onClick={() => setFreeCut(true)} className={ClassName.circleButton()} name="park-screenshot" />
        </Tooltip>
        <Tooltip style={{ zIndex: 1000001 }} content="Exit">
          <Icon onClick={() => setScreenShotLayerVisible(false)} className={ClassName.circleButton()} name="park-close" />
        </Tooltip>
      </Content>
    )
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
        pointerEvents: selectionBoxState?.stable || freeCut ? 'auto' : 'none',
        background: selectionBoxState?.visible && rect ? 'none' : 'rgba(0,0,0,0.7)'
      }}
    >
      {rect && (
        <ScreenShotCanvas
          erase={erase}
          innerRef={canvasRef}
          style={{
            pointerEvents: drawing ? 'auto' : 'none',
            position: 'absolute',
            width: Math.abs(rect.width),
            height: Math.abs(rect.height),
            transform: `translateX(${rect.width > 0 ? rect.left : rect.left + rect.width}px) translateY(${
              rect.height > 0 ? rect.top : rect.top + rect.height
            }px)`,
            overflow: 'hidden'
          }}
        />
      )}
      {!selectionBoxState?.stable && renderTopRightToolbar()}
      {selectionBoxState?.visible && rect && (
        <div
          ref={selectionBoxRef}
          style={{
            position: 'absolute',
            width: Math.abs(rect.width),
            height: Math.abs(rect.height),
            transform: `translateX(${rect.width > 0 ? rect.left : rect.left + rect.width}px) translateY(${
              rect.height > 0 ? rect.top : rect.top + rect.height
            }px)`,
            boxShadow: '0 0 0 9999em rgb(0,0,0,0.7)',
            outline: '1px solid #39f',
            pointerEvents: selectionBoxState.startPosition || selectionBoxState.stable ? 'auto' : 'none',
            cursor: selectionBoxState.stable ? 'grab' : 'default'
          }}
        >
          <ScreenShotStatus />
          <Content
            flex
            gap={3}
            style={{
              position: 'absolute',
              right: 0,
              bottom: -8,
              transform: Math.abs(window.innerHeight - (rect.top + rect.height)) < 40 ? 'translateY(-50%)' : 'translateY(100%)',
              userSelect: 'none',
              background: Colors.Background.ButtonHover,
              padding: '0px 12px',
              borderRadius: '999px',
              zIndex: 10
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
                      // const { relatedMeta, normalizedImage } = normalizeScreenshot(selectionBoxState.rect)
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
                  case 'add as object': {
                    if (selectionBoxState.rect) {
                      const blob = await getImageBlob()
                      const { relatedMeta, normalizedImage, normalizedImageMeta } = normalizeScreenshot(selectionBoxState.rect)
                      const imgPath = (await saveImageLocally(Id.getStrId(), blob!, false)).data
                      const one = await ObjectStore('image').addOne({
                        ...normalizedImage,
                        imageUrl: imgPath
                      })
                      GlobalEventEmitter().emit('global', {
                        type: 'globalNeedAddMetaObject',
                        data: {
                          currentObject: {
                            type: 'image',
                            coverImgSrc: imgPath,
                            objectId: one.id,
                            description: ocrResult,
                            ...normalizedImageMeta
                          },
                          fromMetas: relatedMeta
                        }
                      })
                    }
                    break
                  }
                  case 'download': {
                    const a = document.createElement('a')
                    a.download = `Rendevoz-screenshot-${Id.getStrId()}.png`
                    getImageBlob().then(blob => {
                      a.href = URL.createObjectURL(blob)
                      a.click()
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
          {selectionBoxLines.map(i => (
            <motion.div
              drag={i.drag}
              dragElastic={0}
              onDrag={i.onDrag}
              onDragEnd={i.onDragEnd}
              dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
              dragMomentum={false}
              key={i.pos}
              style={i?.style}
            ></motion.div>
          ))}
          {selectionBoxPoints.map(i => (
            <motion.div
              drag={i.drag === 'all' ? true : i.drag}
              dragElastic={0}
              onDrag={i.onDrag}
              onDragEnd={i.onDragEnd}
              dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
              dragMomentum={false}
              key={i.pos}
              style={i?.style}
            ></motion.div>
          ))}
        </div>
      )}
    </div>
  )
  const renderPreview = () => <motion.img animate={controls} src={previewState?.src} style={{ position: 'absolute', zIndex: 1100 }} />
  return createPortal(
    <>
      {screenShotLayerVisible && renderScreenShotLayer()}
      {previewState?.visible && renderPreview()}
    </>,
    document.body,
    'screen-shot-layer'
  )
}

export default GlobalScreenShot
