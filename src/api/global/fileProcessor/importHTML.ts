import { IImportResult } from '.'
import { IWebpage } from '~/typings'
import FileSystem from '@/api/fileSystem'

export default async (file: File): Promise<IImportResult<IWebpage>> => {
  const filePath = await FileSystem.saveFile(file)
  return {
    object: {
      url: filePath,
      specType: 'webpage'
    },
    meta: {
      name: file.name.replace('.html', ''),
      type: 'webpage'
    }
  }
}
