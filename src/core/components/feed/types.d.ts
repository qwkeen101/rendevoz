import { INews } from '~/typings'
export type FeedItem = {
  id: number
  title: string
  // google news link, not real link
  link: string
  // image url
  image?: string
  content?: string
  description?: string
  state?: {
    title?: string
    domain?: string
    author?: string
    // pre parsed / already parsed content, cache it
    content?: import('slate').Descendant[]
  }
}

export { INews }
