export default (
  text: string,
  options?: {
    chunkSize: number
    chunkOverlap: number
    separators: string[]
    keepSeparator: boolean
    lengthFunction: (t: any) => number
  }
) => {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '。', '！', '？', '.', '!', '?', '，', ',', ' '],
    keepSeparator = false,
    lengthFunction = t => t.length
  } = options || {}

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be smaller than chunkSize')
  }

  const splitOnSeparator = (text, sep, keepSep) => {
    if (!sep) return text.split('')
    if (!text.includes(sep)) return [text]
    if (keepSep) {
      const escaped = sep.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
      return text.split(new RegExp(`(?=${escaped})`))
    }
    return text.split(sep)
  }

  const mergeSplits = (splits, sep) => {
    const chunks = []
    let currentChunk = []
    let totalLength = 0

    for (let i = 0; i < splits.length; i++) {
      const part = splits[i]
      const partLen = lengthFunction(part)
      const sepLen = sep.length

      if (totalLength + partLen + currentChunk.length * sepLen > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(sep).trim())
        }

        // 滑动窗口保持 chunkOverlap 的上下文
        while (totalLength > chunkOverlap && currentChunk.length > 0) {
          totalLength -= lengthFunction(currentChunk[0])
          currentChunk.shift()
        }
      }

      currentChunk.push(part)
      totalLength += partLen
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(sep).trim())
    }

    return chunks
  }

  const splitRecursively = (text, seps) => {
    if (lengthFunction(text) <= chunkSize) return [text]

    let chosenSep = ''
    let nextSeps = []

    for (let i = 0; i < seps.length; i++) {
      if (text.includes(seps[i])) {
        chosenSep = seps[i]
        nextSeps = seps.slice(i + 1)
        break
      }
    }

    const splits = splitOnSeparator(text, chosenSep, keepSeparator)
    let subChunks = []

    let buffer = []

    for (const part of splits) {
      if (lengthFunction(part) < chunkSize) {
        buffer.push(part)
      } else {
        if (buffer.length > 0) {
          subChunks.push(...mergeSplits(buffer, chosenSep))
          buffer = []
        }
        if (nextSeps.length > 0) {
          subChunks.push(...splitRecursively(part, nextSeps))
        } else {
          subChunks.push(part) // 无法再分，直接返回
        }
      }
    }

    if (buffer.length > 0) {
      subChunks.push(...mergeSplits(buffer, chosenSep))
    }

    return subChunks
  }

  return splitRecursively(text, separators)
}
