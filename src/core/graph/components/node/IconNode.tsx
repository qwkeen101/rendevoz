import { Icon } from '@/components'
import { motion } from 'framer-motion'
import { GraphNode } from '../../types/node'
import { TypeToNodeRadius } from './Node'
import Colors from '@/consts/colors'

const IconNode = ({ node, label }: { node: GraphNode; label?: string }) => {
  const getIcon = () => {
    switch (node.type) {
      case 'note':
        return 'park-notes'
      case 'pdfLabel':
        return 'park-align-text-left'
      case 'noteBlock':
        return 'park-text-style-one'
      case 'whiteboard':
        return 'park-new-computer'
      case 'webpage':
        return 'park-web-page'
      default:
        return 'park-bookmark-one'
    }
  }

  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = radius * 2
  return (
    <>
      <motion.foreignObject initial={{ scale: 1 }} animate={{ scale: node.scale }} width={d} height={d}>
        <div
          style={{
            background: '#F3EFE0',
            width: d,
            height: d,
            display: 'flex',
            alignItems: 'center',
            borderRadius: node.type === 'normal' ? 999 : 10,
            justifyContent: 'center'
          }}
        >
          {node.type !== 'normal' && <Icon fill="#393E46" size={d - 20} name={getIcon()} />}
        </div>
      </motion.foreignObject>
      <motion.text
        initial={{ x: radius, y: d + 5 }}
        animate={{ y: (d + 15) * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fill={Colors.Font.Primary}
        fontSize="calc(var(--zoom-level) * 12px)"
      >
        {label || node.label}
      </motion.text>
    </>
  )
}

export default IconNode
