import { MetaStore, ObjectStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { useTranslation } from 'react-i18next'
import { GlobalInstance } from '@/hooks'

export default ({ id }: { id: number }) => {
  const questionMeta = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  return (
    <Content flex column>
      {[
        !questionMeta || questionMeta.hidden
          ? {
              name: t('general.add as object'),
              icon: 'park-share-one',
              onClick: async () => {
                let m = questionMeta
                if (!m) {
                  m = await GlobalInstance.metaOps?.addDraggableAsMeta({
                    type: 'question',
                    objectId: id
                  })
                }
              }
            }
          : {
              name: t('general.View details'),
              icon: 'park-share-one',
              onClick: async () => {
                let m = questionMeta
                GlobalInstance.metaOps?.openDetails(m.id)
              }
            },
        {
          name: t('general.Copy link'),
          icon: 'park-link',
          onClick: async () => {
            let m = questionMeta
            if (!m) {
              m = await GlobalInstance.metaOps?.addDraggableAsMeta(
                {
                  type: 'question',
                  objectId: id
                },
                true
              )
            }
            if (m) {
              GlobalInstance.metaOps?.copyLink(m.id)
            }
          }
        },
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
            if (m) {
              GlobalInstance.metaOps?.quickAdd(m.id)
            }
          }
        }
      ].map(i => i && <Button.IconButton text={i.name} key={i.icon} icon={i.icon} onClick={i.onClick} style={{ padding: '2px 8px' }} />)}
    </Content>
  )
}
