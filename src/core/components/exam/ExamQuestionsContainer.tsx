import { CSSProperties, PointerEvent, useEffect, useMemo, useState } from 'react'
import ExamQuestionWrapper from '@/core/components/exam/questions/ExamQuestionWrapper'
import { motion, AnimatePresence } from 'framer-motion'
import { Id } from '@/utils'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToFirstScrollableAncestor, restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { AnimatePopover } from '@/components'
import ExamQuestionTypeChooser from '@/core/components/exam/ExamQuestionTypeChooser'
import useExamInstance from '@/core/components/exam/useExamInstance'
import useExamState from '@/core/components/exam/useExamState'
import { ObjectStore } from '@/api/stores'

const colGap = 24
const elementTolerance = 12
const PLACEHOLDER_ID = Id.getId()
class MyPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }: PointerEvent) => {
        if (!event.isPrimary || event.button !== 0 || isInteractiveElement(event.target)) {
          return false
        }

        return true
      }
    }
  ]
}

function isInteractiveElement(element: HTMLElement) {
  const interactiveElements = ['button', 'input', 'textarea', 'select', 'option']

  if (interactiveElements.includes(element.tagName.toLowerCase())) {
    return true
  }
  if (element.closest('[contenteditable],[data-no-dnd]')) return true
  if (!element.closest('.sortable')) return true
  return false
}
export default ({
  ids,
  onChange,
  titleStyle,
  questionGap = colGap
}: {
  ids: number[]
  onChange: (ids: number[]) => void
  titleStyle?: CSSProperties
  questionGap?: number
}) => {
  const [placeholder, setPlaceholder] = useState<number>()
  const [addIconId, setAddIconId] = useState<number>()
  const [isDragging, setIsDragging] = useState(false)
  const questions = ObjectStore('examQuestion').useMultiple(ids)
  const notDescQuestions = useMemo(() => questions.filter(i => i.type !== 'description').map(i => i.id), [questions.length])
  const [state, setState] = useExamState()
  const instance = useExamInstance()
  useEffect(() => {
    if (isDragging) {
      if (addIconId) {
        setAddIconId(undefined)
      }
    }
  }, [isDragging])
  const realIds = useMemo(() => {
    const res = (ids || []).slice()
    if (placeholder) {
      const idx = res.findIndex(i => i === placeholder)
      if (idx >= 0) {
        res.splice(idx, 0, PLACEHOLDER_ID)
      }
    }
    return res
  }, [ids, placeholder])
  const handleLayoutPointerMove = (e: React.PointerEvent) => {
    const container = e.currentTarget as HTMLDivElement
    if (placeholder) return
    if (isDragging) return
    if (e.target instanceof HTMLElement && !container.contains(e.target)) return
    const children = Array.from(container.children) as HTMLDivElement[]
    const { clientY: y } = e
    const target = children.findIndex(i => {
      const bounding = i.getBoundingClientRect()
      const { top } = bounding
      let isTop = false
      if (y > top) {
        if (y - top < elementTolerance) {
          isTop = true
        }
      } else {
        if (top - y < elementTolerance + questionGap) {
          isTop = true
        }
      }
      return isTop
    })
    const targetId = target >= 0 ? children[target].id : undefined
    if (targetId) {
      setAddIconId(Number(targetId))
    } else {
      setAddIconId(undefined)
    }
  }

  const sensors = useSensors(useSensor(MyPointerSensor))
  if (state.mode === 'history' && state.currentHistory) {
    return (
      <div className={'flex flex-col w-full items-center relative'} style={{ gap: questionGap }}>
        {state.currentHistory.questions.map((q, idx) => (
          <ExamQuestionWrapper
            titleStyle={titleStyle}
            onViewHistory={() => {
              setState(s => ({ ...s, currentViewingQuestionWithHistory: s.categorizedQuestions?.[q.id] }))
            }}
            id={q.id}
            idx={idx}
            question={q}
            key={q.id}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      style={{ gap: questionGap }}
      onPointerMove={handleLayoutPointerMove}
      className={'flex sortable flex-col w-full items-center relative'}
    >
      <DndContext
        sensors={sensors}
        modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToParentElement]}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={event => {
          setIsDragging(false)
          const { active, over } = event
          if (active && over && active.id !== over.id) {
            const oldIndex = ids.findIndex(i => i === active.id)
            const newIndex = ids.findIndex(i => i === over.id)
            onChange?.(arrayMove(ids, oldIndex, newIndex))
          }
        }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {realIds.map(i =>
              i === PLACEHOLDER_ID && !isDragging ? (
                <AnimatePopover
                  visible
                  positions={['top', 'bottom']}
                  align={'start'}
                  withClickCover
                  onClickOutside={() => {
                    setAddIconId(undefined)
                    setPlaceholder(undefined)
                  }}
                  padding={6}
                  content={
                    <ExamQuestionTypeChooser
                      onChange={t => {
                        setAddIconId(undefined)
                        setPlaceholder(undefined)
                        setTimeout(() => {
                          instance.addQuestion({ type: t, direction: 'before', target: addIconId })
                        }, 300)
                      }}
                    />
                  }
                >
                  <motion.div
                    key={PLACEHOLDER_ID}
                    initial={{
                      height: 0
                    }}
                    className={'exam-add-placeholder'}
                    animate={{ height: 36 }}
                    exit={{ height: 0, marginTop: -questionGap }}
                  ></motion.div>
                </AnimatePopover>
              ) : (
                <ExamQuestionWrapper
                  titleStyle={titleStyle}
                  idx={notDescQuestions.indexOf(i)}
                  onAdd={() => {
                    if (placeholder) {
                      setPlaceholder(undefined)
                      return
                    }
                    setPlaceholder(i)
                  }}
                  showAdd={i === addIconId && !isDragging}
                  id={i}
                  key={i}
                />
              )
            )}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  )
}
