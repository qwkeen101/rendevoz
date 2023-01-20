import { Icon } from '@/components'
import { motion } from 'framer-motion'
import { MarkerColor } from '../../consts/markerColors'
import { GraphNode } from '../../types/node'
import { TypeToNodeRadius } from './Node'

const IconNode = ({ node, label }: { node: GraphNode; label?: string }) => {
  const getIcon = () => {
    switch (node.type) {
      case 'note':
        return 'park-notes'
      case 'pdfElement':
        return 'park-align-text-left'
      default:
        return 'park-notes'
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
            borderRadius: 10,
            justifyContent: 'center',
            boxShadow: ' rgba(149, 157, 165, 0.2) 0px 8px 24px'
          }}
        >
          <Icon fill="#393E46" size={d - 20} name={getIcon()} />
        </div>
      </motion.foreignObject>
      <motion.text
        initial={{ x: radius, y: d + 5 }}
        animate={{ y: (d + 15) * (node.scale ? (node.scale === 1 ? 1 : node.scale * 0.9) : 1) }}
        textAnchor="middle"
        fontWeight={600}
        fontSize={12}
      >
        {label || node.label}
      </motion.text>
      {node.isCenter && (
        <motion.circle
          style={{ transformOrigin: `${radius}px ${radius}px` }}
          fill="none"
          stroke={MarkerColor.EMPHASIS}
          strokeWidth="2"
          initial={{ scale: 1 }}
          animate={{ scale: node.scale }}
          cx={radius}
          cy={radius}
          r={radius}
        >
          <animate
            attributeName="r"
            repeatCount="indefinite"
            dur="1s"
            // values="20;50"
            values={`${radius}; ${d + 10}`}
            keyTimes="0;1"
            keySplines="0 0.2 0.8 1"
            calcMode="spline"
            begin="0s"
          ></animate>
          <animate
            attributeName="opacity"
            repeatCount="indefinite"
            dur="1s"
            values="0.8;0"
            keyTimes="0;1"
            keySplines="0 0.2 0.8 1"
            calcMode="spline"
            begin="0s"
          ></animate>
        </motion.circle>
      )}
    </>
  )
}

export default IconNode
