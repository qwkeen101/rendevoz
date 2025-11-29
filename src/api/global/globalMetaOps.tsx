import KeyvalueStore from '@/api/stores/keyvalue.store'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { ObjectCreateHandler } from '@/core/global/components/ObjectCreator'
import { renderToStaticMarkup } from 'react-dom/server'
import { GlobalGraphAtom } from '@/scenes/GraphPage'
import { IGlobalInstance, MetaObject } from '~/typings'
import { toast } from 'react-hot-toast'
import { t } from 'i18next'
import { DEFAULT_TABS } from '@/api/lifycycle/startup/registerTabs'
import SearchHelper from '@/api/textSearch/SearchHelper'
import { transformFilterGroupToFilterArray } from '@/core/object/filter/useBetterFilter'
import draggableToMeta from '@/api/global/draggableToMeta'
import fuzzysort from 'fuzzysort'
import { orderBy } from 'lodash'
import { compareStrings } from '@/utils'

const attachLinkToHTML = (str: string, html?: string) => {
  const div = document.createElement('div')
  if (html) {
    div.innerHTML = html
  }
  const attached = document.createElement('div')
  attached.setAttribute('data-ren-links', window.btoa(encodeURIComponent(str)))
  div.appendChild(attached)
  document.body.appendChild(div)
  const result = div.innerHTML
  document.body.removeChild(div)
  return result
}

// @ts-ignore
export default {
  getMetaName: m => {
    if (m?.type.includes('Label')) {
      return m.name || m?.placeholderName || ''
    }
    return m?.name || ''
  },
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
      KeyvalueStore.updateOne(`sidebarDatabaseCache_${workspace.id}`, { ...curr, selectedMeta: [metaId] })
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
    const object = MetaStore.getCachedMetaObject(id)
    if (!object) return
    const fromMeta = object.fromObject ? MetaStore.getCachedMetaObject(object.fromObject.metaId) : undefined
    const link = `rendevoz://object/${id}`
    const blackFont = '#131722'
    let selectedText = (await ObjectStore(object.type).getOneById(object.objectId))?.selectedText
    return {
      link: link,
      htmlLink: `<p><a href="${link}">${object.name || object.placeholderName || ''}</a></p>`,
      markdown: `[${object.name || object.placeholderName || ''}](${link})`,
      name: object.name || object.placeholderName,
      html: renderToStaticMarkup(
        <div style={{ color: blackFont }}>
          {selectedText && <blockquote>{selectedText}</blockquote>}
          <p>
            <a href={link}>{object.name || object.placeholderName || ''}</a>
          </p>
          {fromMeta && <cite>{fromMeta.name || fromMeta.placeholderName}</cite>}
        </div>
      )
    }
  },
  openGraph: id => {
    globalStore.set(GlobalGraphAtom, {
      edges: [],
      nodes: [],
      mode: 'object',
      id
    })
    Global.layoutOps?.openPage('graph')
  },
  getCopiedMetaObjectsSync: (data: string) => {
    try {
      const catchLinks = /data-ren-links="(.+?)"/m
      const [, links] = data.match(catchLinks) || []
      if (links) {
        const parsed = JSON.parse(decodeURIComponent(window.atob(links))) as number[]
        if (!Array.isArray(parsed) || !parsed.every(i => Number.isInteger(i))) {
          throw ''
        }
        return parsed.map(id => MetaStore.getCachedMetaObject(id)).filter(i => i) as MetaObject[]
      }
    } catch (e) {
      console.error('Not supported copied items.')
      return undefined
    }
  },
  getCopiedMetaObjects: async () => {
    const items = await navigator.clipboard.read()
    const target = items.find(i => i.types.includes('text/html'))
    if (target) {
      const data = await target.getType('text/html')
      return Global.metaOps?.getCopiedMetaObjectsSync(await data.text())
    }
  },
  copyLink: async id => {
    const idArr = Array.isArray(id) ? id : [id]
    const str = JSON.stringify(idArr)
    const ls = (await Promise.all(idArr.map(async i => await Global.metaOps?.getLink(i)))).filter(i => i)
    if (!ls) return
    Global.values.copiedWhiteboardData = undefined
    const content = [
      new ClipboardItem({
        'text/plain': new Blob([ls.map(i => i.link).join('\n')], { type: 'text/plain' }),
        'text/html': new Blob([attachLinkToHTML(str, ls.map(i => i.html).join('<br></br>'))], { type: 'text/html' })
      })
    ]
    navigator.clipboard.write(content)
    toast.success(t('general.Copied'))
  },
  canPreview: meta => {
    const obj = typeof meta === 'number' ? MetaStore.getCachedMetaObject(meta) : meta
    if (!obj || obj.deleted) return false
    const previewElement = DEFAULT_TABS.find(i => i.type === obj.type)
    const canPreview = !!(previewElement && obj.objectId)
    return canPreview
  },
  filter: async (filter, objects, opts) => {
    const filterFunc = await transformFilterGroupToFilterArray(filter)
    if (filterFunc !== undefined) {
      const allObjects = objects
        ? (objects
            .map(i => (typeof i === 'number' ? MetaStore.getCachedMetaObject(i) : i))
            .filter(i => (opts ? MetaStore.isVisibleMetaObject(i, opts) : i && !i.deleted)) as MetaObject[])
        : MetaStore.getAll({ showLabel: true, showHidden: true, ...opts })
      return allObjects.filter(filterFunc)
    }
    return []
  },
  search: async (search, objects, opts) => {
    if (opts?.onlyName) {
      let metas = MetaStore.getAll(opts)
      if (objects) {
        const idSet = new Set(objects.map(i => (typeof i === 'number' ? i : i.id)))
        metas = metas.filter(i => idSet.has(i.id))
      }
      const res = Array.from(
        fuzzysort.go(search, metas, {
          key: 'name',
          threshold: -10000
        })
      ).map(i => i.obj)
      return res
    } else {
      const res = await SearchHelper.searchDocument({ queryText: search })
      const metas = res
        .map(i => MetaStore.getCachedMetaObject(i.id))
        .filter(i => (opts ? MetaStore.isVisibleMetaObject(i, opts) : i && !i.deleted)) as MetaObject[]
      if (objects) {
        const idSet = new Set(objects.map(i => (typeof i === 'number' ? i : i.id)))
        return metas.filter(i => idSet.has(i.id))
      }
      return metas
    }
  },
  sort: (sort, type, objects) => {
    const allObjects = objects
      ? (objects.map(i => (typeof i === 'number' ? MetaStore.getCachedMetaObject(i) : i)) as MetaObject[])
      : MetaStore.getAll({ showAll: true })
    if (sort === 'name' || sort === 'description') {
      allObjects.sort((a, b) => compareStrings(a[sort], b[sort]))
      if (type === 'desc') {
        allObjects.reverse()
      }
      return allObjects
    } else {
      return orderBy(allObjects, o => o[sort] || '', type)
    }
  },
  hasTag: id => {
    if (id === undefined) return false
    const meta = typeof id === 'number' ? MetaStore.getCachedMetaObject(id) : id
    if (meta) {
      const tags = meta.tags || []
      if (!tags.length) return false
      const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
      if (tags.every(i => tagMap.has(i))) {
        return true
      }
    }
    return false
  },
  addDraggableAsMeta: async (d, opts) => {
    const currentKeys = new Set(MetaStore.getMetaObjectsMap().keys())
    const res = await draggableToMeta(d, opts)
    return res.map(m => {
      const isNewlyCreated = !currentKeys.has(m.id)
      if (m.temp && !d?.type.includes('Label') && opts?.temp !== true) {
        MetaStore.updateMetaObject({ id: m.id, temp: false })
        return { ...m, temp: false }
      }
      if (opts?.temp && isNewlyCreated) {
        MetaStore.updateMetaObject?.({ id: m.id, temp: true })
        return { ...m, temp: true }
      }
      return m
    })
  }
} as IGlobalInstance['metaOps']
