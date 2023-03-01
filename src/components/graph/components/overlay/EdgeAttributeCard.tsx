import { ColorPicker, WithBorder } from '@/components'
import { IconWithPopover, Toolbar } from '@/components/base'
import BorderInput from '@/components/base/BorderInput'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { metaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useMemo } from 'react'
import useEdges from '../../hooks/useEdges'
import { GraphEdge } from '../../types/edge'

const EdgeAttributeCard = ({ currentEdge }: { currentEdge?: GraphEdge }) => {
  const [edges, setEdges] = useEdges()
  const { updateMetaLink, deleteMetaLink } = metaStore
  const originEdgeIdx = useMemo(() => edges?.findIndex(i => i.id === currentEdge?.id), [edges, currentEdge?.id])
  const updateEdge = useMemoizedFn((edge: Partial<GraphEdge>) => {
    if (originEdgeIdx !== undefined && edges) {
      const originEdge = edges[originEdgeIdx]
      const newEdge = Object.assign({}, originEdge, edge)
      edges &&
        setEdges(
          produce(edges, draft => {
            draft[originEdgeIdx] = newEdge
          })
        )
      console.log(newEdge)
      debouncedUpdateLink({
        id: newEdge.id,
        color: newEdge.color,
        label: newEdge.label
      })
    }
  })
  const { run: debouncedUpdateLink } = useDebounceFn(updateMetaLink, { wait: 1000 })
  return (
    <Toolbar>
      <Toolbar.Item>
        <IconWithPopover
          name="park-edit"
          content={
            <WithBorder style={{ width: 200 }}>
              <BorderInput
                style={{ height: 40 }}
                onChange={e => {
                  updateEdge({ label: e })
                }}
                placeholder="Edge label"
              ></BorderInput>
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item>
        <IconWithPopover
          name="park-background-color"
          content={
            <WithBorder style={{ width: 240, padding: 4 }}>
              <div className={ClassName.description()} style={{ marginBottom: 4, marginLeft: 4 }}>
                Choose edge color
              </div>
              <ColorPicker
                enableDefault={false}
                enableMore
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
        iconName="park-delete"
        onClick={() => {
          setEdges(edges =>
            produce(edges, draft => {
              const idx = edges?.findIndex(i => i.id === currentEdge?.id)
              draft?.splice(idx, 1)
            })
          )
          currentEdge?.id && deleteMetaLink(currentEdge?.id)
        }}
      ></Toolbar.Item>
    </Toolbar>
  )
}
export default EdgeAttributeCard
