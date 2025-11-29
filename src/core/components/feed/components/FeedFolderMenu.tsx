import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { Trans } from '@/consts'
import RSSIcon from './RSSIcon'

export default ({ id, onClose }: { id: number; onClose: VoidFunction }) => {
  const instance = useFeedInstance()
  const { t } = useTranslation()
  return (
    <WithBorder className={'py-1'} onClick={e => e.stopPropagation()}>
      <Menu.NavigationMenu
        layout={[
          {
            type: 'item',
            text: t('general.edit'),
            key: 'edit',
            icon: 'park-edit',
            onSelect: () => {
              instance.folderOps?.edit(id)
              onClose()
            }
          },
          {
            type: 'item',
            text: t(Trans.Feed.ImportRSS),
            key: 'import',
            icon: <RSSIcon />,
            onSelect: () => {
              instance.importRSS?.(id)
              onClose()
            }
          },
          {
            type: 'item',
            key: 'delete',
            text: t('general.delete'),
            icon: 'park-delete-one',
            onSelect: () => {
              instance.folderOps?.delete(id)
              onClose()
            }
          }
        ]}
      />
    </WithBorder>
  )
}
