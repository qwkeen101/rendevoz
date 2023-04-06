import { GraphNode } from '../../types/node'
import { motion } from 'framer-motion'
import { TypeToNodeRadius } from './Node'
import { useMemo } from 'react'
import getEmoji from '@/utils/emoji'

const EmojiNode = ({ node, label }: { node: GraphNode & { icon: string }; label?: string }) => {
  const emoji = useMemo(() => getEmoji(node.icon), [node.icon])
  const realLabel = label || node.label
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

      <motion.text
        initial={{ x: radius, y: d }}
        animate={{ y: d * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize="calc(var(--zoom-level) * 12px)"
      >
        {realLabel?.match(/.{1,40}/g)?.map(i => (
          <tspan x={0} dy="1.2em">
            {i}
          </tspan>
        ))}
      </motion.text>
    </>
  )
}

export default EmojiNode
