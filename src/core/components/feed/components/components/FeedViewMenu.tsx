import { useTranslation } from 'react-i18next'
import { Button, WithBorder } from '@/components'
import useFeedData from '@/core/components/feed/hooks/useFeedData'

const viewToTranslate = {
  magazine: 'general.Magazine view',
  card: 'general.Card view',
  title: 'general.Title view'
}

const openToTranslate = {
  rightBar: 'general.Right bar',
  center: 'general.Center',
  sidePeek: 'general.Side peek',
  newPage: 'general.New page'
}

export default ({ onClose }: { onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const feedData = useFeedData()
  const { cardView, openMode } = feedData
  return (
    <WithBorder className={'px-1 py-1.5 min-w-48'}>
      <div className={'menu-sub-title pl-2 pb-1'}>{t('general.View')}</div>
      {Object.keys(viewToTranslate).map(k => (
        <Button.IconButton
          key={k}
          enabled={k === cardView}
          onClick={() => {
            useFeedData.updateData(c => ({ ...c, cardView: k }))
            onClose?.()
          }}
          text={t(viewToTranslate[k])}
        ></Button.IconButton>
      ))}
    </WithBorder>
  )
}
