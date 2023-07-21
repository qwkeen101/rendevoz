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
        const normalized = mathEle.content
          .replaceAll(' ', '\\ ')
          .replaceAll('\n', '\\\\')
          .replace(/\{([^*]+)\}/g, str => `{\\displaylines${str}}`)
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
    <span {...attributes} className={MathClassName} style={{ margin: '0px 6px' }}>
      {children}
      <AnimatePopover
        visible={formVisible}
        positions={['bottom', 'top']}
        onClickOutside={toggleFormVisible}
        disableIntersection
        // disableNudge
        reposition={true}
        boundaryElement={document.body}
        innerRef={renderContainerRef}
        containerStyle={{
          zIndex: String(Zindexes.EditorSelectionToolbar)
        }}
        padding={10}
        content={
          <WithBorder padding={10} style={{ width: 400 }}>
            <BorderInput
              minRows={3}
              maxRows={10}
              placeholder={t('editor.input math formula')}
              defaultValue={mathEle.content}
              textarea
              autoFocus
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
          className={css({
            padding: '3px 8px',
            borderRadius: 4,
            transition: 'background 0.2s ease',
            ':hover': {
              cursor: 'pointer',
              background: `${Colors.Background.HighContrast} !important`
            }
          })}
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
