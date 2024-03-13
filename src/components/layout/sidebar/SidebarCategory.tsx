import { memo, useMemo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { useGlobalAtomValue } from '@/hooks'
import { useTranslation } from 'react-i18next'

export default memo(() => {
  const all = MetaStore.useMetaObjectsMap()
  const deleted = MetaStore.useDeletedObjectsSet()
  const index = MetaStore.useIndexedMetaObjects()
  const tagIndex = index?.tagToMetaObjectIdsMap
  const allTags = useGlobalAtomValue(ObjectStore('tag').objectMapAtom)
  const propIndex = index?.propToMetaObjectIdsMap
  const allProps = useGlobalAtomValue(ObjectStore('metaProp').objectMapAtom)
  const types = useMemo(() => {
    const index = MetaStore.getIndexedMetaObjects()
    if (!index) return null
    const visibleTypes = Array.from(index.typeToMetaObjectIdsMap.keys())
    const grouped = visibleTypes.map(i => {
      return {
        type: i,
        num: index?.typeToMetaObjectIdsMap.get(i)?.size ?? 0
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
      .filter(i => i.prop && !i.prop.deleted)
      .sort((a, b) => b.propNum - a.propNum)
    return grouped
  }, [propIndex, allProps])
  const { t } = useTranslation()
  return (
    <Content
      style={{
        height: '100%',
        paddingBottom: 200,
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          fontWeight: 600,
          padding: '12px 12px 0px'
        }}
      >
        {t('general.Types')}
      </div>
      <div
        style={{
          padding: '8px 8px'
        }}
      >
        {types?.map(i => (
          <Button.IconButton
            icon={Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
            onClick={() => {
              console.log(i)
              Rendevoz.Actions.Open.Group.openTypeGroup(i.type)
            }}
            className={'font-size-14'}
            suffixStr={i.num ? `${i.num}` : undefined}
            text={`${Rendevoz.Utils.Meta.getTypeName(i.type)}`}
            key={i.type}
          ></Button.IconButton>
        ))}
      </div>
      <div
        style={{
          fontWeight: 600,
          padding: '12px 12px 0px'
        }}
      >
        {t('general.Tags')}
      </div>
      <Content
        flex
        column
        style={{
          padding: '8px 8px'
        }}
      >
        {tags.map(
          i =>
            i.tag && (
              <Button.IconButton
                onClick={() => {
                  Rendevoz.Actions.Open.Group.openTagGroup(i.tag!.id)
                }}
                className={'font-size-14'}
                text={`# ${i.tag?.name}`}
                suffixStr={i.metaNum ? `${i.metaNum}` : undefined}
                key={i.tag?.id}
              ></Button.IconButton>
            )
        )}
      </Content>
      {props.length && (
        <>
          <div
            style={{
              fontWeight: 600,
              padding: '12px 12px 0px'
            }}
          >
            {t('general.Properties')}
          </div>
          <Content
            flex
            column
            style={{
              padding: '8px 8px'
            }}
          >
            {props.map(
              i =>
                i.prop && (
                  <Button.IconButton
                    onClick={() => {
                      Rendevoz.Actions.Open.Group.openPropGroup(i.prop!.id)
                    }}
                    className={'font-size-14'}
                    text={`# ${i.prop?.name}`}
                    suffixStr={i.propNum ? `${i.propNum}` : undefined}
                    key={i.prop?.id}
                  ></Button.IconButton>
                )
            )}
          </Content>
        </>
      )}
    </Content>
  )
})
