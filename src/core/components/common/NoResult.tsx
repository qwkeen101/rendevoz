import trans from '@/consts/trans'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'

export default ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <div className={classnames('flex-1 h-full w-full flex items-center justify-center transparent-font font-semibold', className)}>
      {t(trans.NoResult)}
    </div>
  )
}
