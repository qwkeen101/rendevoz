import { IExamDateQuestion } from '~/typings'
import { AnimatePopover, TimePicker, WithBorder } from '@/components'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ObjectStore } from '@/api/stores'
import { useExamMode } from '@/core/components/exam/useExamState'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
function isValidDate(dateString: string) {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) // getTime() 返回 NaN 表示无效日期
}

export default memo(({ question: { id, answer, value }, showAnswer }: { question: IExamDateQuestion; showAnswer?: boolean }) => {
  const mode = useExamMode()
  const v = useMemo(() => {
    if (mode === 'edit') {
      if (answer) {
        if (isValidDate(answer)) {
          return new Date(answer)
        }
      }
    }
    if (value) {
      if (isValidDate(value)) {
        return new Date(value)
      }
    }
    return undefined
  }, [answer, value, mode])
  const { t } = useTranslation()
  useEffect(() => {
    const currentV = inputRef.current?.value
    if (mode === 'edit') {
      if (currentV !== answer) {
        const ele = inputRef.current
        if (ele) {
          ele.value = answer ?? ''
        }
      }
    } else {
      if (currentV !== value) {
        const ele = inputRef.current
        if (ele) {
          ele.value = value ?? ''
        }
      }
    }
  }, [answer, value, mode])
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {mode !== 'history' && (
        <AnimatePopover
          align={'start'}
          visible={visible}
          innerRef={inputRef}
          onClickOutside={e => {
            if (e.target instanceof HTMLInputElement && e.target === inputRef.current) {
              return
            }
            setVisible(false)
          }}
          content={
            <WithBorder data-no-dnd>
              <TimePicker
                onChange={d => {
                  const value = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
                  if (mode === 'edit') {
                    ObjectStore('examQuestion').updateOne({
                      id,
                      answer: value
                    })
                  }
                  if (mode === 'test') {
                    ObjectStore('examQuestion').updateOne({
                      id,
                      value
                    })
                  }
                }}
                value={v}
              />
            </WithBorder>
          }
          positions={['top', 'bottom']}
        >
          <input
            onChange={e => {
              if (mode === 'edit') {
                ObjectStore('examQuestion').updateOne({ id, answer: e.target.value })
              }
              if (mode === 'test') {
                ObjectStore('examQuestion').updateOne({ id, value: e.target.value })
              }
            }}
            onFocus={() => {
              if (!showAnswer) {
                setVisible(true)
              }
            }}
            className={'exam-number-input'}
            placeholder={t('exam.Date input')}
            key={`${mode}_${showAnswer}`}
            defaultValue={mode === 'edit' || showAnswer ? answer : value}
          />
        </AnimatePopover>
      )}
      {mode === 'history' && (
        <div>
          <div className={'font-medium mb-2'}>您的回答</div>
          <div className={classnames('exam-history-item', value !== answer && 'text-red-500')}>{value}</div>
          <div className={'font-medium mb-2 mt-5'}>正确答案</div>
          <div className={'exam-history-item'}>{answer}</div>
        </div>
      )}
    </>
  )
})
