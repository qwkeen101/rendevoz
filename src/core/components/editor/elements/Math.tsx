import { css } from '@emotion/css'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import { useEffect, useRef } from 'react'
import { ElementFunction, ID_TO_ELEMENT_FUNCTION_MAP } from '../weakMaps'
import { useDebounceFn, useToggle } from '@/hooks'
import { AnimatePopover, WithBorder } from '@/components'
import BorderInput from '@/components/base/BorderInput'
import { Transforms } from 'slate'
import { CustomElement, MathElement as IMathElement } from '~/typings'
import { useMeasure } from 'react-use'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'
import { Zindexes } from '@/consts'
import { ClassName } from 'rendevoz'

const MathClassName = css({
  'mjx-container': {
    display: 'inline !important'
  }
})
const MathElement = ({ element, children, attributes }: RenderElementProps) => {
  const mathEle = element as IMathElement & CustomElement
  const editor = useSlateStatic()
  const renderContainerRef = useRef<HTMLSpanElement>(null)
  const [formVisible, toggleFormVisible] = useToggle(false)
  const { t } = useTranslation()
  const [ref, { width }] = useMeasure()

  useEffect(() => {
    ref(ReactEditor.toDOMNode(editor, editor))
    const map = ID_TO_ELEMENT_FUNCTION_MAP.get(editor) || new Map<number, ElementFunction>()
    map.set(element.id, {
      openMathForm: () => toggleFormVisible(true)
    })
    ID_TO_ELEMENT_FUNCTION_MAP.set(editor, map)
    return () => {
      map.delete(element.id)
    }
  }, [])
  const { run: renderMath } = useDebounceFn(
    () => {
      const renderContainer = renderContainerRef.current
      if (renderContainer && mathEle.content && width) {
        const normalized = mathEle.content.replaceAll(' ', '\\ ').replaceAll('\n', '\\\\')
        // .replace(/\{([^*]+)\}/g, str => `{\\displaylines${str}}`)
        MathJax.tex2svgPromise(`\\displaylines{${normalized}}`, { scale: 0.5 })
          .then(m => {
            const containerBounding = renderContainer.parentElement?.parentElement.getBoundingClientRect()
            renderContainer.replaceChildren(m)
            const bounding = m.getBoundingClientRect()
            if (bounding.width > containerBounding?.width) {
              const widthRatio = (containerBounding.width - 20) / bounding.width
              m.style.setProperty('font-size', `${widthRatio * 100}%`)
            }
          })
          .catch(e => {
            console.log(e)
          })
      } else {
        const node = renderContainer?.querySelector('mjx-container')
        node && renderContainer?.removeChild(node)
        renderContainer && (renderContainer.innerText = t('editor.input math formula'))
      }
    },
    { wait: 200 }
  )
  useEffect(() => {
    renderMath()
  }, [mathEle.content, Math.floor(width)])
  return (
    <span {...attributes} className={MathClassName}>
      {children}
      <AnimatePopover
        visible={formVisible}
        positions={['bottom', 'top']}
        onClickOutside={toggleFormVisible}
        reposition={true}
        boundaryElement={document.body}
        innerRef={renderContainerRef}
        containerStyle={{
          zIndex: String(Zindexes.EditorSelectionToolbar)
        }}
        padding={10}
        content={
          <WithBorder style={{ width: 400 }}>
            <BorderInput
              minRows={3}
              maxRows={10}
              placeholder={t('editor.input math formula')}
              defaultValue={mathEle.content}
              textarea
              autoFocus
              containerStyle={{
                border: 'transparent'
              }}
              onChange={e => {
                Transforms.setNodes(
                  editor,
                  {
                    content: e as string
                  },
                  {
                    at: ReactEditor.findPath(editor, element)
                  }
                )
              }}
            ></BorderInput>
          </WithBorder>
        }
      >
        <div
          className={ClassName.flatButton(4, '2px 4px')}
          style={{
            display: 'inline-block',
            background: !mathEle.content?.length ? Colors.Background.ButtonHover : undefined
          }}
          onClick={toggleFormVisible}
        ></div>
      </AnimatePopover>
    </span>
  )
}

export default MathElement
