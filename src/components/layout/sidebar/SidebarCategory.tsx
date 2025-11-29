import { memo, useMemo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Button } from '@/components'
import { useGlobalAtomValue } from '@/hooks'
import { useTranslation } from 'react-i18next'
import ContextMenu from '@/components/contextMenu'
import PropertyMenu from '@/core/object/renderer/properties/PropertyMenu'
import MetaTagMenu from '@/core/object/MetaTagMenu'

export default memo(() => {
  const all = MetaStore.useMetaObjectsMap()
  const deleted = MetaStore.useDeletedObjectsSet()
  const index = MetaStore.useIndexedMetaObjects()
  const tagIndex = index?.tagToMetaObjectIdsMap
  const allTags = useGlobalAtomValue(ObjectStore('tag').objectMapAtom)
  const propIndex = index?.propToMetaObjectIdsMap
  const allProps = useGlobalAtomValue(ObjectStore('metaProp').objectMapAtom)
  const types = useMemo(() => {
    const visibleTypes = MetaStore.getVisibleMetaTypes({
      showLabel: true,
      showHidden: true
    })
    const grouped = visibleTypes.map(i => {
      return {
        type: i,
        num:
          Array.from(index?.typeToMetaObjectIdsMap.get(i)?.values() || []).filter(i =>
            MetaStore.isVisibleMetaObject(MetaStore.getCachedMetaObject(i), { showLabel: true, showHidden: true })
          )?.length ?? 0
      }
    })
    grouped.sort((a, b) => b.num - a.num)
    return grouped
  }, [all, deleted.size, index])
  const tags = useMemo(() => {
    const grouped = Array.from(allTags.keys())
      .map(i => {
        return {
          tag: allTags.get(i),
          metaNum: tagIndex?.get(i)?.size ?? 0
        }
      })
      .filter(i => i.tag && !i.tag.deleted)
      .sort((a, b) => b.metaNum - a.metaNum)
    return grouped
  }, [tagIndex, allTags])
  const props = useMemo(() => {
    const grouped = Array.from(allProps.keys())
      .map(i => {
        return {
          prop: allProps.get(i),
          propNum: propIndex?.get(i)?.size ?? 0
        }
      })
      .filter(i => i.prop && !i.prop.deleted && i.propNum > 0)
      .sort((a, b) => b.propNum - a.propNum)
    return grouped
  }, [propIndex, allProps])
  const { t } = useTranslation()
  return (
    <div className={'overflow-y-auto pb-10 h-full px-3 pt-4'}>
      <div className={'menu-sub-title pl-2 mb-1'}>{t('general.Types')}</div>
      <div>
        {types?.length ? (
          types?.map(i => (
            <Button.IconButton
              icon={Global.utils.getIcon(i.type)}
              onClick={() => {
                Global.layoutOps?.openPage('typeGroup', {
                  id: i.type
                })
              }}
              suffixStr={i.num ? `${i.num}` : undefined}
              text={`${Global.utils.getTypeName(i.type)}`}
              key={i.type}
            ></Button.IconButton>
          ))
        ) : (
          <div className={'small-transparent w-full px-6 py-32 text-center'}>
            {t('sidebar.Your files will be categorized here by type')}
          </div>
        )}
      </div>
      <div className={'menu-sub-title pl-2 mt-4 mb-1'}>{t('general.Tags')}</div>
      <div>
        {tags.length ? (
          tags.map(
            i =>
              i.tag && (
                <ContextMenu key={i.tag.id} content={setV => <MetaTagMenu id={i.tag.id} onClose={() => setV(false)} />}>
                  <Button.IconButton
                    onClick={() => {
                      Global.layoutOps?.openPage('tagGroup', { id: i.tag!.id })
                    }}
                    text={`# ${i.tag?.name}`}
                    suffixStr={i.metaNum ? `${i.metaNum}` : undefined}
                    key={i.tag?.id}
                  ></Button.IconButton>
                </ContextMenu>
              )
          )
        ) : (
          <div className={'small-transparent w-full px-6 py-32 text-center'}>{t('sidebar.Your files will be categorized here by tag')}</div>
        )}
      </div>
      {props.length !== 0 && (
        <>
          <div className={'menu-sub-title pl-2 mt-4 mb-1'}>{t('general.Properties')}</div>
          <div>
            {props.map(
              i =>
                i.prop && (
                  <ContextMenu
                    key={i.prop.id}
                    content={setV => (
                      <PropertyMenu
                        show={{
                          view: true,
                          delete: true
                        }}
                        editable
                        onClose={() => setV(false)}
                        property={i.prop}
                      />
                    )}
                  >
                    <Button.IconButton
                      onClick={() => {
                        Global.layoutOps?.openPage('propGroup', { id: i.prop!.id })
                      }}
                      icon={i.prop.icon}
                      text={`${i.prop?.name}`}
                      suffixStr={i.propNum ? `${i.propNum}` : undefined}
                      key={i.prop?.id}
                    ></Button.IconButton>
                  </ContextMenu>
                )
            )}
          </div>
        </>
      )}
    </div>
  )
})
