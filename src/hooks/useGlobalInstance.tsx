import { IGlobalInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
import { getSetting } from '@/core'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { useDb } from '@/hooks/stores'
import { renderToStaticMarkup } from 'react-dom/server'
const GlobalInstance: Partial<IGlobalInstance> = {}

assignProperties(GlobalInstance, {
  metaOps: {
    getLink: async id => {
      const object = MetaStore.getMetaObjectsMap().get(id)
      if (!object) throw 'No object!'
      const fromMeta = object.fromObject ? MetaStore.getMetaObjectsMap().get(object.fromObject.metaId) : undefined
      const link = `rendevoz://object/${id}`
      const transparentFont = 'rgba(31, 34, 37, 0.65)'
      const blackFont = '#131722'
      return {
        link: link,
        htmlLink: `<a href="${link}">${object.name || object.placeholderName || ''}</a>`,
        markdown: `[${object.name || object.placeholderName || ''}](${link})`,
        html: renderToStaticMarkup(
          <div style={{ color: blackFont }}>
            <div>
              {t('general.type')}: {Rendevoz.Utils.Meta.getTypeName(object.type)}
            </div>
            <div>
              <a href={link}>{object.name || object.placeholderName || ''}</a>
            </div>
            {fromMeta && (
              <div style={{ fontSize: 13, color: transparentFont }}>
                <a href={`rendevoz://object/${fromMeta.id}`}>{t('general.from') + ': ' + `${fromMeta.name}`}</a>
              </div>
            )}
          </div>
        )
      }
    },
    copyLink: async id => {
      const idArr = Array.isArray(id) ? id : [id]
      const ls = (await Promise.all(idArr.map(async i => await GlobalInstance.metaOps?.getLink(i)))).filter(i => i)
      if (!ls) return
      const setting = getSetting()
      switch (setting.object.linkType) {
        case 'text': {
          navigator.clipboard.writeText(ls.map(i => i.link).join('\n'))
          break
        }
        case 'url': {
          const content = [
            new ClipboardItem({
              'text/html': new Blob([ls.map(i => i.htmlLink).join('')], { type: 'text/html' }),
              'text/plain': new Blob([ls.map(i => i.link).join('\n')], { type: 'text/plain' })
            })
          ]
          navigator.clipboard.write(content)
          break
        }
        case 'markdown': {
          navigator.clipboard.writeText(ls.map(i => i.markdown).join('\n'))
          break
        }
        case 'html': {
          const content = [
            new ClipboardItem({
              'text/html': new Blob([ls.map(i => i.html).join('<br></br>')], { type: 'text/html' }),
              'text/plain': new Blob([ls.map(i => i.link).join('\n')], { type: 'text/plain' })
            })
          ]
          navigator.clipboard.write(content)
        }
      }
      toast.success(t('general.link is generated for this object'))
    }
  }
})
export default GlobalInstance
