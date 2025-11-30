import { RenderElementProps } from 'slate-react'
import { ReactEditor, useSlate } from '@/core'
import { Editor, Node, Transforms } from 'slate'
import { memo, useContext, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { useClickOutside, useMergedRef } from '@/hooks'
import { AnimatePopover, Button, Icon, WithBorder } from '@/components'
import { Icons, KEY } from '../consts'
import { SelectElement } from '~/typings'
import { Id } from '../utils'
import produce from 'immer'
import isHotkey from 'is-hotkey'
import { ClozeModeContext } from '@/core/components/exam/questions/ExamClozeQuestion'
import { NoResult } from '@/core/components'
import { useTranslation } from 'react-i18next'

export default memo(({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlate()
  const selectEle = element as SelectElement
  const [isSelected, setIsSelected] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const mergedRef = useMergedRef(containerRef, attributes.ref)
  const mode = useContext(ClozeModeContext)
  const { t } = useTranslation()
  useClickOutside(
    () => {
      setIsSelected(false)
    },
    containerRef,
    isSelected
  )
  const text = useMemo(() => {
    let displayText = ''
    if (mode === 'edit') {
      displayText = selectEle.content.find(i => i.answer)?.name || t('exam.Please select')
    } else if (mode === 'test') {
      displayText = selectEle.content.find(i => i.value)?.name || t('exam.Please select')
    } else {
      displayText = t('exam.Please select')
    }
    return displayText
  }, [selectEle.content, mode])
  return (
    <span
      {...attributes}
      ref={mergedRef}
      contentEditable={false}
      className={classnames(
        'relative em:rounded em:mb-1 select-none em:mx-2 w-fit items-center inline-flex flex-col',
        isSelected && 'select-color-box-shadow'
      )}
    >
      {!isSelected && mode === 'edit' && (
        <div className={'inset-0 z-10 absolute cursor-pointer'} onClick={() => setTimeout(() => setIsSelected(true))}></div>
      )}
      <AnimatePopover
        positions={['bottom', 'top']}
        padding={6}
        withClickCover
        content={setV => (
          <WithBorder
            onFocus={e => e.stopPropagation()}
            onBlur={e => e.stopPropagation()}
            className={classnames('px-1', mode === 'edit' ? 'popover-menu' : 'popover-menu-small')}
          >
            <div className={'menu-sub-title pl-2'}>{mode === 'edit' && '编辑选项'}</div>
            {selectEle.content.map((i, idx) => (
              <div
                onClick={() => {
                  if (mode === 'test') {
                    setV(false)
                    const path = ReactEditor.findPath(editor, element)
                    Transforms.setNodes(
                      editor,
                      {
                        ...selectEle,
                        content: produce(selectEle.content, draft => {
                          draft.forEach(o => {
                            if (o.id === i.id) {
                              o.value = !o.value
                            } else {
                              o.value = undefined
                            }
                          })
                        })
                      } as SelectElement,
                      { at: path }
                    )
                  }
                }}
                className={'button flex group items-center gap-3'}
                key={i.id}
              >
                {mode === 'edit' && (
                  <input
                    checked={!!i.answer}
                    type={'radio'}
                    className={'cursor-pointer'}
                    onChange={e => {
                      const path = ReactEditor.findPath(editor, element)
                      Transforms.setNodes(
                        editor,
                        {
                          ...selectEle,
                          content: produce(selectEle.content, draft => {
                            draft.forEach(o => {
                              console.log(o.answer)
                              if (o.id === i.id) {
                                o.answer = !o.answer
                              } else {
                                o.answer = undefined
                              }
                            })
                          })
                        } as SelectElement,
                        { at: path }
                      )
                    }}
                  />
                )}
                {mode === 'edit' ? (
                  <input
                    onKeyDown={e => {
                      if (isHotkey(KEY.Enter, e)) {
                        const parent = e.currentTarget.parentElement
                        const path = ReactEditor.findPath(editor, element)
                        Transforms.setNodes(
                          editor,
                          {
                            ...selectEle,
                            content: produce(selectEle.content, draft => {
                              draft.splice(idx + 1, 0, {
                                id: Id.getId(),
                                name: ''
                              })
                            })
                          } as SelectElement,
                          { at: path }
                        )
                        setTimeout(() => {
                          const next = parent?.nextElementSibling?.querySelectorAll('input').item(1)
                          if (next) {
                            next.focus()
                          }
                        }, 50)
                      }
                    }}
                    onChange={e => {
                      const path = ReactEditor.findPath(editor, element)
                      Transforms.setNodes(
                        editor,
                        {
                          ...selectEle,
                          content: produce(selectEle.content, draft => {
                            draft[idx].name = e.target.value
                          })
                        } as SelectElement,
                        { at: path }
                      )
                    }}
                    value={i.name}
                    className={mode !== 'edit' ? 'cursor-pointer' : undefined}
                    disabled={mode !== 'edit'}
                  />
                ) : (
                  <div>{i.name}</div>
                )}
                {mode === 'edit' && (
                  <div className={'opacity-0 group-hover:opacity-100 transition-opacity'}>
                    <Icon
                      onClick={() => {
                        const path = ReactEditor.findPath(editor, element)
                        Transforms.setNodes(
                          editor,
                          {
                            ...selectEle,
                            content: produce(selectEle.content, draft => {
                              draft.splice(idx, 1)
                            })
                          } as SelectElement,
                          { at: path }
                        )
                      }}
                      name={Icons.Delete}
                      className={'hover-active-button'}
                    />
                  </div>
                )}
              </div>
            ))}
            {mode !== 'edit' && selectEle.content.length === 0 && <NoResult className={'py-16 font-size-12'} />}
            {mode === 'edit' && (
              <Button.IconButton
                onClick={() => {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(
                    editor,
                    {
                      ...selectEle,
                      content: [
                        ...selectEle.content,
                        {
                          id: Id.getId(),
                          name: ''
                        }
                      ]
                    } as SelectElement,
                    { at: path }
                  )
                }}
                icon={Icons.Create}
                text={t('exam.Add option')}
              />
            )}
          </WithBorder>
        )}
      >
        <div
          onClickCapture={e => {
            if (mode === 'history') {
              e.stopPropagation()
            }
          }}
          style={{
            fontSize: '0.86em'
          }}
          className={'em:rounded-md cursor-pointer flex items-center em:gap-3 border em:pl-3 em:pr-2 em:py-1'}
        >
          {text}
          <Icon strokeWidth={4} name={'park-down'} />
        </div>
      </AnimatePopover>
      {children}
    </span>
  )
})
