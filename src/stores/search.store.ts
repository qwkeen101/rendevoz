import { MeiliSearch } from 'meilisearch'
import { ObjectFamily } from './object.store'

const MeiliClient = new MeiliSearch({
  host: 'http://127.0.0.1:7700'
})

export type SearchableDocument =
  | {
      specType: 'noteBlock'
      id: number
      content: string
      targetObjectId: number
    }
  | {
      specType: 'pdfPage'
      id: number
      content: string
      targetObjectId: number
      pageIndex: number
    }
export type SearchParams = {
  specType: keyof ObjectFamily | 'all'
  query?: string
  filter?: string[]
}

export type ISearchResultItem = {
  doc: SearchableDocument
  positions?: {
    start: number
    length: number
  }[]
}
const createSearchStore = () => {
  const client = MeiliClient
  const initializeSearchEngine = async () => {
    try {
      const idx = await client.getIndex('rendevoz')
      if (!idx.primaryKey) {
        client.updateIndex('rendevoz', {
          primaryKey: 'id'
        })
      }
      await updateSearchableFields()
      await updateFilterIndex()
    } catch (e) {
      await client.createIndex('rendevoz', {
        primaryKey: 'id'
      })
      setTimeout(() => {
        updateSearchableFields()
        updateFilterIndex()
      }, 1000)
    }
  }
  const getIndex = () => {
    return client.index('rendevoz')
  }

  const updateSearchableFields = async () => {
    const index = getIndex()
    const searchables = await index.getSearchableAttributes()

    if (searchables[0] === 'content') {
      return
    } else {
      index.updateSearchableAttributes(['content'])
    }
  }
  const updateFilterIndex = async () => {
    const index = getIndex()
    const filterables = await index.getFilterableAttributes()
    if (!filterables.includes('targetObjectId') || !filterables.includes('specType')) {
      await index.updateFilterableAttributes(['targetObjectId', 'specType'])
    }
  }
  const addDocument = async (doc: SearchableDocument) => {
    const index = getIndex()
    const res = await index.addDocuments([doc])
    return res
  }
  const addDocuments = async (docs: SearchableDocument[]) => {
    const addableDocs = docs
      .map(doc => {
        switch (doc.specType) {
          case 'pdfPage':
          case 'noteBlock':
            return doc
          default:
            return
        }
      })
      .filter(i => i !== undefined) as SearchableDocument[]
    const index = getIndex()
    const res = await index.addDocuments(addableDocs)
    return res
  }
  const searchDocument = async (params: SearchParams) => {
    const index = getIndex()
    const filter = params.specType === 'all' ? undefined : `specType = ${params.specType}`
    const result = await index.search(params.query, {
      filter: filter || params.filter ? ([filter, ...(params.filter || [])].filter(i => i) as string[]) : undefined,
      attributesToHighlight: ['*'],
      attributesToCrop: ['content'],
      attributesToRetrieve: [],
      cropLength: 50,
      hitsPerPage: 40
    })
    return result.hits.map(i => ({
      doc: i._formatted as SearchableDocument,
      positions: i._matchesPosition?.content
    })) as ISearchResultItem[]
  }
  const existTargetObjectDocuments = async (targetObjectId: number) => {
    const index = getIndex()
    const result = await index.search(undefined, {
      filter: [`targetObjectId=${targetObjectId}`],
      attributesToRetrieve: [],
      hitsPerPage: 0
    })
    if (result.totalHits === 0) {
      return false
    }
    if (result.totalHits > 0) {
      return true
    }
    return false
  }
  const deleteDocuments = async (ids: number[]) => {
    const index = getIndex()
    const result = await index.deleteDocuments(ids)
    return result
  }
  return {
    addDocument,
    searchDocument,
    addDocuments,
    deleteDocuments,
    updateFilterIndex,
    updateSearchableFields,
    initializeSearchEngine,
    existTargetObjectDocuments
  }
}

export const SearchStore = createSearchStore()
SearchStore.initializeSearchEngine()
