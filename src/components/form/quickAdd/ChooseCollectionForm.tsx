import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'
import { ICollection } from '~/typings'
import { CollectionStore } from '@/api/stores'
import { memo, useState } from 'react'
import { Content, Footer, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

export default memo(({ onChoose, onBack }: { onChoose?: (collection: ICollection) => void; onBack?: VoidFunction }) => {
  const [currentSelectCollection, setCurrentSelectCollection] = useState<ICollection>()
  const { t } = useTranslation()
  return (
    <Content flex column style={{ padding: '12px 12px', width: 'min(420px, 90vw)', maxHeight: 'min(85vh, 900px)' }}>
      <Content flex alignItems={'center'} gap={12} className={ClassName.title()} style={{ marginBottom: 20 }}>
        <Icon name={'park-left'} className={ClassName.circleButton()} onClick={onBack} />
        {t('general.Select one collection')}
      </Content>
      {currentSelectCollection && (
        <>
          <div style={{ color: Colors.Font.Transparent, fontSize: 13 }}>{t('general.Selected collection')}</div>
          <Content flex justifyContent={'space-between'} gap={12} style={{ fontSize: 14, marginBottom: 8 }}>
            {currentSelectCollection?.name !== undefined ? currentSelectCollection.name || 'Unnamed collection' : undefined}
            <div
              className={ClassName.selectButton()}
              style={{ fontSize: 14, padding: '1px 10px', flexShrink: 0 }}
              onClick={() => {
                if (currentSelectCollection) {
                  onChoose?.(currentSelectCollection)
                }
              }}
            >
              {t('general.OK')}
            </div>
          </Content>
        </>
      )}
      <div style={{ width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarCollection
          onlyCollection={true}
          showHeader={false}
          onClick={(e, i) => {
            if (i.type === 'collection' && i.id) {
              CollectionStore.getCollectionById(i.id).then(res => {
                if (res) {
                  setCurrentSelectCollection(res)
                }
              })
            }
          }}
        />
      </div>
    </Content>
  )
})
