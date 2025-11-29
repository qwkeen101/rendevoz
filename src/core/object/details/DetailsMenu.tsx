import { Menu, WithBorder } from '@/components'
import { MetaStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import calculateContains from '@/core/object/objectList/calculateContains'
import { useTranslation } from 'react-i18next'
import { Icons } from '@/consts'
import trans from '@/consts/trans'

export default ({ id, onClose }: { id: number; onClose: VoidFunction }) => {
  const [showContains, setShowContains] = useState(false)
  const { t } = useTranslation()
  useEffect(() => {
    if (Global.metaOps?.canViewContains(id)) {
      const m = MetaStore.getCachedMetaObject(id)
      if (m && !m.deleted) {
        calculateContains(m).then(res => {
          if (res?.length) {
            setShowContains(true)
            return
          }
          setShowContains(false)
        })
        return
      }
      setShowContains(false)
      return
    }
    setShowContains(false)
  }, [id])
  return (
    <WithBorder className={'pt-1 pb-1.5 min-w-52'}>
      <Menu.NavigationMenu
        layout={[
          {
            text: t(trans.Edit),
            type: 'item',
            icon: Icons.Edit,
            key: 'edit',
            onSelect: () => {
              onClose?.()
              Global.metaOps?.closeDetails()
              setTimeout(() => {
                Global.metaOps?.edit(id)
              }, 200)
            }
          },
          {
            text: t(trans.Meta.MoveTo),
            type: 'item',
            icon: Icons.MoveTo,
            key: 'move-to',
            onSelect: () => {
              onClose?.()
              setTimeout(() => Global.metaOps?.quickAdd(id), 200)
            }
          },
          {
            text: t('general.graph'),
            type: 'item',
            icon: 'park-share-one',
            key: 'graph',
            onSelect: () => {
              onClose?.()
              setTimeout(() => {
                Global.metaOps?.closeDetails()
                Global.metaOps?.openGraph(id)
              }, 200)
            }
          },
          showContains
            ? {
                icon: 'park-hamburger-button',
                text: t('general.View included objects'),
                type: 'item',
                key: 'show-contains',
                onSelect: () => {
                  onClose?.()
                  Global.metaOps?.viewContains(id)
                }
              }
            : undefined,
          {
            text: t(trans.Delete),
            type: 'item',
            icon: Icons.Delete,
            key: 'delete',
            onSelect: () => {
              Global.metaOps?.closeDetails()
              onClose?.()
              MetaStore.deleteMetaObject(id)
            }
          }
        ]}
      />
    </WithBorder>
  )
}
