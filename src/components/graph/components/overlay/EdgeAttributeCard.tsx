import { ColorPicker, WithBorder } from '@/components'
import { IconWithPopover, Toolbar } from '@/components/base'
import BorderInput from '@/components/base/BorderInput'
import { useDebounceFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import useEdges from '../../hooks/useEdges'
import { GraphEdge } from '../../types/edge'

const EdgeAttributeCard = ({ currentEdge }: { currentEdge?: GraphEdge }) => {
  const [edges, setEdges] = useEdges()
  const { updateMetaLink, deleteMetaLink } = useMetaStore()

  const updateEdge = (edge: Partial<GraphEdge>) => {
    const originEdge = edges?.find(i => i.id === currentEdge.id)
    const newEdge = Object.assign({}, originEdge, edge)
    edges &&
      setEdges(
        produce(edges, draft => {
          const idx = draft?.findIndex(i => i.id === currentEdge.id)
          idx > -1 && (draft[idx] = newEdge)
        })
      )
    updateMetaLink({
      id: currentEdge.id,
      color: edge.color,
      label: edge.label
    })
  }
  const { run: debouncedUpdateEdge } = useDebounceFn(updateEdge, { wait: 1000 })
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
                  debouncedUpdateEdge({ label: e })
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
                  debouncedUpdateEdge({
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
