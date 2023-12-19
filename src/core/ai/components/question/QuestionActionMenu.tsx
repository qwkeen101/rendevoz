import { MetaStore, ObjectStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { useTranslation } from 'react-i18next'
import { GlobalInstance } from '@/hooks'

export default ({ id }: { id: number }) => {
  const question = ObjectStore('question').useValue(id)
  const questionMeta = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  return (
    <Content flex column>
      {[
        {
          name: t('general.Move to'),
          icon: 'park-corner-up-right',
          onClick: async () => {
            let m = questionMeta
            if (!m) {
              m = await GlobalInstance.metaOps?.addDraggableAsMeta({
                type: 'question',
                objectId: id
              })
            }
            if(m){
              GlobalInstance.metaOps?.quickAdd(m.id)
            }
          }
        }
      ].map(i => (
        <Button.IconButton text={i.name} key={i.icon} icon={i.icon} onClick={i.onClick} style={{ padding: '2px 8px' }} />
      ))}
    </Content>
  )
}
