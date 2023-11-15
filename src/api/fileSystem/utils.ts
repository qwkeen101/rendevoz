export const getFilenameWithoutExtension = (name: string) => {
  return name.substr(0, name.lastIndexOf('.'))
}