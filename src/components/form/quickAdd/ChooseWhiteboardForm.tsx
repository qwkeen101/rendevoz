import { useEffect, useState } from 'react'
import { MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Button, Content, Icon } from '@/components'
import { DraggableElement, IconNameRenderer, useSetting, Whiteboard } from '@/core'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import produce from 'immer'
import { useDebounceEffect } from '@/hooks'
import fuzzysort from 'fuzzysort'

export default ({ onBack, onClose, metaId }: { onBack: VoidFunction; onClose: VoidFunction; metaId: number }) => {
  const [allWhiteboards, setAllWhiteboards] = useState<MetaObject[]>([])
  const [currentWhiteboard, setCurrentWhiteboard] = useState<{
    id: number
    name: string
  }>()
  const currentMeta = MetaStore.useValue(metaId)
  const [setting, setSetting] = useSetting()
  const index = MetaStore.useMetaObjectsMap()
  useEffect(() => {
    const whiteboards = Array.from(MetaStore.getIndexedMetaObjects()?.typeToMetaObjectIdsMap.get('whiteboard')?.values() || [])
      .map(i => MetaStore.getMetaObjectsMap().get(i))
      .filter(i => i) as MetaObject[]
    whiteboards.sort((a, b) => b.createdAt - a.createdAt)
    setAllWhiteboards(whiteboards)
  }, [index])
  const [displayWhiteboards, setDisplayWhiteboards] = useState<MetaObject[]>([])
  const [search, setSearch] = useState('')
  const handler = Rendevoz.Events.Emit.useEventHandler('global')
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  handler.on('globalDropNeedFurtherProcess', e => {
    if (setting.quickAdd.addIntoWhiteboardHideObject) {
      if (e.dropOn?.dropOn === 'whiteboard' && e.dropOn?.whiteboardId == currentWhiteboard?.id) {
        MetaStore.updateMetaObject({ id: metaId, hidden: true }, true)
      }
    }
  })
  useDebounceEffect(
    () => {
      if (search) {
        const result = Array.from(fuzzysort.go(search, allWhiteboards, { key: 'name' }).values()).map(i => i.obj)
        setDisplayWhiteboards(result)
      } else {
        setDisplayWhiteboards([])
      }
    },
    [search],
    { wait: 300 }
  )
  useEffect(() => {
    emitter.addListener('global', handler)
    return () => {
      emitter.removeListener('global', handler)
    }
  })
  const { t } = useTranslation()

  return (
    <Content flex style={{ width: '90vw', height: '90vh', minWidth: 800, fontSize: 14 }}>
      <Content flex column style={{ padding: 12, width: 400 }}>
        <Content flex gap={12} className={ClassName.title()} style={{ marginBottom: 8 }}>
          <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />
          <div>{t('general.Select a whiteboard')}</div>
        </Content>
        <div style={{ color: Colors.Font.Transparent, fontSize: 13, marginBottom: 4, paddingLeft: 8 }}>
          {t('general.Drag to add object into whiteboard')}
        </div>
        <DraggableElement
          draggingDetails={{
            type: 'metaElement',
            metaId: metaId
          }}
        >
          <Content
            flex
            alignItems={'center'}
            style={{
              background: Colors.Background.ButtonHover,
              cursor: 'grab',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 14,
              marginBottom: 8,
              marginLeft: 8
            }}
            gap={12}
          >
            <Icon name={'park-drag'} size={16} />
            <div className={ClassName.ellipsisFont(2)}>{currentMeta?.name}</div>
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
        <input
          className={ClassName.noStyleInput}
          style={{ padding: '3px 8px' }}
          placeholder={t('general.Type to search') + '...'}
          value={search}
          onChange={e => {
            setSearch(e.target.value)
          }}
        />
        <Content flex column style={{ overflowY: 'auto', borderTop: '1px solid var(--border-background)', marginTop: 4, paddingTop: 4 }}>
          <Button.IconButton
            text={t('general.Create new whiteboard')}
            icon={'park-plus'}
            onClick={() => {
              ObjectStore('whiteboard').addOneWithMeta(
                {},
                {
                  currentMeta: {
                    name: 'Unnamed whiteboard'
                  },
                  showMetaModal: true
                }
              )
            }}
          />
          {(displayWhiteboards.length ? displayWhiteboards : allWhiteboards).map(i => (
            <IconNameRenderer
              className={ClassName.flatButton()}
              onClick={() => setCurrentWhiteboard({ id: i.objectId, name: i.name })}
              {...i}
              icon={i.icon || Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
              key={i.id}
            />
          ))}
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
            height: 0,
            flex: 'auto',
            overflow: 'hidden',
            width: '100%'
          }}
        >
          {currentWhiteboard && <Whiteboard key={currentWhiteboard.id} whiteboardId={currentWhiteboard.id} />}
        </div>
      </Content>
    </Content>
  )
}
