import { RenderElementProps } from 'slate-react'
import { ReactEditor, useSlate } from '@/core'
import { memo, useContext, useRef, useState } from 'react'
import classnames from 'classnames'
import { useClickOutside, useMergedRef } from '@/hooks'
import { ClozeModeContext } from '@/core/components/exam/questions/ExamClozeQuestion'
import { Transforms } from 'slate'
import { ClozeElement } from '~/typings'
import { useTranslation } from 'react-i18next'

export default memo(({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlate()
  const mode = useContext(ClozeModeContext)
  const clozeElement = element as ClozeElement
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const mergedRef = useMergedRef(containerRef, attributes.ref)
  const { t } = useTranslation()
  useClickOutside(
    () => {
      setIsSelected(false)
    },
    containerRef,
    isSelected
  )
  return (
    <span
      {...attributes}
      ref={mergedRef}
      contentEditable={false}
      className={classnames('relative rounded mx-2 pt-1 w-fit items-center inline-flex flex-col', isSelected && 'select-color-box-shadow')}
    >
      {!isSelected && mode === 'edit' && (
        <div className={'inset-0 z-10 absolute cursor-pointer'} onClick={() => setTimeout(() => setIsSelected(true))}></div>
      )}
      <input
        style={{
          fontSize: '0.92em',
          transform: 'translateY(-2px)',
          marginBottom: 2
        }}
        key={mode}
        defaultValue={mode === 'history' ? undefined : mode === 'edit' ? clozeElement.answer : clozeElement.value}
        disabled={mode === 'history'}
        placeholder={t('exam.Type your answer')}
        onChange={e => {
          const v = e.target.value
          const path = ReactEditor.findPath(editor, element)
          if (mode === 'edit') {
            Transforms.setNodes(
              editor,
              {
                answer: v
              },
              { at: path }
            )
          }
          if (mode === 'test') {
            Transforms.setNodes(
              editor,
              {
                value: v
              },
              { at: path }
            )
          }
        }}
        className={'border-bottom primary-border-color text-center'}
      />
      {children}
    </span>
  )
})
