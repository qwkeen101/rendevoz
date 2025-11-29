import { IImportResult } from '.'
import { IAudio } from '~/typings'
import FileSystem from '@/api/fileSystem'
import { getFilenameWithoutExtension } from '@/utils'

export default async (file: File): Promise<IImportResult<IAudio>> => {
  const filePath = await FileSystem.saveFile(file)
  return {
    object: {
      url: filePath,
      specType: 'audio'
    },
    meta: {
      name: getFilenameWithoutExtension(file.name),
      type: 'audio'
    }
  }
}
