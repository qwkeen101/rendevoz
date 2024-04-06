import { useEffect, useMemo, useState } from 'react'
import { IWhiteboardEvents, IWhiteboardInstance, MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Menu } from '@/components'
import { DraggableElement, useSetting, Whiteboard } from '@/core'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { useTranslation } from 'react-i18next'
import { Colors, KEY } from '@/consts'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import produce from 'immer'
import { useDebounceEffect } from '@/hooks'
import fuzzysort from 'fuzzysort'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import UpdateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'
import isHotkey from 'is-hotkey'
import useMoveToCache from '@/components/form/quickAdd/useMoveToCache'

export default ({ onBack, onClose, metaId }: { onBack: VoidFunction; onClose: VoidFunction; metaId: number[] }) => {
  const cache = useMoveToCache()?.whiteboard

  const [setting, setSetting] = useSetting()
  const index = MetaStore.useMetaObjectsMap()
  const [whiteboardInstance, setInstance] = useState<IWhiteboardInstance>()
  const moveToShowInvisible = KeyvalueStore.useValue('moveToShowInvisible')
  const allWhiteboards = useMemo(() => {
    const whiteboards = Array.from(index.values()).filter(
      i => (!moveToShowInvisible ? MetaStore.isVisibleMetaObject(i) : true) && i.type === 'whiteboard'
    )
    whiteboards.sort((a, b) => b.createdAt - a.createdAt)
    return whiteboards
  }, [index, moveToShowInvisible])
  const [selectedWhiteboard, setSelectedWhiteboard] = useState<number>(
    cache?.id ? (allWhiteboards.some(i => i.objectId === cache.id) ? cache.id : undefined) : undefined
  )
  const [displayWhiteboards, setDisplayWhiteboards] = useState<MetaObject[]>()
  const [search, setSearch] = useState('')
  useEffect(() => {
    if (whiteboardInstance) {
      const h = (e: IWhiteboardEvents) => {
        if (e.type === 'drop' && e.itemType === 'object') {
          const ids = Array.isArray(e.metaId) ? e.metaId : [e.metaId]
          UpdateMovetoCache(c => {
            c.whiteboard = { id: selectedWhiteboard }
            c.recently = c.recently
              ? [{ type: 'whiteboard', id: selectedWhiteboard }, ...c.recently.filter(i => i.id !== selectedWhiteboard)]
              : [{ type: 'whiteboard', id: selectedWhiteboard }]
          })
          if (setting.quickAdd.addIntoWhiteboardHideObject) {
            ids.forEach(id => {
              MetaStore.updateMetaObject({ id, hidden: true })
            })
          }
        }
      }
      whiteboardInstance.addEventListener?.(h)
      return () => {
        whiteboardInstance.removeEventListener?.(h)
      }
    }
  }, [whiteboardInstance])
  useDebounceEffect(
    () => {
      if (search) {
        const result = Array.from(fuzzysort.go(search, allWhiteboards, { key: 'name' }).values()).map(i => i.obj)
        setDisplayWhiteboards(result)
      } else {
        setDisplayWhiteboards(undefined)
      }
    },
    [search],
    { wait: 200 }
  )
  const { t } = useTranslation()

  return (
    <Content flex style={{ width: '95vw', height: '90vh', minWidth: 800, fontSize: 14 }}>
      <Content flex column style={{ padding: '12px 12px 12px 6px', width: 400, boxShadow: Colors.Consts.BoxShadowBorderRight }}>
        <Content flex gap={12} className={ClassName.title()} style={{ marginBottom: 8 }}>
          <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />
          <div>{t('general.Select a whiteboard')}</div>
        </Content>
        <DraggableElement
          draggingDetails={{
            type: 'metaObjects',
            ids: metaId
          }}
        >
          <Content
            flex
            alignItems={'center'}
            className={'border-box-shadow transparent-font light-hover'}
            style={{
              cursor: 'grab',
              padding: '4px 8px',
              borderRadius: 4,
              marginRight: 8,
              fontSize: 14,
              marginBottom: 8,
              transition: 'all 0.15s ease-in-out',
              marginLeft: 8
            }}
            gap={12}
          >
            <Icon name={'park-drag'} size={16} />
            <div className={'font-size-14'}>{t('general.Drag to add object into whiteboard')}</div>
          </Content>
        </DraggableElement>
        <ButtonSwitch
          name={t('general.Hide object')}
          value={setting.quickAdd.addIntoWhiteboardHideObject}
          onChange={v =>
            setSetting(s =>
              produce(s, draft => {
                draft.quickAdd.addIntoWhiteboardHideObject = v
              })
            )
          }
        />
        <ButtonSwitch
          name={t('general.Show hidden objects')}
          value={!!moveToShowInvisible}
          onChange={v => KeyvalueStore.updateOne('moveToShowInvisible', v)}
        />
        <input
          autoFocus
          onKeyDownCapture={e => {
            if (isHotkey(KEY.Escape, e)) {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.blur()
            }
          }}
          className={'border-box-shadow focus-input'}
          style={{ padding: '3px 8px', borderRadius: 4, margin: '6px 8px' }}
          placeholder={t('general.Type to search') + '...'}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
        />
        <Content flex column style={{ overflowY: 'auto', paddingTop: 4 }}>
          <Menu.NavigationMenu
            disableEnterPreventDefault
            reselectOnLayoutChange={search ? true : false}
            defaultSelected={cache ? [String(cache.id)] : undefined}
            layout={[
              search
                ? undefined
                : {
                    type: 'item',
                    icon: 'park-plus',
                    text: t('general.Create new whiteboard'),
                    key: 'create',
                    onSelect: () => {
                      ObjectStore('whiteboard').addOneWithMeta(
                        {},
                        {
                          showMetaModal: true
                        }
                      )
                    }
                  },
              // @ts-ignore
              ...(displayWhiteboards || allWhiteboards).map(i => ({
                type: 'item',
                key: String(i.objectId),
                style:
                  selectedWhiteboard === i.objectId
                    ? {
                        background: Colors.Common.SelectColorTransparentLight,
                        color: Colors.Common.SelectColor
                      }
                    : undefined,
                text: i.name || i.placeholderName || 'Unnamed whiteboard',
                icon: i.icon || Rendevoz.Utils.Object.getMetaObjectIcon(i.type),
                onSelect: () => {
                  setSelectedWhiteboard(i.objectId!)
                }
              }))
            ].filter(i => i)}
          />
        </Content>
      </Content>
      <Content flex column fullWidth fullHeight style={{ background: Colors.Background.Global, borderRadius: '0px 8px 8px 0px' }}>
        <Content
          flex
          style={{
            padding: '12px 16px',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className={ClassName.title()}
        >
          {t('general.Preview')}
        </Content>
        <div
          style={{
            height: '100%',
            overflow: 'hidden',
            width: '100%',
            position: 'relative'
          }}
        >
          {selectedWhiteboard && (
            <Whiteboard onInstanceInitialized={i => setInstance(i)} key={selectedWhiteboard} whiteboardId={selectedWhiteboard} />
          )}
        </div>
      </Content>
    </Content>
  )
}
