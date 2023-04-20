import { Icon } from '@/components'
import { motion } from 'framer-motion'
import { GraphNode } from '../../types/node'
import { TypeToNodeRadius } from './Node'
import Colors from '@/consts/colors'
import { MarkerColor } from '@/consts'

const getIcon = (type: string) => {
  switch (type) {
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
    case 'pdf':
      return 'park-file-pdf'
    default:
      return 'park-bookmark-one'
  }
}
const IconNode = ({ node, label }: { node: GraphNode; label?: string }) => {
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
          {node.type !== 'normal' && <Icon fill="#393E46" size={d - 20} name={getIcon(node.type)} />}
        </div>
      </motion.foreignObject>
      <text
        style={{
          transform: `translateX(${radius}px) translateY(calc(${15}px * var(--zoom-level) + ${d}px))`
        }}
        textAnchor="middle"
        fontWeight={600}
        fill={node.isCenter ? MarkerColor.EMPHASIS : Colors.Font.Primary}
        fontSize="calc(var(--zoom-level) * 12px)"
      >
        {label || node.label}
      </text>
    </>
  )
}

export default IconNode
