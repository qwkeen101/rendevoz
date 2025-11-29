import { AnimatePopover, Button, CheckBox, Icon, Menu, WithBorder } from '@/components'
import trans from '@/consts/trans'
import { Resizable } from 're-resizable'
import { useTranslation } from 'react-i18next'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { memo } from 'react'
import { Icons } from '@/consts'

export default memo(() => {
  const { listSort, gallerySort, mode, listColSize } = useHomeConfig()
  const { t } = useTranslation()
  const updateSortmode = (s: typeof listSort) => {
    if (s === 'nameAsc' || s === 'nameDsc') {
      useHomeConfig.update(c => ({ ...c, listSort: s, gallerySort: s }))
      return
    }
    if (mode === 'list') {
      useHomeConfig.update(c => ({ ...c, listSort: s }))
    } else {
      useHomeConfig.update(c => ({ ...c, gallerySort: s }))
    }
  }
  const currentSort = (mode === 'list' ? listSort : gallerySort) ?? 'nameDsc'

  if (mode === 'list') {
    return (
      <div
        style={{
          zIndex: 10,
          marginBottom: 4
        }}
        className={'flex items-center transparent-font font-size-13'}
      >
        <Button.IconButton
          spaceBetween
          reverse
          style={{ flex: 1, whiteSpace: 'nowrap' }}
          text={t(trans.Name)}
          onClick={() => {
            updateSortmode(currentSort === 'nameDsc' ? 'nameAsc' : 'nameDsc')
          }}
          icon={currentSort === 'nameDsc' ? 'park-down' : currentSort === 'nameAsc' ? 'park-up' : undefined}
        ></Button.IconButton>

        <Resizable
          defaultSize={{
            width: listColSize?.view ?? 180,
            height: '100%'
          }}
          maxWidth={300}
          minWidth={100}
          enable={{ left: true }}
          onResize={(event, direction, elementRef) => {
            useHomeConfig.update(c => ({ ...c, listColSize: { ...c.listColSize, view: elementRef.clientWidth } }))
          }}
        >
          <Button.IconButton
            spaceBetween
            reverse
            style={{ flex: 1, whiteSpace: 'nowrap' }}
            text={t('general.view at')}
            onClick={() => {
              updateSortmode(currentSort === 'viewDesc' ? 'viewAsc' : 'viewDesc')
            }}
            icon={currentSort === 'viewDesc' ? 'park-down' : currentSort === 'viewAsc' ? 'park-up' : undefined}
          ></Button.IconButton>
        </Resizable>
        <Resizable
          defaultSize={{
            width: listColSize?.create ?? 180,
            height: '100%'
          }}
          maxWidth={300}
          onResize={(event, direction, elementRef) => {
            useHomeConfig.update(c => ({ ...c, listColSize: { ...c.listColSize, create: elementRef.clientWidth } }))
          }}
          minWidth={100}
          enable={{ left: true }}
        >
          <Button.IconButton
            spaceBetween
            style={{ flex: 1, whiteSpace: 'nowrap' }}
            reverse
            text={t('general.create at')}
            onClick={() => {
              updateSortmode(currentSort === 'createDesc' ? 'createAsc' : 'createDesc')
            }}
            icon={currentSort === 'createDesc' ? 'park-down' : currentSort === 'createAsc' ? 'park-up' : undefined}
          ></Button.IconButton>
        </Resizable>
        <Icon
          className={'square-button ml-auto size-8'}
          onClick={() => {
            useHomeConfig.update(c => ({ ...c, mode: 'gallery' }))
          }}
          size={16}
          name={'custom-list'}
        />
      </div>
    )
  } else {
    const sortToTrans = {
      nameAsc: `${t(trans.Name)} A-Z`,
      nameDsc: `${t(trans.Name)} Z-A`,
      createDsc: t(trans.RecentlyCreated),
      viewDsc: t(trans.RecentlyViewed)
    }
    return (
      <div
        style={{
          zIndex: 10,
          marginBottom: 8
        }}
        className={'flex items-center transparent-font font-size-13'}
      >
        <AnimatePopover
          align={'start'}
          positions={['bottom']}
          content={setVisible => (
            <WithBorder className={'popover-menu-mid'}>
              <Menu.NavigationMenu
                onSelect={v => {
                  setVisible(false)
                  useHomeConfig.update(c => ({ ...c, gallerySort: v.key }))
                }}
                layout={[
                  {
                    type: 'title',
                    name: t('general.Sort by')
                  },
                  {
                    type: 'item',
                    key: 'nameAsc',
                    text: sortToTrans['nameAsc']
                  },
                  {
                    type: 'item',
                    key: 'nameDsc',
                    text: sortToTrans['nameDsc']
                  },
                  {
                    type: 'item',
                    key: 'createDsc',
                    text: sortToTrans['createDsc']
                  },
                  {
                    type: 'item',
                    key: 'viewDsc',
                    text: sortToTrans['viewDsc']
                  }
                ]}
              />
            </WithBorder>
          )}
        >
          <Button.IconButton
            spaceBetween
            reverse
            style={{ flex: '0 0 200px', whiteSpace: 'nowrap' }}
            text={sortToTrans[gallerySort || 'nameAsc']}
            icon={'park-down'}
          ></Button.IconButton>
        </AnimatePopover>
        <Icon
          className={'square-button ml-auto size-8'}
          onClick={() => {
            useHomeConfig.update(c => ({ ...c, mode: 'list' }))
          }}
          size={16}
          name={Icons.ApplicationAll}
        />
      </div>
    )
  }
})
