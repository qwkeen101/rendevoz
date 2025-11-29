import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'

export default ({ id, onClose }: { id: number; onClose: VoidFunction }) => {
  const instance = usePodcastInstance()
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
