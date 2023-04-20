import Actions from '@/core/Actions'
import { useRenderObject } from '@/core/database'
import { GlobalGraphInstance } from '../..'
import useGraph from '../../hooks/useGraph'
import { Content, IconWithPopover, Toolbar } from '@/components'
import { useAtom } from 'jotai'
import { GraphPinNodesIdsAtom } from '../../hooks/useGraphFilter'
import produce from 'immer'
import { GlobalEventEmitter } from '@/events'

const NodePopover = ({ metaId, nodeId, onClose }: { metaId: number; nodeId: number; onClose: VoidFunction }) => {
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })
  const graph = useGraph()
  const [pinnedIds, setPinnedIds] = useAtom(GraphPinNodesIdsAtom)
  return (
    <Content flex gap={12} alignItems="flex-start">
      {renderWhole({
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
      })}
      <IconWithPopover
        name="park-config"
        content={
          <Toolbar style={{ justifyContent: 'flex-start', height: 'auto', padding: 6 }}>
            <Toolbar.Item
              style={{
                color: pinnedIds.has(nodeId) ? 'yellow' : undefined
              }}
              tooltip="Pin"
              iconName="park-pin"
              onClick={() => {
                setPinnedIds(p =>
                  produce(p, draft => {
                    draft.has(nodeId) ? draft.delete(nodeId) : draft.add(nodeId)
                  })
                )
              }}
            />
            <Toolbar.Item
              tooltip="Edit"
              iconName="park-edit"
              onClick={() => {
                onClose()
                GlobalEventEmitter().emit('global', {
                  type: 'globalNeedEditMetaObject',
                  data: {
                    metaObjectId: metaId
                  }
                })
              }}
            />
          </Toolbar>
        }
      ></IconWithPopover>
    </Content>
  )
}

export default NodePopover
