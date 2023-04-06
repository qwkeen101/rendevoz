import Actions from '@/core/Actions'
import { useRenderObject } from '@/core/database'
import { GlobalGraphInstance } from '../..'
import useGraph from '../../hooks/useGraph'

const NodePopover = ({ metaId }: { metaId: number }) => {
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })
  const graph = useGraph()
  return renderWhole({
    titleOptions: {
      style: {
        fontSize: 14
      },
      onTitleClick: () => {
        Actions.navigateToTargetObject(metaId)
        GlobalGraphInstance.minimize?.()
        graph?.overlayManager?.close()
      }
    },
    descriptionOptions: {
      style: {
        fontSize: 13
      }
    },
    renderOptions: {
        renderFrom: true
    }
  })
}

export default NodePopover
