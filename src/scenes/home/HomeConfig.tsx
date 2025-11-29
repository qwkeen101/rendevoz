import { Button } from '@/components'
import { useTranslation } from 'react-i18next'
import useHomeConfig from '@/scenes/home/useHomeConfig'

export default () => {
  const homeConfig = useHomeConfig()
  const { t } = useTranslation()
  const renderViewChanger = () => {
    return (
      <>
        <Button.IconButton
          enabled={homeConfig.mode === 'list'}
          onClick={() => {
            useHomeConfig.update(c => ({ ...c, mode: 'list' }))
          }}
          icon={'custom-list'}
          text={t('general.List view')}
        />
        <Button.IconButton
          enabled={homeConfig.mode === 'gallery'}
          onClick={() => {
            useHomeConfig.update(c => ({ ...c, mode: 'gallery' }))
          }}
          icon={'park-all-application'}
          text={t('general.Gallery view')}
        />
        <Button.IconButton
          enabled={homeConfig.showHidden}
          onClick={() => {
            useHomeConfig.update(c => ({ ...c, showHidden: !c.showHidden }))
          }}
          icon={'park-preview-open'}
          text={t('general.Show hidden objects')}
        />
      </>
    )
  }
  return (
    <>
      {renderViewChanger()}
    </>
  )
}
