import { Editor, Node, Path, Transforms } from 'slate'
import TranslateService from '@/api/services/translate.service'
import { CustomEditor, IEditorInstance } from '~/typings'
import Id from '@/utils/id'
import { franc } from 'franc'
import { ID_TO_PATH_MAP } from '@/core'

const authCu = {
  token: '',
  fetched: Date.now()
}
export const LocalMicrosoftTranslate = async (query: string) => {
  const result = await fetch(
    'https://api-edge.cognitive.microsofttranslator.com/translate?from=&to=zh-Hans&api-version=3.0&includeSentenceLength=true',
    {
      method: 'POST',
      body: JSON.stringify([{ Text: query }]),
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${authCu.token}`
      }
    }
  ).then(res => res.json())
  return result[0].translations[0].text
}
const translateWholePage = async (editor: CustomEditor, instance: IEditorInstance) => {
  const value = editor.children
  authCu.token = await fetch('https://edge.microsoft.com/translate/auth').then(res => res.text())
  if (!value) return
  const title = instance.getTitle?.()
  if (title) {
    const titleTrans = await LocalMicrosoftTranslate(title)
    editor.on?.({
      type: 'titleChange',
      value: `${titleTrans} - ${title}`
    })
  }
  const firstLayerContent = value
    .map((i, idx) => ({
      id: i.id,
      index: idx,
      content: Node.string(i)
    }))
    .filter(i => {
      if (!i.content.length) return false
      const r = franc(i.content)
      console.log(r, r === 'eng')
      return r !== 'cmn'
    })
  console.log(firstLayerContent)

  const results = (
    await Promise.all(
      firstLayerContent.map(async i => {
        try {
          return {
            ...i,
            translated: await LocalMicrosoftTranslate(i.content)
          }
        } catch (e) {
          console.log(e)
          return null
        }
      })
    )
  ).filter(i => i)
  const resultsWithPathRef = results
    .map(i => {
      const path = instance.getElementPathById?.(i.id)
      if (path) {
        return { ...i, pathRef: Editor.pathRef(editor, path) }
      }
    })
    .filter(i => i)
  console.log(resultsWithPathRef, results, ID_TO_PATH_MAP.get(instance.getSlateEditor()))
  resultsWithPathRef.forEach(i => {
    const path = i.pathRef.unref()
    if (path) {
      Transforms.insertNodes(
        editor,
        {
          type: 'paragraph',
          id: Id.getId(),
          children: [{ text: i.translated }]
        },
        {
          at: Path.next(path)
        }
      )
    }
  })
}

export default translateWholePage
