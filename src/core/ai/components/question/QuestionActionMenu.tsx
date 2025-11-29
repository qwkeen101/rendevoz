import { MetaStore } from '@/api/stores'
import { Button, Content } from '@/components'
import { useTranslation } from 'react-i18next'

export default ({ id }: { id: number }) => {
  const questionMeta = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  return (
    <Content flex column>
      {[
        !questionMeta
          ? {
              name: t('general.add as object'),
              icon: 'park-share-one',
              onClick: async () => {
                let m = questionMeta
                if (!m) {
                  m = (
                    await Global.metaOps.addDraggableAsMeta({
                      type: 'question',
                      objectId: id
                    })
                  )[0]
                }
              }
            }
          : {
              name: t('general.View details'),
              icon: 'park-share-one',
              onClick: async () => {
                let m = questionMeta
                Global.metaOps.openDetails?.(m.id)
              }
            },
        {
          name: t('general.Copy link'),
          icon: 'park-link',
          onClick: async () => {
            let m = questionMeta
            if (!m) {
              m = (
                await Global.metaOps.addDraggableAsMeta(
                  {
                    type: 'question',
                    objectId: id
                  },
                  {
                    temp: true
                  }
                )
              )[0]
            }
            if (m) {
              Global.metaOps.copyLink(m.id)
            }
          }
        },
        {
          name: t('general.Move to'),
          icon: 'park-corner-up-right',
          onClick: async () => {
            let m = questionMeta
            if (!m) {
              m = (
                await Global.metaOps.addDraggableAsMeta({
                  type: 'question',
                  objectId: id
                })
              )[0]
            }
            if (m) {
              Global.metaOps.quickAdd?.(m.id)
            }
          }
        }
      ].map(i => i && <Button.IconButton text={i.name} key={i.icon} icon={i.icon} onClick={i.onClick} style={{ padding: '2px 8px' }} />)}
    </Content>
  )
}
