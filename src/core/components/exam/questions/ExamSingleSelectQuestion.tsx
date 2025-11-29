import { IExamSingleSelectQuestion } from '~/typings'
import { memo } from 'react'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { ObjectStore } from '@/api/stores'
import produce from 'immer'
import classnames from 'classnames'
import { AutosizeTextarea, Button, Icon } from '@/components'
import { Id } from '@/utils'
import fileSystem from '@/api/fileSystem'
import { useExamMode } from '@/core/components/exam/useExamState'
import { useTranslation } from 'react-i18next'

export default memo(({ question, showAnswer }: { question: IExamSingleSelectQuestion; showAnswer?: boolean }) => {
  const { choices } = question
  const mode = useExamMode()
  const { t } = useTranslation()
  return (
    <div className={classnames('flex flex-col em:gap-2.5', mode !== 'edit' && 'select-none', mode === 'edit' && 'pr-6')}>
      {choices.map((i, idx) => {
        const isSelected = ((mode === 'edit' || showAnswer) && i.answer) || ((mode === 'test' || mode === 'history') && i.value)
        const historyAnswer = mode === 'history' && i.answer
        return (
          <div
            style={{
              '--color': !isSelected
                ? 'var(--border-solid)'
                : mode === 'history' && i.value !== i.answer
                  ? 'rgb(239 68 68)'
                  : (mode === 'test' || mode === 'history') && !showAnswer
                    ? 'var(--select-color)'
                    : 'rgb(34 197 94)',
              border: '1px solid var(--color)',
              fontWeight: historyAnswer ? 600 : undefined,
              background: isSelected ? 'rgba(from var(--color) r g b / 0.08)' : undefined
            }}
            className={
              'relative group/button cursor-pointer light-hover transition-colors flex items-start em:gap-3 em:rounded-3xl em:px-3 em:py-2'
            }
            onClick={() => {
              if (mode === 'test' && !showAnswer) {
                ObjectStore('examQuestion').updateOne({
                  id: question.id,
                  choices: produce(question.choices, draft => {
                    draft.forEach((i, index) => {
                      if (idx === index) return
                      i.value = undefined
                    })
                    draft[idx].value = !draft[idx].value
                  })
                })
              }
            }}
            key={i.id}
          >
            <div
              style={{
                width: '1.2em',
                height: '1.2em',
                border: '1px solid var(--color)'
              }}
              className={'rounded-full shrink-0 em:mt-1 text-white flex items-center justify-center'}
              onClick={() => {
                if (mode === 'edit') {
                  ObjectStore('examQuestion').updateOne({
                    id: question.id,
                    choices: produce(question.choices, draft => {
                      draft.forEach((i, index) => {
                        if (idx === index) return
                        i.answer = undefined
                      })
                      draft[idx].answer = !draft[idx].answer
                    })
                  })
                }
              }}
              onPointerDown={e => e.preventDefault()}
            >
              {isSelected && (
                <div
                  className={'rounded-full'}
                  style={{
                    width: '0.7em',
                    height: '0.7em',
                    background: 'var(--color)'
                  }}
                ></div>
              )}
            </div>
            <div className={'flex flex-col flex-1'}>
              {mode === 'edit' ? (
                <AutosizeTextarea
                  value={i.name}
                  className={classnames('flex-1', mode === 'edit' && 'cursor-text')}
                  placeholder={t('exam.Type option')}
                  onChange={e => {
                    ObjectStore('examQuestion').updateOne({
                      id: question.id,
                      choices: produce(choices, draft => {
                        draft[idx].name = e
                      })
                    })
                  }}
                  onKeyDown={e => {
                    if (isHotkey(KEY.Enter, e)) {
                      e.preventDefault()
                      if (idx === choices.length - 1) {
                        ObjectStore('examQuestion').updateOne({
                          id: question.id,
                          choices: [
                            ...choices,
                            {
                              id: Id.getId(),
                              name: ''
                            }
                          ]
                        })
                      }
                      const parent = e.currentTarget.parentElement?.parentElement
                      setTimeout(() => {
                        const next = parent?.nextElementSibling
                        next?.querySelector('[contenteditable]')?.focus()
                      })
                    }
                  }}
                />
              ) : (
                <div className={'whitespace-pre-wrap'}>
                  {i.name}
                  {historyAnswer && <span className={'super-transparent-font em:ml-2'}>({t('exam.Correct answer')})</span>}
                </div>
              )}
              {i.image && (
                <div className={'relative w-fit em:mt-3 em:mb-1'}>
                  <img
                    onClick={() => Global.commonOps?.previewImage?.(i.image)}
                    className={'rounded-md em:size-64 object-contain bg-secondary'}
                    src={i.image}
                  />
                  {mode === 'edit' && (
                    <div
                      className={
                        'absolute bg-opacity-80 transition-colors hover:bg-opacity-50 p-1.5 rounded-md bottom-2 right-2 bg-neutral-900 text-white'
                      }
                      onClick={() => {
                        ObjectStore('examQuestion').updateOne({
                          id: question.id,
                          choices: produce(choices, draft => {
                            draft[idx].image = undefined
                          })
                        })
                      }}
                    >
                      <Icon size={15} name={Icons.Delete} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {!i.image && mode === 'edit' && (
              <div className={'opacity-0 mr-1 group-hover/button:opacity-100 transition-opacity'}>
                <Icon
                  onClick={() => {
                    Global.commonOps
                      ?.upload({
                        accept: 'image/*'
                      })
                      .then(i => {
                        if (i instanceof File) {
                          fileSystem.saveImage(i).then(res => {
                            ObjectStore('examQuestion').updateOne({
                              id: question.id,
                              choices: produce(question.choices, draft => {
                                draft[idx].image = res
                              })
                            })
                          })
                        }
                      })
                  }}
                  strokeWidth={4}
                  size={16}
                  style={{
                    marginTop: 2
                  }}
                  name={'park-picture'}
                  className={'hover-active-button'}
                />
              </div>
            )}
            {mode === 'edit' && (
              <div className={'opacity-0 absolute -right-3 translate-x-full group-hover/button:opacity-100 transition-opacity'}>
                <Icon
                  onClick={() => {
                    ObjectStore('examQuestion').updateOne({
                      id: question.id,
                      choices: produce(question.choices, draft => {
                        draft.splice(idx, 1)
                      })
                    })
                  }}
                  size={13}
                  strokeWidth={6}
                  name={Icons.Close}
                  className={'hover-active-button mt-1.5'}
                />
              </div>
            )}
          </div>
        )
      })}
      {mode === 'edit' && (
        <Button.IconButton
          onClick={() => {
            ObjectStore('examQuestion').updateOne({
              id: question.id,
              choices: [
                ...choices,
                {
                  id: Id.getId(),
                  name: ''
                }
              ]
            })
          }}
          text={t('exam.Add option')}
          className={'w-fit transparent-font'}
          smallText={false}
          icon={'park-add-one'}
        />
      )}
    </div>
  )
})
