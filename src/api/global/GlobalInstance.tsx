import { IGlobalInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
import { getSetting, traverseGetRelatedNodeIds } from '@/core'
import { globalStore, MetaStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { renderToStaticMarkup } from 'react-dom/server'
import { ObjectCreateHandler } from '@/core/global/components/ObjectCreator'
import { GlobalGraphAtom } from '@/scenes/GraphPage'
import jumpBackToSyncBlock from '@/core/object/jumpBack/jumpBackToSyncBlock'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
const GlobalInstance: IGlobalInstance = {
  values: {
    // only one can work
    registeredKeynavigationHandlers: [],
    // all work
    keydownHandlers: []
  }
}
document.addEventListener('keydown', e => {
  GlobalInstance.values.keydownHandlers.forEach(v => {
    v(e)
  })
  GlobalInstance.values.registeredKeynavigationHandlers[0]?.(e)
})
assignProperties(GlobalInstance, {
  goBackOps: {
    goBackToSyncBlock: jumpBackToSyncBlock
  },
  objectOps: {
    isLabel: o => {
      if (!o) return false
      if ('specType' in o) {
        if (['pdfLabel', 'webpageLabel', 'noteLabel', 'videoLabel', 'audioLabel'].includes(o.specType)) {
          return true
        }
      }
      return false
    }
  },
  metaOps: {
    viewContains: async metaId => {
      const workspace = KeyvalueStore.getOne('currentWorkspace')
      if (workspace) {
        const curr = KeyvalueStore.getOne(`sidebarDatabaseCache_${workspace.id}`) || {
          filterVisible: false,
          searchInput: '',
          searchVisible: false,
          viewMode: 'thumbnail',
          filter: {
            groupType: 'and',
            filterType: 'group',
            rules: []
          }
        }
        updateSidebarState(s => {
          s.leftOpen = true
          s.leftVisible = 'database'
        })
        KeyvalueStore.updateOne(`sidebarDatabaseCache_${workspace.id}`, { ...curr, selectedMeta: [...(curr.selectedMeta || []), metaId] })
      }
    },
    canViewContains: metaId => {
      const m = MetaStore.getCachedMetaObject(metaId)
      if (!m || m.deleted) return false
      const workspace = KeyvalueStore.getOne('currentWorkspace')
      if (workspace) {
        const sidebarCache = KeyvalueStore.getOne(`sidebarDatabaseCache_${workspace.id}`)
        if (
          !sidebarCache?.selectedMeta?.includes(metaId) &&
          ['pdf', 'video', 'audio', 'note', 'webpage', 'whiteboard', 'group'].includes(m.type)
        ) {
          return true
        }
      }
      return false
    },
    canCreateDirectly: type => {
      if (ObjectCreateHandler[type]) return true
      return false
    },
    getLink: async id => {
      const object = MetaStore.getMetaObjectsMap().get(id)
      if (!object) throw 'No object!'
      const fromMeta = object.fromObject ? MetaStore.getMetaObjectsMap().get(object.fromObject.metaId) : undefined
      const link = `rendevoz://object/${id}`
      const transparentFont = 'rgba(31, 34, 37, 0.65)'
      const blackFont = '#131722'
      return {
        link: link,
        htmlLink: `<p><a href="${link}">${object.name || object.placeholderName || ''}</a></p>`,
        markdown: `[${object.name || object.placeholderName || ''}](${link})`,
        name: object.name || object.placeholderName,
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
    openGraph: id => {
      const metaObjectsMap = MetaStore.getMetaObjectsMap()
      const allMetaLinks = Array.from(MetaStore.getMetaLinksMap().values())
      const nodeIds = new Set<number>()
      traverseGetRelatedNodeIds(id, nodeIds, true)

      const nodes = Array.from(nodeIds.values())
        .map(nodeId => metaObjectsMap.get(nodeId))
        .filter(i => i && !i.deleted)
        .map(i => ({
          id: i.id,
          label: i.name,
          coverImgSrc: i.coverImgSrc,
          type: i.type,
          isCenter: i.id === id,
          icon: i.icon,
          objectId: i.objectId
        }))
      const existedNodeIds = new Set()
      nodes.forEach(n => existedNodeIds.add(n.id))
      const edges = allMetaLinks.filter(i => existedNodeIds.has(i.sourceId) && existedNodeIds.has(i.targetId))
      globalStore.set(GlobalGraphAtom, {
        edges: [...edges],
        nodes: [...nodes]
      })
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'graph' } })
    },
    copyLink: async id => {
      const idArr = Array.isArray(id) ? id : [id]
      const ls = (await Promise.all(idArr.map(async i => await GlobalInstance.metaOps?.getLink(i)))).filter(i => i)
      if (!ls) return
      const setting = getSetting()
      switch (setting.object.linkType) {
        case 'text': {
          const content = [
            new ClipboardItem({
              'text/plain': new Blob([ls.map(i => i.name).join('\n')], { type: 'text/plain' })
            })
          ]
          navigator.clipboard.write(content)
          break
        }
        case 'url': {
          const content = [
            new ClipboardItem({
              'text/html': new Blob([ls.map(i => i.htmlLink).join('<br></br>')], { type: 'text/html' }),
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
      toast.success(t('general.Copied'))
    }
  }
})

export default GlobalInstance
