import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { memo } from 'react'
import classnames from 'classnames'

export default memo(({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <div className={classnames('transparent-font w-full h-full flex items-center justify-center m-auto', className)}>
      {t(trans.EmptyCard)}
    </div>
  )
})
