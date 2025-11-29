import createObjectStore from '@/api/stores/object/object.store'
export default () => {
  return createObjectStore('question', {
    beforeAddProcess: async n => {
      if (!n.questionType) {
        n.questionType = 'text'
      }
    }
  })
}
