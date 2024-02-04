import { memo, useLayoutEffect, useState } from 'react'
import { MetaObject } from '~/typings'
import { GroupStore, MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import { IconNameRenderer, useSetting } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import produce from 'immer'
import { useDebounceEffect } from '@/hooks'
import fuzzysort from 'fuzzysort'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

export default memo(({ onBack, metaId, onClose }: { onBack: VoidFunction; metaId: number[]; onClose: VoidFunction }) => {
  const [allGroups, setAllGroups] = useState<MetaObject[]>([])
  const [setting, setSetting] = useSetting()
  const [search, setSearch] = useState('')
  const [displayGroups, setDisplayGroups] = useState<MetaObject[]>([])
  const [selectedGroup, setSelectedGroup] = useState<MetaObject>()
  const index = MetaStore.useIndexedMetaObjects()
  const { t } = useTranslation()
  useLayoutEffect(() => {
    const groups = Array.from(MetaStore.getIndexedMetaObjects()?.typeToMetaObjectIdsMap.get('group')?.values() || [])
    if (groups.length) {
      const all = groups.map(i => MetaStore.getMetaObjectsMap().get(i) as MetaObject).filter(i => MetaStore.isVisibleMetaObject(i))
      all.sort((a, b) => b.createdAt - a.createdAt)
      setAllGroups(all)
    }
  }, [index])
  useDebounceEffect(
    () => {
      if (search) {
        const result = fuzzysort.go(search, allGroups, { key: 'name' })
        setDisplayGroups(Array.from(result.values()).map(i => i.obj))
      } else {
        setDisplayGroups([])
      }
    },
    [search],
    { wait: 300 }
  )
  const handleInsertMetaIntoGroup = () => {
    onClose()
    if (selectedGroup) {
      const groupId = selectedGroup.objectId
      if (groupId) {
        GroupStore.insertMetaIntoGroup(metaId, groupId)
        const groupMeta = MetaStore.getMetaObjectByObjectId(groupId)
        if (groupMeta) {
          if (setting.quickAdd.addIntoGroupAutoOpen) {
            setTimeout(() => {
              Rendevoz.Actions.Open.Meta.openMetaObject(groupMeta.id)
            }, 100)
          }
          metaId.forEach(id => {
            MetaStore.addMetaLink(
              {
                sourceId: id,
                targetId: groupMeta.id
              },
              true
            )
          })
        }
      }
    }
  }
  return (
    <Content
      flex
      column
      style={{
        fontSize: 14,
        padding: '12px',
        minWidth: 'min(540px, 90vw)',
        maxWidth: 'min(800px, 90vw)',
        minHeight: 'min(400px, 90vh)',
        maxHeight: 'min(650px, 90vh)',
        overflowY: 'auto'
      }}
    >
      <Content flex alignItems={'center'} style={{ marginBottom: 8 }} gap={12}>
        <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />
        <div className={ClassName.title()}>{t('general.Select a group')}</div>
      </Content>
      {/*<ButtonSwitch*/}
      {/*  value={hideObject}*/}
      {/*  name={t('general.Hide object')}*/}
      {/*  onChange={v => {*/}
      {/*    setSetting(s =>*/}
      {/*      produce(s, draft => {*/}
      {/*        draft.quickAdd.addIntoGroupHideObject = v*/}
      {/*      })*/}
      {/*    )*/}
      {/*  }}*/}
      {/*/>*/}
      <ButtonSwitch
        value={setting.quickAdd.addIntoGroupAutoOpen}
        name={t('general.Auto open')}
        onChange={v => {
          setSetting(s =>
            produce(s, draft => {
              draft.quickAdd.addIntoGroupAutoOpen = v
            })
          )
        }}
      />
      <input
        placeholder={t('general.Type to search') + '...'}
        style={{
          padding: '3px 8px',
          marginBottom: 4
        }}
        className={ClassName.noStyleInput}
        value={search}
        onChange={v => setSearch(v.target.value)}
      />
      {selectedGroup && (
        <>
          <div style={{ fontSize: 13, color: Colors.Font.Transparent, padding: '0px 8px' }}>{t('general.Selected group')}</div>
          <Content flex alignItems={'center'} justifyContent={'space-between'} gap={12} style={{ padding: '0px 8px', marginBottom: 8 }}>
            <div className={ClassName.ellipsisFont(1)}>{selectedGroup.name || selectedGroup.placeholderName}</div>
            <div className={ClassName.selectButton(4, '1px 12px')} style={{ flexShrink: 0 }} onClick={() => handleInsertMetaIntoGroup()}>
              {t('general.OK')}
            </div>
          </Content>
        </>
      )}
      <Content flex column style={{ overflowY: 'auto', borderTop: `1px solid ${Colors.Background.Border}`, paddingTop: 4 }}>
        <IconNameRenderer
          className={ClassName.flatButton()}
          onClick={() => {
            ObjectStore('group').addOneWithMeta(
              {},
              {
                showMetaModal: true
              }
            )
          }}
          icon={'park-plus'}
          name={t('general.Create new group')}
        />
        {(displayGroups.length ? displayGroups : allGroups).map(
          i =>
            i && (
              <IconNameRenderer
                className={ClassName.flatButton()}
                onClick={() => {
                  setSelectedGroup(i)
                }}
                color={i.color}
                key={i.id}
                icon={i.icon || Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
                name={i.name || i.placeholderName}
              />
            )
        )}
      </Content>
    </Content>
  )
})
