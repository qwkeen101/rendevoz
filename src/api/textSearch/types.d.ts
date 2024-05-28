export type ISearchableDocument = {
  docType: 'metaObject'
  metaId: number
  metaType: string
  name: string
  description?: string
  placeholderName?: string
  // note, pdf, video...
  content?: string
  id: number
}

export type ISearchQuery = {
  queryText: string
  metaType?: string
}

export type ISearchEvent =
  | {
      event: 'insertDocument'
      document: ISearchableDocument
    }
  | {
      event: 'insertDocuments'
      documents: ISearchableDocument[]
    }
  | {
      event: 'searchDocument'
      query: ISearchQuery
    }
  | {
      event: 'updateDocuments'
      documents: ISearchableDocument[]
    }
  | {
      event: 'save'
    }
  | {
      event: 'initialize'
    }
  | {
      event: 'load'
      json: string
    }
  | {
      event: 'deleteDocument'
      id: number
    }

export type ISearchResult = (ISearchableDocument & {
  // key -> matched string with highlight
  matched: Record<string, string>
  terms: string[]
})[]
