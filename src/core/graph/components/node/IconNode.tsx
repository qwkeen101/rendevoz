import { GraphNode } from '../../types/node'
import { TypeToNodeRadius } from './Node'
import Colors from '@/consts/colors'

import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import SvgIconRenderer from '../icons/SvgIconRenderer'

const IconNode = ({ node, label }: { node: GraphNode; label?: string }) => {
  const radius = TypeToNodeRadius[node.type || 'normal']
  const d = radius * 2
  const icon = getIcon(node.type)

  return (
    <>
      <rect width={d} height={d} fill="#F3EFE0" clipPath="inset(0% round 6px)" />
      <SvgIconRenderer fill="#393e46" icon={icon} size={d - 12} x={6} y={6} />
      <text
        transform={`translate(${radius}, ${d})`}
        textAnchor="middle"
        fontWeight={600}
        fill={Colors.Font.Primary}
        fontSize="calc(var(--zoom-level) * 16px)"
        dy="1.6em"
      >
        {label || node.label}
      </text>
    </>
  )
}

export default IconNode
