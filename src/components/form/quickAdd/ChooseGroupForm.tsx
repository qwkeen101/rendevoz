import { memo, useMemo, useState } from 'react'
import { MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Menu } from '@/components'
import { GlobalSetting } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { ClassName } from 'rendevoz'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import produce from 'immer'
import { useDebounceEffect, useMemoizedFn } from '@/hooks'
import fuzzysort from 'fuzzysort'
import { KEY } from '@/consts'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import updateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'
import isHotkey from 'is-hotkey'
import quickAdd from '@/components/form/quickAdd/quickAdd'
import useMoveToCache from '@/components/form/quickAdd/useMoveToCache'

export default memo(
  ({
    onBack,
    metaId,
    onClose,
    onPickGroup
  }: {
    onBack: VoidFunction
    metaId?: number[]
    onClose: VoidFunction
    onPickGroup?: (groupMetaId: number) => void
  }) => {
    const cache = useMoveToCache()?.group
    const [setting, setSetting] = GlobalSetting.useSetting()
    const [search, setSearch] = useState('')
    const [displayGroups, setDisplayGroups] = useState<MetaObject[]>()

    const index = MetaStore.useMetaObjectsMap()
    const { t } = useTranslation()
    const moveToShowInvisible = KeyvalueStore.useValue('moveToShowInvisible')
    const allGroups = useMemo(() => {
      const groups = Array.from(index.values()).filter(
        i => (!moveToShowInvisible ? MetaStore.isVisibleMetaObject(i) : true) && i.type === 'group'
      )
      if (groups.length) {
        const all = groups
        all.sort((a, b) => b.createdAt - a.createdAt)
        return all
      }
      return []
    }, [index, moveToShowInvisible])
    const [selectedGroup, setSelectedGroup] = useState<number>(
      cache?.id ? (allGroups.some(i => i.objectId === cache.id) ? cache.id : undefined) : undefined
    )
    useDebounceEffect(
      () => {
        if (search) {
          const result = fuzzysort.go(search, allGroups, { key: 'name' })
          setDisplayGroups(Array.from(result.values()).map(i => i.obj))
        } else {
          setDisplayGroups(undefined)
        }
      },
      [search],
      { wait: 200 }
    )
    const handleInsertMetaIntoGroup = useMemoizedFn(() => {
      onClose()
      if (selectedGroup) {
        const groupId = selectedGroup
        if (groupId) {
          const groupMeta = MetaStore.getMetaObjectByObjectId(groupId)
          if (groupMeta) {
            onPickGroup?.(groupMeta.id)
          }
          if (metaId) {
            quickAdd(metaId, 'group', selectedGroup)
          }
        }
      }
    })
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
        {metaId && (
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
        )}
        <ButtonSwitch
          name={t('general.Show hidden objects')}
          value={!!moveToShowInvisible}
          onChange={v => KeyvalueStore.updateOne('moveToShowInvisible', v)}
        />
        <input
          placeholder={t('general.Type to search') + '...'}
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            margin: '6px 8px'
          }}
          autoFocus
          onKeyDownCapture={e => {
            if (isHotkey(KEY.Escape, e)) {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.blur()
            }
          }}
          className={'border-box-shadow focus-input'}
          value={search}
          onChange={v => setSearch(v.target.value)}
        />
        <Content flex column style={{ overflowY: 'auto', paddingTop: 4 }}>
          <Menu.NavigationMenu
            reselectOnLayoutChange={search ? true : false}
            defaultSelected={cache?.id ? [String(cache.id)] : undefined}
            layout={[
              search
                ? undefined
                : {
                    text: t('general.Create new group'),
                    icon: 'park-plus',
                    type: 'item',
                    key: 'create',
                    onSelect: () => {
                      ObjectStore('group').addOneWithMeta(
                        {},
                        {
                          showMetaModal: true
                        }
                      )
                    }
                  },
              // @ts-ignore
              ...(displayGroups || allGroups).map(i => ({
                text: i.name || i.placeholderName || 'Unnamed group',
                key: String(i.objectId),
                icon: i.icon || Rendevoz.Utils.Object.getMetaObjectIcon(i.type),
                type: 'item',
                onSelect: () => {
                  const objId = i.objectId
                  onClose()
                  if (!objId) return
                  setSelectedGroup(objId)

                  setTimeout(() => {
                    handleInsertMetaIntoGroup()
                  }, 250)
                  updateMovetoCache(s => {
                    s.recently = s.recently ? [{ type: 'group', id: objId }, ...s.recently] : [{ type: 'group', id: objId }]
                    s.group = { id: objId }
                  })
                }
              }))
            ].filter(i => i)}
          />
        </Content>
      </Content>
    )
  }
)
