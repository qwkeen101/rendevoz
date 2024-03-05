import OramaWorker from './createSearchIndex?worker'
import { ISearchableDocument, ISearchQuery, ISearchResult } from '@/api/textSearch/types'
import { useDb } from '@/hooks'
import loadAllNotes from '@/api/textSearch/loadAllNotes'
import { MetaObject } from '~/typings'
import { Node } from 'slate'
import FileSystem from '@/api/fileSystem'

const worker = new OramaWorker()
const metaDb = useDb('metaObjects')

const normalizeMetaToDoc = (meta: MetaObject) => {
  return {
    id: meta.id,
    metaId: meta.id,
    metaType: meta.type,
    docType: 'metaObject',
    name: meta.name,
    description: meta.description
  }
}
export const initializeSearch = async () => {
  worker.postMessage({
    event: 'initialize'
  })
  fetch('rendefile:///meta-search-index.json', {
    cache: 'no-cache'
  })
    .then(res => {
      console.log(res)
      if (res.ok) {
        res.text().then(t => {
          worker.postMessage({
            event: 'load',
            json: t
          })
        })
      }
    })
    .catch(e => {
      metaDb.toArray().then(docs => {
        worker.postMessage({
          event: 'insertDocuments',
          documents: docs.map(i => normalizeMetaToDoc(i))
        })
        loadAllNotes().then(values => {
          const normalizedDocuments = values
            .filter(i => i)
            .map(i => ({
              ...normalizeMetaToDoc(i.targetMeta),
              content: Node.string({ children: i.value })
            }))
          worker.postMessage({
            event: 'updateDocuments',
            documents: normalizedDocuments
          })
        })
      })
    })
}

class SearchHelper {
  public insertDocument = async (doc: ISearchableDocument) => {
    worker.postMessage({
      event: 'insertDocument',
      document: doc
    })
  }

  public insertDocuments = (docs: ISearchableDocument[]) => {
    worker.postMessage({
      event: 'insertDocuments',
      documents: docs
    })
  }

  public searchDocument = (query: ISearchQuery): Promise<ISearchResult> =>
    new Promise(res => {
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = e => {
        messageChannel.port1.close()
        res(e.data.result)
      }
      worker.postMessage(
        {
          event: 'searchDocument',
          query
        },
        [messageChannel.port2]
      )
    })
  public saveSearchIndexLocally = async () => {
    const result = await new Promise(res => {
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = e => {
        messageChannel.port1.close()
        res(e.data.result)
      }
      worker.postMessage(
        {
          event: 'save'
        },
        [messageChannel.port2]
      )
    })
    const blob = new Blob([JSON.stringify(result)], { type: 'json' })
    await FileSystem.fs.writeFile(blob, '/meta-search-index.json')
  }

  public deleteDocuments = (id: number) => {
    worker.postMessage({
      event: 'deleteDocument',
      id: id
    })
  }
}

const search = new SearchHelper()
export default search
