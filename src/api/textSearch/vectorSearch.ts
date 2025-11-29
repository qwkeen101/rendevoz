import { env, pipeline, FeatureExtractionPipeline } from '@xenova/transformers'
env.localModelPath = '/embedding/'
env.allowRemoteModels = false
let pipe: FeatureExtractionPipeline | undefined = undefined

// https://huggingface.co/Snowflake/snowflake-arctic-embed-xs
const model = 'snow'

const initializeModel = async () => {
  pipe = await pipeline('feature-extraction', model)
}
const getEmbedding = async (text: string) => {
  if (!pipe) {
    await initializeModel()
  }
  if (pipe) {
    const output = await pipe(text, { normalize: true, pooling: 'cls' })
    console.log(output.data)
  }
}

export default getEmbedding
