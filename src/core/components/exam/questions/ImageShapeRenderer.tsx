import { IExamImageOcclusionQuestion } from '~/typings'
import { Colors } from '@/consts'
import { AutosizeTextarea, Icon } from '@/components'
import { Rnd } from 'react-rnd'
import { RefObject, useState } from 'react'
import { useDebounceFn } from '@/hooks'
import { curveLinear } from 'd3'
export default ({
  type,
  size,
  color,
  answer,
  rotation,
  position,
  showCloze,
  onChange,
  isSelected,
  editTooltip,
  onSelect,
  value,
  draggable,
  preview,
  history,
  containerRef,
  index,
  tip,
  test
}: IExamImageOcclusionQuestion['content'][0] & {
  showCloze?: boolean
  editTooltip?: boolean
  onChange?: (v: Partial<IExamImageOcclusionQuestion['content'][0]>) => void
  draggable?: boolean
  onSelect?: VoidFunction
  isSelected?: boolean
  preview?: boolean
  test?: boolean
  history?: boolean
  index?: number
  containerRef?: RefObject<HTMLDivElement>
}) => {
  const [showBg, setShowBg] = useState(true)
  if (preview) {
    if (isSelected) {
      return (
        <div
          style={{
            position: 'absolute',
            left: `${position[0]}%`,
            top: `${position[1]}%`,
            width: `${size[0]}%`,
            height: `${size[1]}%`,
            background: `rgba(from ${Colors.getAdaptColor(color)} r g b / 0.35)`,
            border: `2px solid ${Colors.getAdaptColor(color)}`,
            borderRadius: type === 'circle' ? '50%' : '0.25rem'
          }}
        ></div>
      )
    }
    return null
  }
  if (!containerRef) {
    const mid = size[0] / 2 + position[0]
    const dir = mid < 50 ? 'left' : 'right'
    return (
      <>
        <div
          style={{
            position: 'absolute',
            left: `${position[0]}%`,
            top: `${position[1]}%`,
            width: `${size[0]}%`,
            height: `${size[1]}%`,
            background: showBg ? Colors.getAdaptColor(color) : undefined,
            pointerEvents: test || history ? 'auto' : 'none',
            cursor: history ? 'pointer' : undefined,
            userSelect: history ? 'none' : undefined,
            border: !showBg ? `1.5px solid ${Colors.getAdaptColor(color)}` : undefined,
            borderRadius: type === 'circle' ? '50%' : '0.25rem'
          }}
          onPointerDown={e => {
            if (test) {
              const ele = e.currentTarget.firstElementChild as HTMLElement
              setTimeout(() => ele.focus())
            }
          }}
          onClick={() => {
            if (history) {
              setShowBg(!showBg)
            }
          }}
          className={'flex overflow-y-auto cursor-text px-3'}
        >
          {showBg && (
            <AutosizeTextarea
              value={history || test ? value || '' : answer || ''}
              disabled={draggable || history}
              onChange={e => {
                if (test) {
                  onChange?.({
                    value: e
                  })
                }
              }}
              style={{
                minWidth: 1,
                minHeight: 1
              }}
              placeholder={history ? '' : test ? tip || '输入答案' : tip || '编辑答案'}
              className={'m-auto'}
            ></AutosizeTextarea>
          )}
        </div>
        {history && answer && (
          <>
            <div
              style={{
                position: 'absolute',
                [dir]: 0,
                top: `${position[1] + size[1] / 2}%`,
                borderRadius: '8px',
                padding: '4px 8px',
                gap: 6,
                background: `rgba(from ${Colors.getAdaptColor(color)} r g b / 0.5)`,
                border: `1px solid ${Colors.getAdaptColor(color)}`,
                display: 'flex',
                alignItems: 'start',
                transform:
                  dir === 'left' ? 'translateX(calc(-100% - 20px)) translateY(-50%)' : 'translateX(calc(100% + 20px)) translateY(-50%)'
              }}
            >
              {value === answer ? (
                <Icon
                  theme={'filled'}
                  strokeWidth={8}
                  style={{
                    marginTop: 4
                  }}
                  className={'text-green-500'}
                  name={'park-check'}
                />
              ) : (
                <Icon
                  style={{
                    marginTop: 4
                  }}
                  theme={'filled'}
                  className={'text-red-500'}
                  name={'park-error'}
                />
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{answer}</div>
            </div>
            <div
              style={{
                position: 'absolute',
                top: `${position[1] + size[1] / 2}%`,
                borderBottom: `1px solid ${Colors.getAdaptColor(color)}`,
                [dir]: 0,
                width: dir === 'left' ? `calc(20px + ${position[0]}%)` : `calc(${100 - size[0] - position[0]}% + 20px)`,
                transform: dir === 'left' ? 'translateX(-20px) translateY(-50%)' : 'translateX(20px) translateY(-50%)'
              }}
            ></div>
          </>
        )}
      </>
    )
  }
  const bound = containerRef.current?.getBoundingClientRect()
  const debounceChange = useDebounceFn(
    (v: Partial<IExamImageOcclusionQuestion['content'][0]>) => {
      onChange?.(v)
    },
    { wait: 500 }
  )

  if (!bound) return null
  return (
    <Rnd
      size={{
        width: (size[0] / 100) * bound.width,
        height: (size[1] / 100) * bound.height
      }}
      position={{
        x: (position[0] / 100) * (bound?.width ?? 0),
        y: (position[1] / 100) * (bound?.height ?? 0)
      }}
      onResizeStop={(e, dir, elementRef, delta, position) => {
        const eleBound = elementRef.getBoundingClientRect()
        const box = {
          left: Number((((eleBound.left - bound.left) / bound.width) * 100).toFixed(3)),
          top: Number((((eleBound.top - bound.top) / bound.height) * 100).toFixed(3)),
          width: Number(((eleBound.width / bound.width) * 100).toFixed(3)),
          height: Number(((eleBound.height / bound.height) * 100).toFixed(3))
        }
        onChange?.({
          position: [box.left, box.top],
          size: [box.width, box.height]
        })
      }}
      onDragStop={(e, data) => {
        const eleBound = data.node.getBoundingClientRect()
        const box = {
          left: Number((((eleBound.left - bound.left) / bound.width) * 100).toFixed(3)),
          top: Number((((eleBound.top - bound.top) / bound.height) * 100).toFixed(3)),
          width: Number(((eleBound.width / bound.width) * 100).toFixed(3)),
          height: Number(((eleBound.height / bound.height) * 100).toFixed(3))
        }
        onChange?.({
          position: [box.left, box.top],
          size: [box.width, box.height]
        })
      }}
      disableDragging={!draggable}
      bounds={'parent'}
      style={{
        position: 'absolute',
        display: 'flex',
        borderRadius: type === 'circle' ? '50%' : '0.25rem',
        boxShadow: isSelected ? '0 0 0 2px var(--select-color)' : undefined,
        background: `rgba(from ${Colors.getAdaptColor(color)} r g b / ${showCloze ? 0.4 : 1})`
      }}
    >
      <div
        onPointerDown={e => {
          if (!draggable) {
            const ele = e.currentTarget.firstElementChild as HTMLElement
            setTimeout(() => ele.focus())
            onSelect?.()
          }
        }}
        style={{
          cursor: draggable ? 'grab' : 'text',
          pointerEvents: draggable || showCloze ? 'none' : undefined
        }}
        className={'w-full flex h-full overflow-y-auto px-3'}
      >
        <AutosizeTextarea
          value={editTooltip ? tip || '' : answer || ''}
          disabled={draggable}
          style={{
            minWidth: 1,
            minHeight: 1,
            opacity: showCloze ? 0 : 1
          }}
          placeholder={editTooltip ? '编辑提示' : '编辑答案'}
          onChange={v => {
            if (editTooltip) {
              debounceChange.run({
                tip: v
              })
            } else {
              debounceChange.run({
                answer: v
              })
            }
          }}
          className={'m-auto'}
        ></AutosizeTextarea>
      </div>
    </Rnd>
  )
}
