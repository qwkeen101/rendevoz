import { MetaStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { IEditorInstance } from '~/typings'

export default async (questionId: number, pointerId: number) => {
  const q = await ObjectStore('question').getOneById(questionId)
  if (q && q.parentObjectId) {
    const p = q.answerPointers.find(i => i.id === pointerId)
    if (p) {
      switch (p.pointerType) {
        case 'documentBlock': {
          const doc = MetaStore.getMetaObjectByObjectId(q.parentObjectId)
          if (doc) {
            let i: IEditorInstance | undefined = undefined
            switch (doc.type) {
              case 'webpage': {
                i = (await Rendevoz.Actions.Open.Webpage.openWebpage(q.parentObjectId)).editorInstance
                break
              }
              case 'note': {
                i = await Rendevoz.Actions.Open.Editor.openEditor(q.parentObjectId)
                break
              }
            }
            if (i) {
              i.scrollToBlock?.({
                blockId: p.blockId,
                highlight: true
              })
            }
          }
          break
        }
        case 'pdfPage': {
          break
        }
      }
    }
  }
}
