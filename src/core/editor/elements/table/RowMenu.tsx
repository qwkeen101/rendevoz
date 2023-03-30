import { Content, IconButton, Switch, WithBorder } from '@/components/base'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'

const RowMenu = ({
  on,
  isHeader,
  showHeader
}: {
  on: (type: 'headerRow' | 'insertAbove' | 'insertBelow' | 'delete' | 'clearContent') => void
  isHeader: boolean
  showHeader: boolean
}) => {
  const { t } = useTranslation()
  const buttons: Parameters<typeof IconButton>[0][] = [
    {
      icon: 'park-left',
      onClick: () => on('insertBelow'),
      text: t('editor.insert row below')
    },
    {
      icon: 'park-right',
      onClick: () => on('insertAbove'),
      text: t('editor.insert row above')
    },
    {
      icon: 'park-close',
      onClick: () => on('clearContent'),
      text: t('editor.clear row content')
    },
    {
      icon: 'park-delete',
      onClick: () => on('delete'),
      text: t('general.delete'),
      dangerous: true
    }
  ]
  return (
    <WithBorder>
      {showHeader && (
        <Content flex gap={4} justifyContent="space-between" onClick={() => on('headerRow')} className={ClassName.flatButton()}>
          <div>{t('editor.header row')}</div>
          <Switch value={isHeader} />
        </Content>
      )}
      {buttons.map(i => (
        <IconButton {...i} key={i.icon} />
      ))}
    </WithBorder>
  )
}

export default RowMenu
