import { Rendevoz } from '@/core/rendevoz'

export default (changedIds: number[]) => {
  Rendevoz.Events.Emit.emitEventGlobally('editor', {
    type: 'refreshFromValue',
    data: {
      noteId: changedIds
    }
  })
}
