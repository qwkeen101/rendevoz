import { ColorPicker, WithBorder } from '@/components'
import { IconWithPopover, Toolbar } from '@/components/base'
import BorderInput from '@/components/base/BorderInput'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { MetaStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useMemo } from 'react'
import useEdges, { oppositeEdgesMapAtom } from '../../hooks/useEdges'
import { GraphEdge } from '../../types/edge'
import { useStore } from 'jotai'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { useTranslation } from 'react-i18next'

const EdgeAttributeCard = ({ currentEdge }: { currentEdge?: GraphEdge }) => {
  const [edges, setEdges] = useEdges()
  const { updateMetaLink, deleteMetaLink } = MetaStore
  const store = useStore()
  const graph = useGraph()
  const originEdgeIdx = useMemo(() => edges?.findIndex(i => i.id === currentEdge?.id), [edges, currentEdge?.id])
  const updateEdge = useMemoizedFn((edge: Partial<GraphEdge>) => {
    if (originEdgeIdx !== undefined && edges) {
      const originEdge = edges[originEdgeIdx]
      const newEdge = Object.assign({}, originEdge, edge)
      const oppoEdgeId = store.get(oppositeEdgesMapAtom).get(originEdge.id)
      graph?.ID_TO_EDGE_FUNCTION_MAP.get(currentEdge.id)?.drawEdge()
      if (oppoEdgeId) {
        graph?.ID_TO_EDGE_FUNCTION_MAP.get(oppoEdgeId)?.drawEdge()
        updateMetaLink({ id: oppoEdgeId, color: newEdge.color, label: newEdge.label }, true)
      }
      edges &&
        setEdges(
          produce(edges, draft => {
            if (oppoEdgeId) {
              const oppoEdge = edges.findIndex(i => i.id === oppoEdgeId)
              draft[oppoEdge].color = newEdge.color
            }
            draft[originEdgeIdx] = newEdge
          })
        )
      console.log(newEdge)
      debouncedUpdateLink(
        {
          id: newEdge.id,
          color: newEdge.color,
          label: newEdge.label
        },
        true
      )
    }
  })
  const { run: debouncedUpdateLink } = useDebounceFn(updateMetaLink, {
    wait: 200
  })
  const { t } = useTranslation()
  return (
    <Toolbar
      style={{
        padding: '0px 4px'
      }}
    >
      <Toolbar.Item>
        <IconWithPopover
          name="park-edit"
          renderOnParent={true}
          content={
            <input
              spellCheck={'false'}
              defaultValue={currentEdge?.label}
              className={'focus-input border-box-shadow'}
              style={{ padding: '4px 12px', borderRadius: 4, width: '200px' }}
              onChange={e => {
                updateEdge({ label: e.target.value })
              }}
              placeholder={'Type new label'}
            ></input>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item>
        <IconWithPopover
          renderOnParent={true}
          name="park-background-color"
          content={
            <WithBorder style={{ width: 240, padding: '4px 4px 0px' }}>
              <ColorPicker
                enableDefault={false}
                showLess
                onPick={e =>
                  updateEdge({
                    color: e
                  })
                }
              />
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item
        iconName="park-delete-one"
        onClick={() => {
          currentEdge?.id && graph?.deleteEdges([currentEdge.id])
          MetaStore.deleteMetaLink(currentEdge.id, true)
        }}
      ></Toolbar.Item>
    </Toolbar>
  )
}
export default EdgeAttributeCard
