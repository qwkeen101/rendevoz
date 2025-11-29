import callback from './callback'
import { chunkit } from '../embedding/chunkit'
import { join } from 'path'
import usearch, { MetricKind, ScalarKind } from 'usearch'
import FileService from '../service/file'
import getUniqueId from '../utils/getUniqueId'
import { createEmbedding, initializeEmbeddingUtils } from '../embedding/embeddingUtils'
import fs from 'fs'
import textSplitter from '../embedding/textSplitter'
const EMBEDDING_INDEX_PATH = '/embedding_index'
const EMBEDDING_METADATA_PATH = '/embedding_metadata.json'
type IInputDocument = {
  id: string
  text: string
}

const dimension = 384
const uIndex = new usearch.Index({
  metric: MetricKind.Cos,
  dimensions: dimension,
  connectivity: 4,
  quantization: ScalarKind.I8,
  multi: false,
  expansion_add: 3,
  expansion_search: 3
})

type IEmbeddingMetadata = {
  id: number
  // source meta id
  source: number
  text: string
}

let metadata: Record<string, IEmbeddingMetadata> = {}
callback('search', async (query: string) => {
  const searchVector = await createEmbedding(query)
  const searchResult = uIndex.search(searchVector, 20)
  const res = Array.from(searchResult.keys).map(k => {
    const original = metadata[Number(k)]
    return original
  })
  return res
})

const embedding = async (documents: IInputDocument[]) => {
  await initializeEmbeddingUtils('Snowflake/snowflake-arctic-embed-xs', 'q8', join(process.env.PUBLIC, 'models'))
  await Promise.allSettled(
    documents.map(async document => {
      const numId = Number(document.id)
      // first delete original index embeddings and metadata
      metadata = Object.fromEntries(
        Object.entries(metadata).filter(i => {
          if (i[1].source === numId) {
            // remove from uindex
            uIndex.remove(BigInt(i[1].id))
            return false
          }
          return true
        })
      )
      let normalizedText = document.text.replace(/([^\n])\n([^\n])/g, '$1 $2')
      normalizedText = normalizedText.replace(/\s{2,}/g, ' ')
      const chunks = textSplitter(normalizedText)
      console.log(chunks)
      await Promise.allSettled(
        chunks.map(async i => {
          const embedding = await createEmbedding(i)
          const chunkId = getUniqueId()
          metadata[chunkId] = {
            id: chunkId,
            text: i,
            source: numId
          }
          uIndex.add(BigInt(chunkId), embedding)
        })
      )
    })
  )
}