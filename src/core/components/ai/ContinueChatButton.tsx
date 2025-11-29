import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Button } from '@/components'
import classnames from 'classnames'

export default ({ onClick, className }: { onClick: VoidFunction; className?: string }) => {
  const { t } = useTranslation()
  return (
    <Button.IconButton
      icon={'custom-stars'}
      text={t(trans.AI.ContinueWithChat)}
      className={classnames('border-round-icon-button max-w-64 !pr-4 w-full justify-center', className)}
      onClick={onClick}
    ></Button.IconButton>
  )
}
