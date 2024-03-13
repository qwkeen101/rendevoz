import { Segment, useDefault } from 'segmentit'
import { ISearchableDocument, ISearchEvent, ISearchQuery } from '@/api/textSearch/types'
import MiniSearch from 'minisearch'
const segmentit = useDefault(new Segment())
const createSearchStore = () => {
  let metaSearch = new MiniSearch({
    fields: ['id', 'name', 'description', 'content'],
    storeFields: ['id', 'name', 'description', 'content', 'docType', 'metaId', 'metaType'],
    tokenize: str => {
      const tokens: string[] = []
      segmentit.doSegment(str).forEach(i => {
        tokens.push(i.w)
      })
      return tokens
    }
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
    const fields = ['name', 'content', 'description']
    const res = metaSearch.search(params.queryText, {
      prefix: true,
      boost: {
        name: 5,
        description: 2,
        content: 1
      },
      combineWith: 'AND'
    })

    const regEsc = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

    res.forEach(hit => {
      const matched: Record<string, string> = {}
      const terms = hit.terms
      const allTerms = new Set(terms)

      const matchFields = new Set(Object.values(hit.match).flat(1))
      fields.forEach(field => {
        if (!matchFields.has(field)) return
        const value = hit[field] as string
        const tokens: string[] = []

        segmentit.doSegment(value).forEach(seg => {
          if (allTerms.has(seg.w)) {
            tokens.push(seg.w)
          }
        })
        const regexp = new RegExp('(\\S.{0,20})?(' + [...terms, ...tokens].map(i => regEsc(i)).join('|') + ')(.{0,20}\\S)?', 'ig')
        const testReg = new RegExp([...terms, ...tokens].join('|'), 'gi')
        if (hit[field] && testReg.test(hit[field] as string)) {
          if (field === 'name') {
            matched[field] = hit[field].replace(testReg, '<mark>$&</mark>')
          } else {
            const results: string[] = []
            ;(hit[field] as string).replace(regexp, function (m, $1, $2, $3) {
              if (results.length < 5) {
                results.push(`${$1 ? '…' + $1 : ''}<mark>${$2}</mark>${$3 ? $3 + '…' : ''}`)
              }
            })
            matched[field] = results.join('')
          }
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
      fields: ['id', 'name', 'description', 'content'],
      storeFields: ['id', 'name', 'description', 'content', 'docType', 'metaId', 'metaType'],
      tokenize: str => {
        const tokens: string[] = []
        segmentit.doSegment(str).forEach(i => {
          tokens.push(i.w)
        })
        return tokens
      }
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
