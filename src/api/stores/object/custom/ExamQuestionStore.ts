import createObjectStore from '@/api/stores/object/object.store'
import extractQuestionText from '@/core/components/exam/extractQuestionText'
import { ObjectStore } from '@/api/stores'

export default () => {
  return createObjectStore('examQuestion', {
    onSearch: async o => {
      return extractQuestionText(o)
    },
    afterUpdateProcess: {
      triggerSearch: true,
      onSuccess: o => {
        if (o.parentObjectId) {
          ObjectStore('exam').triggerSearch?.(o.parentObjectId)
        }
      }
    }
  })
}
