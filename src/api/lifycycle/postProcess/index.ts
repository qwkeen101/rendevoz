import getNoteContainsMeta from '@/api/lifycycle/postProcess/getNoteContainsMeta'
import turnAllLabelsIntoMeta from '@/api/lifycycle/postProcess/turnAllLabelsIntoMeta'
import { processURLIndex } from '@/api/indexData/urlToId'

export default () => {
  getNoteContainsMeta()
  turnAllLabelsIntoMeta()
  processURLIndex()
}