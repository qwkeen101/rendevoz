import getNoteContainsMeta from '@/api/lifycycle/postProcess/getNoteContainsMeta'
import turnAllLabelsIntoMeta from '@/api/lifycycle/postProcess/turnAllLabelsIntoMeta'

export default () => {
  getNoteContainsMeta()
  turnAllLabelsIntoMeta()
}