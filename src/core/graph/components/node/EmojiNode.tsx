import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { TypeToNodeRadius } from './Node'
import { useMemo } from 'react'
import getEmoji from '@/utils/emoji'
import Colors from '@/consts/colors'

const EmojiNode = ({ node, label }: { node: GraphNode & { icon: string }; label?: string }) => {
  const emoji = useMemo(() => getEmoji(node.icon), [node.icon])
  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = radius * 2

  return (
    <>
      <motion.foreignObject
        style={{ transformOrigin: `${radius}px ${radius}px` }}
        width={d}
        height={d}
        initial={{ scale: 1 }}
        animate={{ scale: node.scale }}
      >
        <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {emoji && (
            <img
              src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${emoji.imageSrc})`,
                backgroundPositionX: `${(emoji.x * 100) / 60}%`,
                backgroundPositionY: `${(emoji.y * 100) / 60}%`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '6100% 6100%',
                verticalAlign: '-0.1em'
              }}
            />
          )}
        </div>
      </motion.foreignObject>
      <text
        transform={`translate(${radius}, ${d})`}
        textAnchor="middle"
        fontWeight={600}
        fontSize="calc(var(--zoom-level) * 16px)"
        fill={Colors.Font.Primary}
        dy="1.6em"
      >
        {label || node.label}
      </text>
    </>
  )
}

export default EmojiNode
