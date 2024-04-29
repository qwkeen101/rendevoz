import FileSystem from '@/api/fileSystem'

export default async (dirName: string, lastUploaded?: number) => {
  const allFiles = await FileSystem.fs.readdir(dirName)
  if (lastUploaded) {
    return allFiles.files.filter(i => i.mtime > lastUploaded)
  } else {
    return allFiles.files
  }
}
