import { CSSProperties, useMemo } from 'react'
import getEmoji from '../../utils/emoji'
import { AnimatePopover } from '@/components'

export default ({
  name,
  withPicker,
  onChange,
  style
}: {
  name: string
  withPicker?: boolean
  onChange: (newName: string) => void
  style?: CSSProperties
}) => {
  const emoji = useMemo(() => (name ? getEmoji(name) : undefined), [name])
  if (!emoji) return null
  const renderEmoji = () => (
    <img
      src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
      style={{
        width: '1em',
        height: '1em',
        backgroundImage: `url(${emoji.imageSrc})`,
        backgroundPositionX: `${(emoji.x * 100) / 60}%`,
        backgroundPositionY: `${(emoji.y * 100) / 60}%`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '6100% 6100%',
        verticalAlign: '-0.1em'
      }}
    />
  )

}
