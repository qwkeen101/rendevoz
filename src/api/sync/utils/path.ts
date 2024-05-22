export const pathJoin = (parts: string[], sep = '/') => parts.join(sep).replace(new RegExp(sep + '{1,}', 'g'), sep)

export const pathNormalize = (str: string, leading?: boolean, trailing?: boolean) => {
  if (leading && !str.startsWith('/')) {
    str = '/' + str
  }
  if (trailing) {
    if (str !== '/' && !str.endsWith('/')) {
      str = str + '/'
    }
  }
  return pathJoin([str])
}
export const pathRemoveLeadingSlash = (str: string) => {
  if (!str.startsWith('/')) return str
  return str.replace(/^\/+/g, '')
}
export const pathRemoveLeading = (str: string, leading: string, removeLeadingSlash = true) => {
  str = pathNormalize(str, true)
  if (leading) {
    str = str.replace(new RegExp(leading), '')
  }
  // merge multiple slashs
  str = str.replace(/\/+/g, '/')
  if (removeLeadingSlash && str.startsWith('/')) {
    str = pathRemoveLeadingSlash(str)
  }
  return str
}

export const getDirPath = (str: string) => {
  return str.split('/').slice(0, -1).join('/')
}
