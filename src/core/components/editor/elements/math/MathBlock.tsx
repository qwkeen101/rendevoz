import { ReactEditor, RenderElementProps, useSlateStatic } from '@/core'
import { MathBlockElement } from '~/typings'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import MathInput from '@/core/components/editor/elements/math/MathInput'
import { Transforms } from 'slate'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useTranslation } from 'react-i18next'
export default memo(({ children, element }: RenderElementProps) => {
  const mathBlock = element as MathBlockElement
  const editor = useSlateStatic()
  const [innerValue, setInnerValue] = useState<string>(mathBlock.content)
  const renderContainerRef = useRef<HTMLDivElement>()
  const [inputVisible, setInputVisible] = useState(false)
  const instance = useEditorInstance()
  const { t } = useTranslation()
  const handleChange = (v: string) => {
    setInnerValue(v)
  }
  const handleComplete = (v: string) => {
    const p = ReactEditor.findPath(editor, mathBlock)
    Transforms.setNodes(
      editor,
      {
        content: v
      },
      {
        at: p
      }
    )
    setInputVisible(false)
  }
  useLayoutEffect(() => {
    const content = innerValue
    const renderContainer = renderContainerRef.current
    if (renderContainer) {
      katex.render(String.raw`${content || ''}`, renderContainer, {
        displayMode: true,
        output: 'html',
        throwOnError: false
      })
    }
  }, [innerValue])
  useEffect(() => {
    setInnerValue(mathBlock.content)
  }, [mathBlock.content, inputVisible])
  useEffect(() => {
    instance.blockOps?.setBlockFuncs(element.id, {
      openMathForm: () => setInputVisible(true)
    })
  }, [])
  return (
    <Content
      contentEditable={'false'}
      style={{
        width: '100%',
        fontSize: 14,
        userSelect: 'none',
        background: innerValue ? 'transparent' : Colors.Background.Secondary
      }}
    >
      {children}
      <AnimatePopover
        visible={inputVisible}
        withClickCover={true}
        onClickOutside={() => setInputVisible(false)}
        onVisiblityChange={v => setInputVisible(v)}
        positions={['bottom', 'top']}
        content={
          <WithBorder width={400}>
            <MathInput
              onChange={e => {
                handleChange(e)
              }}
              onComplete={v => {
                handleComplete(v)
              }}
              defaultValue={innerValue}
              isInline={false}
            />
          </WithBorder>
        }
      >
        {innerValue ? (
          <div style={{ width: '100%' }}>
            <div
              onClick={() => setInputVisible(true)}
              className={ClassName.flatButton()}
              style={{ width: '100%', overflow: 'hidden', font: 'normal 1.21em KaTeX_Main,Times New Roman,serif' }}
              ref={renderContainerRef}
            ></div>
          </div>
        ) : (
          <Content
            onClick={() => setInputVisible(true)}
            flex
            alignItems={'center'}
            gap={12}
            className={ClassName.flatButton()}
            style={{
              color: Colors.Font.Transparent,
              padding: '12px 36px 12px 12px',
              width: '100%'
            }}
          >
            <Icon size={20} name={'custom-equation'} />
            {t('editor.Add a TeX equation')}
          </Content>
        )}
      </AnimatePopover>
    </Content>
  )
})
