import emojiJson from '@/assets/emoji.json?raw'
import twitterEmoji from '@/assets/twitter-emoji-32.png'

export type Emoji = {
  name: string
  x: number
  y: number
  shortName: string
}

const emojiMap = new Map<string, Emoji>(JSON.parse(emojiJson).map(i => [i.shortName, i]))
export const getEmoji = (name: string) => {
  const emoji = emojiMap.get(name)
  if (emoji) {
    return {
      x: emoji.x,
      y: emoji.y,
      imageSrc: twitterEmoji,
      name
    }
  }
}

export default getEmoji
