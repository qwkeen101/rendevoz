import { env, pipeline, AutoTokenizer } from '@huggingface/transformers'
let tokenizer
let generateEmbedding

// --------------------------------------------
// -- Initialize embedding model and tokenizer --
// --------------------------------------------
export async function initializeEmbeddingUtils(onnxEmbeddingModel: string, dtype = 'fp32', localModelPath = null, modelCacheDir = null) {
  // Configure environment
  env.allowRemoteModels = false
  env.allowLocalModels = true
  if (localModelPath) env.localModelPath = localModelPath
  if (modelCacheDir) env.cacheDir = modelCacheDir
  tokenizer = await AutoTokenizer.from_pretrained(onnxEmbeddingModel)
  generateEmbedding = await pipeline('feature-extraction', onnxEmbeddingModel, {
    dtype: 'q8',
    device: 'gpu'
  })
  return {
    modelName: onnxEmbeddingModel,
    dtype: dtype
  }
}

// -------------------------------------
// -- Function to generate embeddings --
// -------------------------------------
export async function createEmbedding(text: string | string[]) {
  const embeddings = await generateEmbedding(text, { pooling: 'mean', normalize: true })
  return embeddings.data
}

export { tokenizer }
