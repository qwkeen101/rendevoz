import KeyvalueStore from '@/stores/keyvalue.store'
import { MetaStore } from '@/stores'
import { useEffect, useState } from 'react'
import { AnimatePopover, Content, Icon, WithBorder } from '@/components'
import GalleryItem from '@/scenes/home/GalleryItem'
import { useMeasure } from 'react-use'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import GalleryConfig from '@/scenes/home/GalleryConfig'
import { useTranslation } from 'react-i18next'

const HomeGallery = () => {
  const objectIndex = MetaStore.useIndexedMetaObjects()
  const gallerySettings = KeyvalueStore.useValue('homeGallery') || {
    visibleLists: [
      {
        name: 'pinned',
        visible: true
      },
      {
        name: 'recentlyViewed',
        visible: true
      },
      {
        name: 'recentlyCreated',
        visible: true
      }
    ]
  }
  const rows = KeyvalueStore.useValue('homeGalleryRows') || 1
  useEffect(() => {
    if (objectIndex) {
      if (objectIndex.typeToMetaObjectIdsMap) {
        const map = objectIndex.typeToMetaObjectIdsMap
        if (map.size) {
          const allTypes = new Set(map.keys())
          let newVisibleList = gallerySettings.visibleLists.filter(i => {
            if (['recentlyViewed', 'recentlyCreated', 'pinned'].includes(i.name)) return true
            if (!allTypes.has(i.name)) return false
            if (allTypes.has(i.name)) {
              allTypes.delete(i.name)
              return true
            }
          })
          newVisibleList = newVisibleList.concat(Array.from(allTypes.values()).map(i => ({ visible: true, name: i })))
          KeyvalueStore.updateOne('homeGallery', {
            ...gallerySettings,
            visibleLists: newVisibleList
          })
        }
      }
    }
  }, [objectIndex])

  const [ref, { width }] = useMeasure()

  const count = Math.round((width - 20) / 228)
  return (
    <Content ref={ref} fullWidth column flex gap={30}>
      {gallerySettings.visibleLists.map(i => i.visible && <GalleryPanel key={i.name} count={count} panelName={i.name} />)}
    </Content>
  )
}

const GalleryPanel = ({ panelName, count }: { panelName: string; count: number }) => {
  const [displayMetaIds, setDisplayMetaIds] = useState<number[]>([])
  const allObjects = MetaStore.useMetaObjectsMap()
  const index = MetaStore.useIndexedMetaObjects()
  const { t } = useTranslation()
  const rows = KeyvalueStore.useValue('homeGalleryRows') || 1
  const [pag, setPag] = useState<{
    start: number
  }>({
    start: 0
  })
  const pagable = displayMetaIds.length > count * rows
  const hasBefore = pag.start > 0
  const hasNext = displayMetaIds.length > count * rows + pag.start
  useEffect(() => {}, [count])
  useEffect(() => {
    const map = MetaStore.getMetaObjectsMap()
    if (panelName === 'pinned') {
      setDisplayMetaIds(Array.from(index?.pinnedMetaObjectsSet?.values() || []).map(i => i.id))
      return
    }
    const arrayObjects = Array.from(allObjects.values())
    if (panelName === 'recentlyViewed') {
      const viewed = arrayObjects.filter(i => i.viewAt)
      viewed.sort((b, a) => a.viewAt! - b.viewAt!)
      setDisplayMetaIds(viewed.map(i => i.id))
      return
    }
    if (panelName === 'recentlyCreated') {
      arrayObjects.sort((b, a) => a.id - b.id)
      setDisplayMetaIds(arrayObjects.map(i => i.id))
      return
    }
    const objects = Array.from(index?.typeToMetaObjectIdsMap?.get(panelName)?.values() || []).filter(i => map.has(i)) as number[]
    objects.sort((b, a) => map.get(a)!.createdAt - map.get(b)!.createdAt)
    setDisplayMetaIds(objects)
  }, [panelName, allObjects, index])

  return (
    <Content style={{ width: '100%' }}>
      <Content flex justifyContent={'space-between'}>
        <div style={{ fontSize: 13, color: Colors.Font.Transparent, margin: '10px 0px' }}>{t(`general.${panelName}`)}</div>
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
