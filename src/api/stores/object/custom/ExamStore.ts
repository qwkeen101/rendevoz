import createObjectStore from '@/api/stores/object/object.store'
import { ObjectStore } from '@/api/stores'
import extractQuestionText from '@/core/components/exam/extractQuestionText'
import { t } from 'i18next'
import trans from '@/consts/trans'
export default () => {
  return createObjectStore('exam', {
    onSearch: async o => {
      const questions = await ObjectStore('examQuestion').getMultipleByIds(o.questions)
      return questions
        .map((i, idx) => {
          const text = extractQuestionText(i)
          if (i.type === 'description') {
            if (text) return text
          }
          return [`${idx + 1}. ${i.name || t(trans.Unnamed)}`, text].filter(i => i).join(' ')
        })
        .filter(i => i)
        .join(' ')
    },
    afterUpdateProcess: {
      triggerSearch: true
    }
  })
}
