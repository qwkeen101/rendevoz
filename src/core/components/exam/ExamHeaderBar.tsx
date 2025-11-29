import { memo } from 'react'
import { Icon } from '@/components'
import useExamState from '@/core/components/exam/useExamState'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import classnames from 'classnames'

export default memo(({ name, switcherMode }: { name?: string; switcherMode?: boolean }) => {
  const [{ mode }, setState] = useExamState()
  const { t } = useTranslation()
  if (switcherMode) {
    return (
      <div className={'w-full flex py-2 justify-center'}>
        <ModeSwitcher
          showHistory
          onChange={v => {
            setState(s => ({
              ...s,
              mode: v,
              currentViewingQuestionWithHistory: undefined,
              currentHistory: undefined,
              historyVisible: v === 'history'
            }))
          }}
          mode={mode}
        />
      </div>
    )
  }
  return (
    <div
      style={{
        height: 44,
        padding: '0 10px'
      }}
      className={'flex shrink-0 items-center justify-between'}
    >
      <div className={'pl-1'}>{name || t(trans.Untitled)}</div>
      <div className={'flex items-center gap-2'}>
        <ModeSwitcher
          onChange={v => {
            setState(s => ({ ...s, mode: v, currentViewingQuestionWithHistory: undefined, currentHistory: undefined }))
          }}
          mode={mode}
        />
        <Icon
          name={'custom-right-bar'}
          onClick={() => {
            setState(s => ({ ...s, historyVisible: !s.historyVisible }))
          }}
          size={18}
          className={'square-button !px-2'}
        />
      </div>
    </div>
  )
})

const ModeSwitcher = ({
  onChange,
  mode,
  showHistory
}: {
  onChange: (mode: 'edit' | 'test' | 'history') => void
  mode: 'edit' | 'test' | 'history'
  showHistory?: boolean
}) => {
  const { t } = useTranslation()
  return (
    <div className={'flex shrink-0 rounded-full font-size-12 transparent-font font-semibold'}>
      {showHistory ? null : (
        <div
          onClick={() => onChange('edit')}
          className={classnames('button !px-3 !py-1 !rounded-3xl', mode === 'edit' && 'bg-hover primary-font')}
        >
          {t('exam.Edit mode')}
        </div>
      )}
      <div onClick={() => onChange('test')} className={classnames('button !px-3 !py-1 !rounded-3xl', mode === 'test' && 'active-button')}>
        {t('exam.Exam mode')}
      </div>
      {showHistory && (
        <div
          onClick={() => onChange('history')}
          className={classnames('button !px-3 !py-1 !rounded-3xl', mode === 'history' && 'active-button')}
        >
          {t(trans.History)}
        </div>
      )}
    </div>
  )
}
