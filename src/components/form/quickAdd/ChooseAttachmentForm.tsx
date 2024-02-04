import { Content, Icon } from '@/components'
import MetaFilterer from '@/core/object/filter/MetaFilterer'
import { MetaStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MetaObject } from '~/typings'
import { Colors } from '@/consts'

export default memo(({ onBack, metaId, onClose }: { onBack: VoidFunction; onClose: VoidFunction; metaId: number[] }) => {
  const { t } = useTranslation()
  const [selectedMeta, setSelectedMeta] = useState<MetaObject>()
  return (
    <Content flex column style={{ padding: 12, fontSize: 14, width: 'min(420px,90vw)', height: 'min(400px, 90vh)' }}>
      <Content flex alignItems={'center'} style={{ marginBottom: 8 }} className={ClassName.title()} gap={12}>
        <Icon name={'park-left'} onClick={onBack} className={ClassName.circleButton()} />
        <div>{t('general.Add object as attachment')}</div>
      </Content>
      <MetaFilterer
        style={{ width: '100%', height: '0px', flex: 'auto' }}
        showCreate={{
          note: true,
          whiteboard: true
        }}
        onChange={async v => {
          const targetMeta = await MetaStore.getMetaObjectById(v)
          if (targetMeta) {
            setSelectedMeta(targetMeta)
          }
        }}
      />
      {selectedMeta && (
        <Content style={{ marginTop: 8 }}>
          <div style={{ color: Colors.Font.Transparent, fontSize: 13 }}>{t('general.Selected object')}</div>
          <Content flex gap={12} justifyContent={'space-between'}>
            <div className={ClassName.ellipsisFont(1)}>{selectedMeta.name || selectedMeta.placeholderName}</div>
            <div
              onClick={async () => {
                onClose()
                const metaMap = MetaStore.getMetaObjectsMap()
                const currentMeta = await Promise.all(metaId.map(i => MetaStore.getMetaObjectById(i)))
                if (selectedMeta && currentMeta.length) {
                  const currentMetaIds = new Set<number>(currentMeta.filter(i => i).map(i => i.id) as number[])
                  const forbidden = new Set<number>(selectedMeta.attachments?.map(i => i.id))
                  const filtered = Array.from(currentMetaIds.values()).filter(i => !forbidden.has(i)).map(i => metaMap.get(i)).filter(i => i) as MetaObject[]
                  MetaStore.updateMetaObject(
                    {
                      id: selectedMeta.id,
                      attachments: [
                        ...(selectedMeta.attachments || []),
                        ...filtered.map(i => ({
                          type: i.type,
                          id: i.id,
                          createdAt: Date.now()
                        }))
                      ]
                    },
                    {
                      silent: true
                    }
                  )
                }
              }}
              style={{ flexShrink: 0 }}
              className={ClassName.selectButton(4, '1px 10px')}
            >
              {t('general.OK')}
            </div>
          </Content>
        </Content>
      )}
    </Content>
  )
})
