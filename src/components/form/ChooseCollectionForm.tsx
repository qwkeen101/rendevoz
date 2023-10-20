import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'
import { ICollection } from '~/typings'
import { CollectionStore } from '@/stores'
import { useState } from 'react'
import { Content, Footer } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'

export default ({ onChoose, onCancel }: { onChoose?: (collection: ICollection) => void; onCancel?: VoidFunction }) => {
  const [currentSelectCollection, setCurrentSelectCollection] = useState<ICollection>()
  return (
    <Content flex column style={{ padding: '12px 12px', width: 360, maxWidth: 'calc(100vw - 100px)', maxHeight: '50vh' }}>
      <div className={ClassName.title()} style={{ marginBottom: 20 }}>
        Select one collection
      </div>
      <div style={{ color: Colors.Font.Transparent, fontSize: 13 }}>All collections</div>
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
      <div style={{ height: 12 }}></div>
      <div style={{ color: Colors.Font.Transparent, fontSize: 13 }}>Selected collection</div>
      <div style={{ marginBottom: 24 }}>{currentSelectCollection?.name !== undefined ? currentSelectCollection.name || 'Unnamed collection' : undefined}</div>
      <Footer
        onBack={() => {
          console.log('back')
          onCancel?.()
        }}
        onSubmit={() => {
          if (currentSelectCollection) {
            onChoose?.(currentSelectCollection)
          }
        }}
      ></Footer>
    </Content>
  )
}
