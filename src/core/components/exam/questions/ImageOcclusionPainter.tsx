import { Box, IExamImageOcclusionQuestion, Point } from '~/typings'
import { memo, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePopover, ToolbarV2, WithBorder } from '@/components'
import { ObjectStore } from '@/api/stores'
import { useMeasure, useMemoizedFn } from '@/hooks'
import produce, { applyPatches, Patch, produceWithPatches } from 'immer'
import { boxesIntersect, Id } from '@/utils'
import ImageShapeRenderer from '@/core/components/exam/questions/ImageShapeRenderer'
import ImageArrowRenderer from '@/core/components/exam/questions/ImageArrowRenderer'
import { Colors, Icons, KEY } from '@/consts'
import classnames from 'classnames'
import isHotkey from 'is-hotkey'
import createPanZoom from 'panzoom'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(({ question, colors }: { question: IExamImageOcclusionQuestion; colors: string[] }) => {
  const [state, setState] = useState<{
    tool: 'rect' | 'circle' | 'move' | 'paint' | 'arrow' | 'drag'
    color: string
    selected?: Set<number>
  }>({
    tool: 'move',
    color: colors[0]
  })
  const [history, setHistory] = useState<{
    redos: {
      inverse: Patch[]
      patches: Patch[]
    }[]
    undos: {
      inverse: Patch[]
      patches: Patch[]
    }[]
  }>({
    redos: [],
    undos: []
  })
  console.log(history)
  const handleUpdate = useMemoizedFn((e: (v: IExamImageOcclusionQuestion) => void) => {
    const [newQuestion, patches, inversePatches] = produceWithPatches(question, draft => {
      e(draft)
    })
    setHistory({
      redos: [],
      undos: [
        ...history.undos,
        {
          patches,
          inverse: inversePatches
        }
      ]
    })
    ObjectStore('examQuestion').updateOne(newQuestion)
  })
  const handleHistory = useMemoizedFn((dir: 'redo' | 'undo') => {
    if (dir === 'redo') {
      setHistory(s => {
        const lastRedo = s.redos.at(-1)
        if (lastRedo) {
          const applied = applyPatches(question, lastRedo.patches)
          ObjectStore('examQuestion').updateOne(applied)
          return {
            redos: s.redos.slice(0, -1),
            undos: [...s.undos, lastRedo]
          }
        }
        return s
      })
    } else {
      setHistory(s => {
        const lastUndo = s.undos.at(-1)
        if (lastUndo) {
          const applied = applyPatches(question, lastUndo.inverse)
          ObjectStore('examQuestion').updateOne(applied)
          return {
            redos: [...s.redos, lastUndo],
            undos: s.undos.slice(0, -1)
          }
        }
        return s
      })
    }
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{
    start: Point
    end: Point
  }>()
  useEffect(() => {
    if (['rect', 'circle', 'arrow', 'move'].includes(state.tool)) {
      const container = containerRef.current
      if (container) {
        const handler = (e: PointerEvent) => {
          if (e.type === 'pointerdown') {
            if (!(e.target instanceof HTMLImageElement)) return
            setState(s => ({ ...s, selected: undefined }))
            const bounding = container.getBoundingClientRect()
            const point: Point = {
              x: e.clientX - bounding.left,
              y: e.clientY - bounding.top
            }
            setBox({
              start: point,
              end: point
            })
            document.addEventListener('pointermove', handler)
          }
          if (e.type === 'pointermove') {
            e.preventDefault()
            const bounding = container.getBoundingClientRect()
            const point: Point = {
              x: e.clientX - bounding.left,
              y: e.clientY - bounding.top
            }
            setBox(s =>
              s
                ? {
                    start: s.start,
                    end: point
                  }
                : undefined
            )
            if (state.tool === 'move') {
              calculateSelected()
            }
          }
          if (e.type === 'pointerup') {
            document.removeEventListener('pointermove', handler)
            setBox(undefined)
            if (state.tool !== 'move') {
              handleInsert()
            }
          }
          if (e.type === 'keydown') {
            const event = e as unknown as KeyboardEvent
            if (isHotkey(KEY.Delete, event) || isHotkey(KEY.Backspace, event)) {
              if (!(event.target as Element).closest('input,textarea,[contenteditable]')) {
                handleDelete()
              }
            }
          }
        }
        document.addEventListener('keydown', handler)
        container.addEventListener('pointerdown', handler)
        document.addEventListener('pointerup', handler)
        return () => {
          document.removeEventListener('keydown', handler)
          container.removeEventListener('pointerdown', handler)
          document.removeEventListener('pointerup', handler)
        }
      }
    }
  }, [state.tool])
  const handleInsert = useMemoizedFn(() => {
    const container = containerRef.current
    if (container && box) {
      const { start, end } = box
      const { clientWidth: width, clientHeight: height } = container
      const cropBox = getCropBox(start, end, container)
      if ((cropBox.width / 100) * width < 5 || (cropBox.height / 100) * height < 5) return
      if (state.tool === 'rect' || state.tool === 'circle') {
        handleUpdate(q =>
          q.content.push({
            type: state.tool,
            color: state.color,
            size: [cropBox.width, cropBox.height],
            position: [cropBox.left, cropBox.top],
            id: Id.getId()
          })
        )
      }
      if (state.tool === 'arrow') {
        handleUpdate(
          e =>
            (e.arrows = [
              ...(e.arrows || []),
              {
                id: Id.getId(),
                color: state.color,
                position: [
                  (start.x / width) * 100,
                  (start.y / height) * 100,
                  Math.min(100, (end.x / width) * 100),
                  Math.min(100, (end.y / height) * 100)
                ]
              }
            ])
        )
      }
    }
  })
  const calculateSelected = useMemoizedFn(() => {
    const container = containerRef.current
    if (container && box) {
      const { start, end } = box
      const cropBox = getCropBox(start, end, container)
      const includedContents = question.content
        .filter(i => {
          const bbox = {
            left: i.position[0],
            top: i.position[1],
            width: i.size[0],
            height: i.size[1]
          }
          return boxesIntersect(cropBox, bbox)
        })
        .map(i => i.id)
      const includedArrows = question.arrows
        ?.filter(i => {
          const [x1, y1, x2, y2] = i.position
          const bbox = {
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1)
          }
          return boxesIntersect(cropBox, bbox)
        })
        .map(i => i.id)
      setState(s => ({ ...s, selected: new Set([...(includedArrows || []), ...includedContents]) }))
    }
  })

  const handleDelete = useMemoizedFn(() => {
    setState(s => ({ ...s, selected: undefined }))
    handleUpdate(e => {
      e.arrows = e.arrows?.filter(i => !state.selected?.has(i.id))
      e.content = e.content?.filter(i => !state.selected?.has(i.id))
    })
  })
  const [showCloze, setShowCloze] = useState(false)
  const [editTip, setEditTip] = useState(false)
  const [double, setDouble] = useState(false)
  const doubleContainerRef = useRef<HTMLDivElement>()
  useEffect(() => {
    if (double) {
      const container = doubleContainerRef.current
      if (container) {
        const panzoom = createPanZoom(container)
        return () => {
          panzoom.dispose()
        }
      }
    }
  }, [double])
  const toolIcons = {
    drag: 'park-fist',
    move: 'park-move-one',
    rect: 'park-rectangle-one',
    circle: 'park-round',
    arrow: 'park-arrow-right-up'
  }
  useMeasure(containerRef)
  const { t } = useTranslation()
  return (
    <div data-no-dnd className={'flex flex-col'}>
      <ToolbarV2
        className={'gap-1 border-bottom pl-1'}
        layout={[
          {
            type: 'button',
            key: 'undo',
            icon: 'park-undo',
            onClick: () => handleHistory('undo'),
            className: history.undos.length === 0 ? 'pointer-events-none opacity-20' : ''
          },
          {
            type: 'button',
            key: 'redo',
            icon: 'park-redo',
            onClick: () => handleHistory('redo'),
            className: history.redos.length === 0 ? 'pointer-events-none opacity-20' : ''
          },
          {
            type: 'button',
            key: 'tooltip',
            onClick: () => {
              setEditTip(!editTip)
            },
            text: t('exam.Edit tip'),
            className: editTip ? 'active-button' : ''
          },
          {
            type: 'button',
            key: 'answer',
            onClick: () => {
              setShowCloze(!showCloze)
            },
            text: t('exam.Show image'),
            className: showCloze ? 'active-button' : ''
          },
          {
            type: 'button',
            key: 'answer',
            onClick: () => {
              setDouble(!double)
            },
            text: t('exam.Double column'),
            className: double ? 'active-button' : ''
          },
          {
            type: 'button',
            key: 'remove',
            text: t(trans.Delete),
            onClick: () => {
              ObjectStore('examQuestion').updateOne({ id: question.id, url: '', content: [] })
            }
          }
        ]}
      ></ToolbarV2>
      <div
        className={'flex'}
        style={{
          height: '80vh',
          width: '90vw'
        }}
      >
        <ToolbarV2
          className={'gap-1 flex-col'}
          layout={[
            // @ts-ignore
            ...['move', 'drag', 'rect', 'circle', 'arrow'].map(i => ({
              type: 'button',
              key: i,
              onClick: () => {
                setState(s => ({ ...s, tool: i, selected: undefined }))
              },
              icon: toolIcons[i],
              className: state.tool === i ? 'active-button' : ''
            })),
            // @ts-ignore
            {
              type: 'separator',
              key: 's-1',
              vertical: true
            },
            // @ts-ignore
            {
              type: 'button',
              key: 'color',
              element: (
                <AnimatePopover
                  positions={['right']}
                  padding={6}
                  content={setV => (
                    <WithBorder>
                      <ToolbarV2
                        className={'flex-col'}
                        layout={[
                          ...colors.map(c => ({
                            key: `highlight-${c}`,
                            type: 'button',
                            element: (
                              <div
                                onClick={() => {
                                  setV(false)
                                  setState(s => ({ ...s, color: c }))
                                  if (state.selected?.size) {
                                    handleUpdate(e => {
                                      e.arrows = e.arrows?.map(i =>
                                        state.selected?.has(i.id)
                                          ? {
                                              ...i,
                                              color: c
                                            }
                                          : i
                                      )
                                      e.content = e.content?.map(i =>
                                        state.selected?.has(i.id)
                                          ? {
                                              ...i,
                                              color: c
                                            }
                                          : i
                                      )
                                    })
                                  }
                                }}
                                className={'square-button'}
                              >
                                <div
                                  style={{
                                    borderRadius: '50%',
                                    background: c,
                                    width: 17,
                                    height: 17,
                                    opacity: 0.7
                                  }}
                                ></div>
                              </div>
                            )
                          }))
                        ]}
                      />
                    </WithBorder>
                  )}
                >
                  <div className={'square-button'}>
                    <div
                      style={{
                        borderRadius: '50%',
                        background: state.color,
                        width: 17,
                        height: 17,
                        opacity: 0.7
                      }}
                    ></div>
                  </div>
                </AnimatePopover>
              )
            },
            // @ts-ignore
            state.selected?.size && state.tool === 'move'
              ? {
                  type: 'button',
                  key: 'delete',
                  icon: Icons.Delete,
                  onClick: () => {
                    handleDelete()
                  }
                }
              : undefined
          ]}
        ></ToolbarV2>
        <div className={'flex flex-1'}>
          <div className={'flex flex-1 p-6 border-left items-center justify-center'}>
            <div
              ref={containerRef}
              className={classnames('relative overflow-hidden', ['circle', 'rect', 'arrow'].includes(state.tool) && 'cursor-crosshair')}
            >
              <img
                draggable={false}
                src={question.url}
                style={{
                  maxHeight: '80vh',
                  width: '100vw'
                }}
              />
              {question.content.map((i, idx) => (
                <ImageShapeRenderer
                  containerRef={containerRef}
                  draggable={state.tool === 'drag'}
                  isSelected={!!state.selected?.has(i.id)}
                  onSelect={() => {
                    if (state.tool === 'move') {
                      setState(s => ({ ...s, selected: new Set([i.id]) }))
                    }
                  }}
                  onChange={v => {
                    handleUpdate(e => {
                      e.content[idx] = {
                        ...e.content[idx],
                        ...v
                      }
                    })
                  }}
                  showCloze={showCloze}
                  editTooltip={editTip}
                  key={i.id}
                  {...i}
                />
              ))}
              {question.arrows?.length ? (
                <svg
                  preserveAspectRatio={'none'}
                  width={'100%'}
                  viewBox={'0 0 100 100'}
                  height={'100%'}
                  className={'absolute pointer-events-none inset-0'}
                >
                  {question.arrows.map(i => (
                    <ImageArrowRenderer isSelected={!!state.selected?.has(i.id)} {...i} key={i.id} />
                  ))}
                </svg>
              ) : null}
              {box && (
                <ShapePlaceholder color={state.color} containerRef={containerRef} start={box.start} type={state.tool} end={box.end} />
              )}
            </div>
          </div>
          {double && (
            <div className={'border-left p-6 flex-1 flex items-center justify-center overflow-hidden'}>
              <div className={'relative'} ref={doubleContainerRef}>
                <img
                  draggable={false}
                  src={question.url}
                  style={{
                    maxHeight: '80vh',
                    width: '100vw'
                  }}
                />
                {question.content.map(i => (
                  <ImageShapeRenderer preview containerRef={containerRef} isSelected={!!state.selected?.has(i.id)} key={i.id} {...i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

const ShapePlaceholder = ({
  start,
  end,
  type,
  color,
  containerRef
}: {
  start: Point
  end: Point
  type: 'rect' | 'arrow' | 'circle' | 'move'
  color: string
  containerRef: RefObject<HTMLDivElement>
}) => {
  const container = containerRef.current
  if (container) {
    let cropBox: Box | undefined = undefined
    const { clientWidth: width, clientHeight: height } = container
    const crop = {
      top: Math.min(start.y, end.y),
      left: Math.min(start.x, end.x),
      width: Math.abs(start.x - end.x),
      height: Math.abs(start.y - end.y)
    }
    cropBox = {
      width: (crop.width / width) * 100,
      height: (crop.height / height) * 100,
      top: (crop.top / height) * 100,
      left: (crop.left / width) * 100
    }
    cropBox.width = Math.min(100 - cropBox.left, cropBox.width)
    cropBox.height = Math.min(100 - cropBox.top, cropBox.height)

    if (type === 'rect' || type === 'move') {
      return (
        <div
          className={'select-color-transparent-bg cursor-crosshair'}
          style={{
            position: 'absolute',
            top: `${cropBox.top}%`,
            left: `${cropBox.left}%`,
            width: `${cropBox.width}%`,
            height: `${cropBox.height}%`
          }}
        ></div>
      )
    }
    if (type === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const length = 10
      const startPoint = {
        x: end.x - length * Math.cos(angle - Math.PI / 6),
        y: end.y - length * Math.sin(angle - Math.PI / 6)
      }
      const endPoint = {
        x: end.x - length * Math.cos(angle + Math.PI / 6),
        y: end.y - length * Math.sin(angle + Math.PI / 6)
      }
      return (
        <svg className={'inset-0 absolute w-full h-full'}>
          <g>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} strokeWidth={2} stroke={Colors.getAdaptColor(color)}></line>
            <polygon
              points={`${end.x},${end.y} ${startPoint.x},${startPoint.y} ${endPoint.x},${endPoint.y}`}
              fill={Colors.getAdaptColor(color)}
            />
          </g>
        </svg>
      )
    }
    if (type === 'circle') {
      return (
        <div
          className={'select-color-transparent-bg cursor-crosshair'}
          style={{
            position: 'absolute',
            top: `${cropBox.top}%`,
            left: `${cropBox.left}%`,
            width: `${cropBox.width}%`,
            borderRadius: '50%',
            height: `${cropBox.height}%`
          }}
        ></div>
      )
    }
  }
}

const getCropBox = (start: Point, end: Point, container: HTMLDivElement) => {
  const { clientWidth: width, clientHeight: height } = container
  const crop = {
    top: Math.min(start.y, end.y),
    left: Math.min(start.x, end.x),
    width: Math.abs(start.x - end.x),
    height: Math.abs(start.y - end.y)
  }
  const cropBox = {
    width: (crop.width / width) * 100,
    height: (crop.height / height) * 100,
    top: (crop.top / height) * 100,
    left: (crop.left / width) * 100
  }
  cropBox.width = Math.min(100 - cropBox.left, cropBox.width)
  cropBox.height = Math.min(100 - cropBox.top, cropBox.height)
  return cropBox
}
