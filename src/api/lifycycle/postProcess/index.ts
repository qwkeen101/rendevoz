import getNoteContainsMeta from '@/api/lifycycle/postProcess/getNoteContainsMeta'
import { processURLIndex } from '@/api/indexData/urlToId'

export default () => {
  getNoteContainsMeta()
  processURLIndex()
}
