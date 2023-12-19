import { IImportResult } from '@/core/rendevoz/utils/types'
import { IAudio } from '~/typings'
import FileSystem from '@/api/fileSystem'

export default async (file: File): Promise<IImportResult<IAudio>> => {
  const filePath = await FileSystem.copyFile(file.path, file.name)
  return {
    object: {
      url: filePath
    },
    meta: {
      name: file.name,
      type: 'audio'
    }
  }
}
