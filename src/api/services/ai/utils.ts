import { CoreMessage } from 'ai'

export const parseEvent = (eventStr: string) => {
  const event: {
    id?: string
    data?: string
    event?: string
  } = {}
  const lines = eventStr.split('\n')

  lines.forEach(line => {
    const [field, ...rest] = line.split(':')
    const value = rest.join(':').trim()

    if (field === 'data') {
      event.data = (event.data || '') + value // 处理多行 data 字段
    } else if (field === 'event') {
      event.event = value
    } else if (field === 'id') {
      event.id = value
    }
  })

  return event
}

const normalizeAIQueryContent = async (query: CoreMessage['content'], removeImage?: boolean) => {
  if (!query) return ''
  let normalizedQuery = query
  if (typeof query !== 'string' && Array.isArray(query)) {
    try {
      normalizedQuery = await Promise.all(
        query.map(async q => {
          if (q.type === 'image') {
            if (removeImage) throw ''
            const url = q.image
            const file = typeof url === 'string' ? await fetch(url).then(res => res.blob()) : url
            const base64Url = await new Promise((res, rej) => {
              const reader = new FileReader()
              reader.onload = () => res(reader.result)
              reader.readAsDataURL(file)
              reader.onerror = rej
            })
            return { ...q, image: base64Url as string }
          }
          return q
        })
      )
    } catch (e) {
      const text = query.find(i => i.type === 'text')
      normalizedQuery = text?.text || ''
    }
  }
  return normalizedQuery as CoreMessage['content']
}

export const normalizeAIQuery = async (query: string | CoreMessage[]): Promise<CoreMessage[]> => {
  if (typeof query === 'string')
    return [
      {
        role: 'user',
        content: query
      }
    ]
  const normalizedMessages = await Promise.all(
    query.map(async (m, idx, arr) => ({
      ...m,
      content: await normalizeAIQueryContent(m.content, arr[idx + 1]?.role === 'assistant' && idx + 1 < arr.length - 1 ? true : false)
    }))
  )
  return normalizedMessages
}

export const normalizeEasyMessagesToStandard = (query: string | CoreMessage[]): CoreMessage[] => {
  if (typeof query === 'string')
    return [
      {
        role: 'user',
        content: query
      }
    ]
  return query
}
