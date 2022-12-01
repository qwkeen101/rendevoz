import { Icon } from '@/components'
import { motion } from 'framer-motion'
import { GraphNode } from '../../types/node'

const IconNode = ({ node }: { node: GraphNode }) => {
  return (
    <>
      <foreignObject clipPath={`url(#circleClip)`} width={40} height={40}>
        <div
          style={{
            background: '#F3EFE0',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: ' rgba(149, 157, 165, 0.2) 0px 8px 24px'
          }}
        >
          <Icon fill="#393E46" size={30} name={node.type === 'note' ? 'park-notes' : 'park-file-pdf-one'} />
        </div>
      </foreignObject>
      <motion.text
        initial={{ x: 20, y: 55 }}
        animate={{ y: 55 * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {node.label}
      </motion.text>
    </>
  )
}

export default IconNode
