import { Button } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'

export default ({ on }: { on: (type: 'chat' | 'copy' | 'delete') => void }) => {
  const { t } = useTranslation()
  return (
    <div className={'flex gap-3 mt-4 font-size-13 flex-wrap'}>
      {/*<Button.IconButton*/}
      {/*  className={'border-round-icon-button'}*/}
      {/*  text={t(trans.AI.ContinueWithChat)}*/}
      {/*  icon={'custom-stars'}*/}
      {/*  onClick={() => on?.('chat')}*/}
      {/*/>*/}
      <Button.IconButton className={'border-round-icon-button'} text={t(trans.Copy)} icon={Icons.Copy} onClick={() => on?.('copy')} />
      <Button.IconButton className={'border-round-icon-button'} text={t(trans.Delete)} icon={Icons.Delete} onClick={() => on?.('delete')} />
    </div>
  )
}
