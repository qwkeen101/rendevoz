import { WithBorder, Menu } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import { ObjectStore } from '@/api/stores'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'

export default ({ id, onClose }: { id: number; onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const instance = useYoutubeInstance()
  return (
    <WithBorder className={'py-1 min-w-48'} onClick={e => e.stopPropagation()}>
      <Menu.NavigationMenu
        layout={[
          {
            type: 'item',
            key: 'edit',
            text: t(trans.Edit),
            icon: Icons.Edit,
            onSelect: async () => {
              onClose?.()
              const folder = await ObjectStore('youtubeFolder').getOneById(id)
              if (folder) {
                instance.createFolder?.(folder)
              }
            }
          },
          {
            type: 'item',
            key: 'delete',
            text: t(trans.Delete),
            icon: Icons.Delete,
            onSelect: async () => {
              onClose?.()
              await ObjectStore('youtubeFolder').deleteOneById(id)
            }
          }
        ]}
      ></Menu.NavigationMenu>
    </WithBorder>
  )
}
