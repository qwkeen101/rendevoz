import { ISearchableDocument, ISearchEvent, ISearchQuery } from '@/api/textSearch/types'
import MiniSearch from 'minisearch'
import highlightAndTruncate from './highlightAndTruncate'
const createSearchStore = () => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  let metaSearch = new MiniSearch({
    fields: ['id', 'name', 'description', 'content', 'placeholderName'],
    storeFields: ['id', 'name', 'description', 'content', 'placeholderName', 'docType', 'metaId', 'metaType'],
    tokenize: str =>
      Array.from(segmenter.segment(str))
        .filter(i => i.isWordLike)
        .map(i => i.segment)
  })

  const addDocument = async (doc: ISearchableDocument) => {
    const origin = metaSearch.getStoredFields(doc.id)
    if (metaSearch.has(doc.id)) {
      metaSearch.discard(doc.id)
    }
    metaSearch.add({ ...origin, ...doc })
  }

  const addDocuments = (docs: ISearchableDocument[]) => {
    const metas = docs.filter(i => i.docType === 'metaObject')
    metaSearch.addAll(metas)
  }

  const searchDocument = (params: ISearchQuery) => {
    const fields = ['name', 'content', 'description', 'placeholderName']
    const res = metaSearch.search(params.queryText, {
      prefix: true,
      boost: {
        name: 5,
        description: 2,
        content: 1,
        placeholderName: 1
      },
      combineWith: 'AND'
    })
    console.log(res)
    res.forEach(hit => {
      const matched: Record<string, string> = {}
      const matchFields = new Set(Object.values(hit.match).flat(1))
      fields.forEach(field => {
        if (!matchFields.has(field)) return
        const value = hit[field] as string
        if (field === 'name') {
          matched[field] = highlightAndTruncate(value, hit.terms, 9999, 9999)
        } else {
          matched[field] = highlightAndTruncate(value, hit.terms)
        }
      })
      hit.matched = matched
    })
    return res
  }

  const updateDocuments = (documents: ISearchableDocument[]) => {
    metaSearch.discardAll(documents.map(i => i.id))
    metaSearch.addAll(documents)
  }

  const saveIndex = (tableName: 'metaObject' = 'metaObject') => {
    if (tableName === 'metaObject') {
      return metaSearch.toJSON()
    }
  }

  const load = (json: string) => {
    metaSearch = MiniSearch.loadJSON(json, {
      fields: ['id', 'name', 'description', 'content', 'placeholderName'],
      storeFields: ['id', 'name', 'description', 'content', 'placeholderName', 'docType', 'metaId', 'metaType'],
      tokenize: str =>
        Array.from(segmenter.segment(str))
          .filter(i => i.isWordLike)
          .map(i => i.segment)
    })
  }
  const deleteDocument = (id: number) => {
    metaSearch.discard(id)
  }
  return {
    searchDocument,
    addDocuments,
    addDocument,
    updateDocuments,
    saveIndex,
    load,
    deleteDocument,
    initialize: () => {
      metaSearch.removeAll()
    }
  }
}
const searchStore = createSearchStore()

self.onmessage = async e => {
  const evn = e.data as ISearchEvent

  switch (evn.event) {
    case 'initialize': {
      searchStore.initialize()
      break
    }
    case 'insertDocument': {
      searchStore.addDocument(evn.document)
      break
    }
    case 'insertDocuments': {
      searchStore.addDocuments(evn.documents)
      break
    }
    case 'searchDocument': {
      const result = searchStore.searchDocument(evn.query)
      e.ports[0].postMessage({
        event: 'findResult',
        result
      })
      break
    }
    case 'updateDocuments': {
      searchStore.updateDocuments(evn.documents)
      break
    }
    case 'deleteDocument': {
      searchStore.deleteDocument(evn.id)
      break
    }
    case 'load': {
      searchStore.load(evn.json)
      break
    }
    case 'save': {
      const json = searchStore.saveIndex('metaObject')
      e.ports[0].postMessage({
        event: 'saveResult',
        result: json
      })
    }
  }
}
