import { AutosizeTextarea } from '@/components'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'
import useExamState from '@/core/components/exam/useExamState'

export default memo(
  ({
    name,
    onChange,
    onHistoryCommentChange
  }: {
    name?: string
    onChange: (v: string) => void
    onHistoryCommentChange: (id: number, comment: string) => void
  }) => {
    const { t } = useTranslation()
    const [{ mode, currentHistory }] = useExamState()
    if (currentHistory && mode === 'history') {
      return (
        <div className={'w-full mb-6 pb-6 border-bottom'}>
          <div className={'flex w-full justify-between px-5 items-start'}>
            <div>
              <div className={'small-transparent'}>
                考试时间<span className={'ml-3'}>{DateFormat.format(currentHistory.time, DateFormat.Formats.withMinute)}</span>
              </div>
              <AutosizeTextarea
                disabled
                className={'font-bold text-3xl w-full'}
                onChange={onChange}
                value={name}
                placeholderColor={'primary'}
                placeholder={t('general.Untitled')}
              />
            </div>
          </div>
          <div className={'font-medium pl-5 mt-6'}>评语</div>
          <AutosizeTextarea
            className={'px-5 mt-1'}
            style={{
              minHeight: '3lh'
            }}
            placeholder={'添加评语'}
            value={currentHistory.comment || ''}
            onChange={v => {
              onHistoryCommentChange(currentHistory.id, v)
            }}
          />
        </div>
      )
    }
    return (
      <AutosizeTextarea
        disabled={mode !== 'edit'}
        className={'font-bold w-full mb-6 pl-5'}
        style={{
          fontSize: '2.2em',
          lineHeight: 1.4
        }}
        onChange={onChange}
        value={name}
        placeholderColor={'primary'}
        placeholder={t('general.Untitled')}
      />
    )
  }
)
