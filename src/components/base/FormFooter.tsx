import classnames from 'classnames'
import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default ({
  className = 'p-3',
  left,
  confirmText,
  onCancel,
  onConfirm,
  canConfirm = true
}: {
  className?: string
  left?: ReactElement
  confirmText?: string
  onCancel?: VoidFunction
  canConfirm?: boolean
  onConfirm?: VoidFunction
}) => {
  const { t } = useTranslation()
  return (
    <div className={classnames(className, 'flex justify-between items-center')}>
      <div>{left}</div>
      <div className={'flex gap-3 font-medium'}>
        <div className={'!px-4 !py-1.5 transparent-font button'} onClick={onCancel}>
          {t('general.Cancel')}
        </div>
        <div
          className={classnames('!px-4 !py-1.5 button reverse-theme-button', !canConfirm && '!cursor-not-allowed opacity-50')}
          onClick={onConfirm}
        >
          {confirmText || t('general.Confirm')}
        </div>
      </div>
    </div>
  )
}
