import FileSystem from '@/api/fileSystem'
import { ISystemFile } from '~/typings/fs'

const LocalFileSizeMap = new Map<string, number>()
export const initializeFileSizeMap = async (dirName: string) => {
  const allFiles = await FileSystem.fs.readdir(dirName)
  allFiles.files.forEach(f => {
    LocalFileSizeMap.set(`${dirName}/${f.name}`, f.size)
  })
}
export default async (dirName: string, lastUploaded?: number) => {
  const allFiles = await FileSystem.fs.readdir(dirName)
  const leftFiles = lastUploaded ? allFiles.files.filter(i => i.mtime > lastUploaded) : allFiles.files
  const finalFiles = leftFiles.filter(i => {
    const prev = LocalFileSizeMap.get(`${dirName}/${i.name}`)
    if (!prev || prev !== i.size) {
      return true
    }
    return false
  })
  allFiles.files.forEach(f => {
    LocalFileSizeMap.set(`${dirName}/${f.name}`, f.size)
  })
  return finalFiles as ISystemFile[]
}
