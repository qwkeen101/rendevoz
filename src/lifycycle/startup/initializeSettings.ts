import { useDb } from '@/hooks'
import { CurrentKeyValues } from '@/stores/keyvalue.store'

const putIfNotExist = async (key: string, value: any) => {
  const db = useDb('keypairs')
  const existed = await db.get(key)
  if (existed) return
  await db.put(key, value)
}

export const DefaultEditorSettings: CurrentKeyValues['editorSettings'] = {
  editMode: {
    typeface: 'Inter',
    fontSize: 15,
    lineSpacing: 1.3,
    pageWidth: 'Medium'
  },
  readerMode: {
    pageWidth: 'Medium',
    typeface: 'Merriweather',
    fontSize: 18,
    lineSpacing: 1.6
  }
}
export default async () => {
  await putIfNotExist('editorSettings', DefaultEditorSettings)
}
