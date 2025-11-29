import { Icon } from '@/components'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import classnames from 'classnames'
import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

export default ({
  onSubmit,
  value,
  onChange,
  className,
  extra,
  searchElement
}: {
  onSubmit?: VoidFunction
  value: string
  onChange: (s: string) => void
  className?: string
  searchElement?: ReactElement
  extra?: ReactElement
}) => {
  const { t } = useTranslation()
  return (
    <div className={classnames('flex gap-3 w-full', className)}>
      <input
        onKeyDown={e => {
          if (isHotkey(KEY.Enter, e)) {
            onSubmit?.()
          }
        }}
        value={value}
        placeholder={t('feed.Search news')}
        onChange={e => onChange(e.target.value)}
        className={'focus-input grow border-box-shadow h-10 px-3 py-2 rounded-md'}
      />
      {extra}
      {searchElement ?? (
        <div
          onClick={() => {
            onSubmit?.()
          }}
          className={'reverse-theme-button ml-2 shadow cursor-pointer h-10 pr-5 pl-4 gap-2 py-2 flex items-center'}
        >
          <Icon name={'park-search'} />
          <span>{t('general.Search')}</span>
        </div>
      )}
    </div>
  )
}
