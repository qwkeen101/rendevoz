import { MetaStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { Content, Icon } from '@/components'
import GalleryItem from '@/scenes/home/GalleryItem'
import { useMeasure } from 'react-use'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import { isEqual } from 'lodash'
import useHomeConfig from '@/scenes/home/useHomeConfig'

const HomeGallery = () => {
  const objectIndex = MetaStore.useIndexedMetaObjects()
  const config = useHomeConfig().gallery
  useEffect(() => {
    if (objectIndex) {
      const visibleTypes = new Set(MetaStore.getVisibleMetaTypes(false, false))
      if (visibleTypes) {
        const allTypes = visibleTypes
        let newVisibleList = config.items.filter(i => {
          if (['recentlyViewed', 'recentlyCreated', 'pinned'].includes(i.name)) return true
          if (!allTypes.has(i.name)) {
            return false
          }
          if (allTypes.has(i.name)) {
            allTypes.delete(i.name)
            return true
          }
        })
        newVisibleList = newVisibleList.concat(Array.from(allTypes.values()).map(i => ({ visible: true, name: i })))
        if (!isEqual(config.items, newVisibleList)) {
          useHomeConfig.update(c => ({ ...c, gallery: { ...c.gallery, items: newVisibleList } }))
        }
      }
    }
  }, [objectIndex])

  const [ref, { width }] = useMeasure()

  const count = Math.floor((width - 16) / 240)
  return (
    <Content ref={ref} fullWidth column flex gap={30} style={{ paddingBottom: 100 }}>
      {config.items.map(i => i.visible && <GalleryPanel key={i.name} count={count} panelName={i.name} />)}
    </Content>
  )
}

const GalleryPanel = ({ panelName, count }: { panelName: string; count: number }) => {
  const [displayMetaIds, setDisplayMetaIds] = useState<number[]>([])
  const allObjects = MetaStore.useMetaObjectsMap()
  const index = MetaStore.useIndexedMetaObjects()
  const { t } = useTranslation()
  const rows = useHomeConfig().gallery.rowsPerItem
  const [pag, setPag] = useState<{
    start: number
  }>({
    start: 0
  })
  const pagable = displayMetaIds.length > count * rows
  const hasBefore = pag.start > 0
  const hasNext = displayMetaIds.length > count * rows + pag.start
  useEffect(() => {
    const map = MetaStore.getMetaObjectsMap()
    if (panelName === 'pinned') {
      setDisplayMetaIds(
        Array.from(index?.pinnedMetaObjectsSet?.values() || [])
          .filter(i => MetaStore.isVisibleMetaObject(i))
          .map(i => i.id)
      )
      return
    }
    if (panelName === 'recentlyViewed') {
      const viewed = MetaStore.getMetaObjects('view')
      setDisplayMetaIds(viewed.filter(i => MetaStore.isVisibleMetaObject(i)).map(i => i.id))
      return
    }
    if (panelName === 'recentlyCreated') {
      const created = MetaStore.getMetaObjects('create')
      setDisplayMetaIds(created.filter(i => MetaStore.isVisibleMetaObject(i)).map(i => i.id))
      return
    }
    const objects = Array.from(index?.typeToMetaObjectIdsMap?.get(panelName)?.values() || []).filter(
      i => map.has(i) && MetaStore.isVisibleMetaObject(map.get(i))
    ) as number[]
    objects.sort((b, a) => map.get(a)!.createdAt - map.get(b)!.createdAt)
    setDisplayMetaIds(objects)
  }, [panelName, allObjects, index])
  if (!displayMetaIds.length) return null
  return (
    <Content style={{ width: '100%', padding: '0 8px' }}>
      <Content className={'transparent-font'} flex justifyContent={'space-between'}>
        <div className={'menu-sub-title'} style={{ margin: '10px 0px' }}>
          {t(`general.${panelName}`)}
        </div>
        {pagable && (
          <Content flex gap={10}>
            <Icon
              style={{ color: hasBefore ? undefined : Colors.Background.ButtonHover }}
              className={ClassName.circleButton()}
              size={16}
              name={'park-left'}
              onClick={() => {
                if (hasBefore) {
                  setPag({ start: Math.max(pag.start - count * rows, 0) })
                }
              }}
            />
            <Icon
              name={'park-right'}
              size={16}
              style={{ color: hasNext ? undefined : Colors.Background.ButtonHover }}
              className={ClassName.circleButton()}
              onClick={() => {
                if (hasNext) {
                  setPag({ start: pag.start + count * rows })
                }
              }}
            />
          </Content>
        )}
      </Content>
      <Content flex gap={20} style={{ flexWrap: 'wrap' }}>
        {displayMetaIds.slice(pag.start, pag.start + count * rows).map(i => (
          <GalleryItem metaId={i} key={i} />
        ))}
      </Content>
    </Content>
  )
}
export default HomeGallery
