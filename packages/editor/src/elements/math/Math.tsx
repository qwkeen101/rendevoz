import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useToggle } from '@/hooks'
import { AnimatePopover, WithBorder } from '@/components'
import { Transforms } from 'slate'
import { CustomElement, MathElement as IMathElement } from '~/typings'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import { ClassName } from 'rendevoz'
import useEditorInstance from '../hooks/useEditorInstance'
import MathInput from '../elements/math/MathInput'
import katex from 'katex'

const MathElement = memo(({ element, children, attributes }: RenderElementProps) => {
  const mathEle = element as IMathElement & CustomElement
  const editor = useSlateStatic()
  const renderContainerRef = useRef<HTMLSpanElement>(null)
  const [formVisible, toggleFormVisible] = useToggle(false)
  const [innerValue, setInnerValue] = useState<string>(mathEle.content)
  const { t } = useTranslation()
  const instance = useEditorInstance()
  useEffect(() => {
    instance.blockOps?.setBlockFuncs(element.id, {
      openMathForm: () => toggleFormVisible(true)
    })
    return () => {
      instance.blockOps?.removeBlockFuncs(element.id)
    }
  }, [])
  useLayoutEffect(() => {
    const container = renderContainerRef.current
    if (container) {
      katex.render(innerValue || '', container, {
        displayMode: false,
        throwOnError: false,
        output: 'html'
      })
    }
  }, [innerValue])
  useEffect(() => {
    setInnerValue(mathEle.content)
  }, [mathEle.content, formVisible])
  return (
    <span {...attributes} contentEditable={'false'}>
      {children}
      <AnimatePopover
        visible={formVisible}
        positions={['bottom', 'top']}
        onVisiblityChange={v => toggleFormVisible(v)}
        onClickOutside={toggleFormVisible}
        withClickCover={true}
        content={
          <WithBorder style={{ width: 400 }}>
            <MathInput
              isInline
              onComplete={v => {
                const p = ReactEditor.findPath(editor, mathEle)
                Transforms.setNodes(
                  editor,
                  {
                    content: v
                  },
                  {
                    at: p
                  }
                )
                toggleFormVisible(false)
              }}
              defaultValue={innerValue}
              onChange={v => setInnerValue(v)}
            />
          </WithBorder>
        }
      >
        {innerValue ? (
          <div
            className={'button'}
            style={{
              display: 'inline-block',
              lineHeight: 1,
              borderRadius: '0.25em',
              padding: '0px 0.25em',
              userSelect: 'auto'
            }}
            onClick={toggleFormVisible}
          >
            <div ref={renderContainerRef}></div>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-block',
              margin: '0px 0.2em',
              verticalAlign: 'top',
              borderRadius: '0.25em'
            }}
            className={'rounded bg-third'}
            onClick={toggleFormVisible}
          >
            <div
              className={'transparent-font button'}
              style={{
                fontSize: '0.75em',
                userSelect: 'auto',
                lineHeight: 1,
                padding: '0.5em',
                borderRadius: '0.25em'
              }}
            >
              {t('editor.New equation')}
            </div>
          </div>
        )}
      </AnimatePopover>
    </span>
  )
})

export default MathElement
