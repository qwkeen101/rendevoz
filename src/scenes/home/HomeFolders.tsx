import { CollectionStore } from '@/api/stores'
import { ICollection } from '~/typings'
import { memo } from 'react'
import folder from '@/assets/images/folder.png'
import { Button, Icon, WithBorder } from '@/components'
import ContextMenu from '@/components/contextMenu'
import { Icons } from '@/consts'
import CollectionMenu from '@/core/components/collection/CollectionMenu'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { useTranslation } from 'react-i18next'
export default memo(({ items }: { items: ICollection[] }) => {
  const { t } = useTranslation()
  return (
    <div className={'pl-2'}>
      <div className={'flex items-center gap-5 mb-4'}>
        <div className={'text-lg'}>全部文件夹</div>
      </div>
      <div style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))' }} className={'grid gap-4'}>
        {items.map(i => (
          <ContextMenu
            content={setV => (
              <WithBorder className={'popover-menu'}>
                <CollectionMenu id={i.id} onClose={() => setV(false)} />
              </WithBorder>
            )}
          >
            {setV => (
              <div
                onClick={() => {
                  useHomeConfig.update(s => ({
                    ...s,
                    breadcrumbs: [...(s.breadcrumbs || []), i.id],
                    breadcrumbsFutureStack: []
                  }))
                }}
                style={{
                  padding: '16px'
                }}
                className={'border cursor-pointer light-hover transition-colors rounded-lg flex items-center gap-3'}
                key={i.id}
              >
                <img className={'size-7'} src={folder} />
                <div className={'line-clamp-1'}>{i.name}</div>
                <Icon
                  onClick={e => {
                    e.stopPropagation()
                    setV(true, [e.clientX, e.clientY])
                  }}
                  size={20}
                  className={'hover-active-button ml-auto'}
                  name={Icons.More}
                ></Icon>
              </div>
            )}
          </ContextMenu>
        ))}
      </div>
    </div>
  )
})
