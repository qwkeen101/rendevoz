import { IGlobalInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
import { getSetting } from '@/core'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
const GlobalInstance: Partial<IGlobalInstance> = {}

assignProperties(GlobalInstance, {
  metaOps: {
    copyLink: async id => {
      const object = MetaStore.getMetaObjectsMap().get(id)
      const originalObject = object?.objectId ? await ObjectStore(object.type).getOneById(object.objectId) : undefined
      const fromMeta = object.fromObject ? MetaStore.getMetaObjectsMap().get(object.fromObject.metaId) : undefined
      const name = object
        ? `${t('general.type')}: ${Rendevoz.Utils.Meta.getTypeName(object.type)}${
            fromMeta && fromMeta.name ? '\n' + t('general.from') + ': ' + `${fromMeta.name}` : ''
          }: \n${object.name === 'Unnamed Label' ? originalObject?.selectedText || object.name : object.name}`
        : 'Unnamed object'
      const setting = getSetting()
      const link = `rendevoz://object/${id}`
      switch (setting.object.linkType) {
        case 'text': {
          navigator.clipboard.writeText(link)
          break
        }
        case 'url': {
          const content = [
            new ClipboardItem({
              'text/html': new Blob([`<a href="${link}">${name}</a>`], { type: 'text/html' }),
              'text/plain': new Blob([link], { type: 'text/plain' })
            })
          ]
          navigator.clipboard.write(content)
          break
        }
        case 'markdown': {
          const content = `[${name}](${link})`
          navigator.clipboard.writeText(content)
          break
        }
      }
      toast.success(t('general.link is generated for this object'))
    }
  }
})
export default GlobalInstance
