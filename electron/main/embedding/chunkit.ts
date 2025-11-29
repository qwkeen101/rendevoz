// ===========================
// == 🍱 semantic-chunking ==
// ==================================================================
// == Semantically create chunks from large texts                  ==
// == Useful for workflows involving large language models (LLMs)  ==
// ==================================================================
// == npm package: https://www.npmjs.com/package/semantic-chunking ==
// == github repo: https://github.com/jparkerweb/semantic-chunking ==
// ==================================================================

import { parseSentences } from './sentenceParse'
import { DEFAULT_CONFIG } from './config'
import { initializeEmbeddingUtils, tokenizer, createEmbedding } from './embeddingUtils'
import { computeAdvancedSimilarities, adjustThreshold } from './similarityUtils'
import { createChunks, optimizeAndRebalanceChunks, applyPrefixToChunk } from './chunkingUtils'

type IDocument = {
  document_text: string
  document_name: string
}
// ---------------------------
// -- Main chunkit function --
// ---------------------------
export async function chunkit(
  documents: IDocument[],
  {
    logging = DEFAULT_CONFIG.LOGGING,
    maxTokenSize = DEFAULT_CONFIG.MAX_TOKEN_SIZE,
    similarityThreshold = DEFAULT_CONFIG.SIMILARITY_THRESHOLD,
    dynamicThresholdLowerBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_LOWER_BOUND,
    dynamicThresholdUpperBound = DEFAULT_CONFIG.DYNAMIC_THRESHOLD_UPPER_BOUND,
    numSimilaritySentencesLookahead = DEFAULT_CONFIG.NUM_SIMILARITY_SENTENCES_LOOKAHEAD,
    combineChunks = DEFAULT_CONFIG.COMBINE_CHUNKS,
    combineChunksSimilarityThreshold = DEFAULT_CONFIG.COMBINE_CHUNKS_SIMILARITY_THRESHOLD,
    onnxEmbeddingModel = DEFAULT_CONFIG.ONNX_EMBEDDING_MODEL,
    dtype = DEFAULT_CONFIG.DTYPE,
    localModelPath = DEFAULT_CONFIG.LOCAL_MODEL_PATH,
    modelCacheDir = DEFAULT_CONFIG.MODEL_CACHE_DIR,
    chunkPrefix = DEFAULT_CONFIG.CHUNK_PREFIX,
    excludeChunkPrefixInResults = false
  } = {}
) {
  // Input validation
  if (!Array.isArray(documents)) {
    throw new Error('Input must be an array of document objects')
  }

  // Initialize embedding utilities and set optional paths
  await initializeEmbeddingUtils(onnxEmbeddingModel, dtype, localModelPath, modelCacheDir)

  // Process each document
  const allResults = await Promise.all(
    documents.map(async doc => {
      if (!doc.document_text) {
        throw new Error('Each document must have a document_text property')
      }

      // Normalize document text by converting single line breaks to spaces
      // but preserving multiple line breaks
      let normalizedText = doc.document_text.replace(/([^\n])\n([^\n])/g, '$1 $2')
      // Convert multiple spaces to single space
      normalizedText = normalizedText.replace(/\s{2,}/g, ' ')
      doc.document_text = normalizedText

      // Split the text into sentences
      const sentences = await parseSentences(doc.document_text)
      // Compute similarities and create chunks
      const { similarities, average, variance } = await computeAdvancedSimilarities(sentences, {
        numSimilaritySentencesLookahead,
        logging
      })
      // Dynamically adjust the similarity threshold based on variance and average
      let dynamicThreshold = similarityThreshold
      if (average != null && variance != null) {
        dynamicThreshold = adjustThreshold(average, variance, similarityThreshold, dynamicThresholdLowerBound, dynamicThresholdUpperBound)
      }

      // Create the initial chunks using the adjusted threshold
      const initialChunks = createChunks(sentences, similarities, maxTokenSize, dynamicThreshold, logging)

      let finalChunks

      // Combine similar chunks and balance sizes if requested
      if (combineChunks) {
        finalChunks = await optimizeAndRebalanceChunks(initialChunks, tokenizer, maxTokenSize, combineChunksSimilarityThreshold)
      } else {
        finalChunks = initialChunks
      }
      const documentName = doc.document_name || '' // Normalize document_name
      return Promise.all(
        finalChunks.map(async chunk => {
          const prefixedChunk = applyPrefixToChunk(chunkPrefix, chunk)
          const result = {
            document_name: documentName,
            text: prefixedChunk,
            embedding: await createEmbedding(prefixedChunk)
          }

          // Remove prefix if requested (after embedding calculation)
          if (excludeChunkPrefixInResults && chunkPrefix && chunkPrefix.trim()) {
            const prefixPattern = new RegExp(`^${chunkPrefix}:\\s*`)
            result.text = result.text.replace(prefixPattern, '')
          }

          return result
        })
      )
    })
  )

  // Flatten the results array since we're processing multiple documents
  return allResults.flat()
}
