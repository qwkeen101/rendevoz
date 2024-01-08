import produce from 'immer'
import { MetaStore } from '@/api/stores/index'
import { AISummarizeEvent } from '@/core/ai/components/AskAIPanel'

const AIStore = {
  updateMetaSummary: async (metaId: number, summary: string) => {
    const currentMeta = await MetaStore.getMetaObjectById(metaId)
    if (currentMeta) {
      const newMeta = produce(currentMeta, draft => {
        draft.properties = {
          ...draft.properties,
          'AI summary': {
            propType: 'string',
            value: summary
          }
        }
      })
      return await MetaStore.updateMetaObject(newMeta, true)
    }
  },
  updateMetaAI: async (metaId: number, e: AISummarizeEvent) => {
    return await MetaStore.addAIForMeta(metaId, {
      questions: e.questions.map(i => i.id),
      summary: e.summary
    })
  },
  updateMetaQuestions: async (metaId: number, questionIds: number[]) => {
    const currentMeta = await MetaStore.getMetaObjectById(metaId)
    if (currentMeta) {
      const newMeta = produce(currentMeta, draft => {
        const questionsProp = draft.properties?.find(i => i.propName === 'AI questions')
        if (!questionsProp) {
          draft.properties = [
            ...(draft.properties || []),
            {
              propName: 'AI questions',
              value: questionIds,
              propType: 'number array'
            }
          ]
        } else {
          const idx = draft.properties?.findIndex(i => i.propName === 'AI questions')
          if (idx !== undefined && idx >= 0) {
            draft.properties![idx].value = questionIds
          }
        }
      })
      MetaStore.updateMetaObject(newMeta, true)
    }
  }
}

export default AIStore
