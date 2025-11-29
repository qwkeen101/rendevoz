import { atom } from 'jotai/index'
import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { Colors } from '@/consts'
import useGraphNodes from '@/core/components/graph/hooks/useGraphNodes'
import { MetaStore, ObjectStore } from '@/api/stores'

const GraphColorAtom = atom<{
  colorBy?: 'type' | 'tag'
  types: Map<string, string>
}>({
  types: new Map()
})
const useGraphColor = (typeToNodes: { name: string; items: number[] }[]) => {
  const [nodes, setNodes] = useGraphNodes()
  const [color, setColor] = useAtom(GraphColorAtom)
  useEffect(() => {
    const typeMap = color.types
    const colors = Colors.getRandomColors(typeToNodes.length)
    typeToNodes.forEach((entry, idx) => {
      if (!typeMap.has(entry.name)) {
        typeMap.set(entry.name, colors[idx])
      }
    })
    setColor(s => ({ ...s, types: new Map(typeMap) }))
  }, [typeToNodes])
  useEffect(() => {
    const typeMap = color.types
    if (!color.colorBy) {
      if (nodes.some(i => i.color)) {
        setNodes(curr => {
          return curr.map(i => {
            return i.color ? { ...i, color: undefined } : i
          })
        })
      }
    } else if (color.colorBy === 'type') {
      setNodes(curr => {
        return curr.map(i => {
          const type = MetaStore.getCachedMetaObject(i.id)?.type
          if (type) {
            return { ...i, color: typeMap.get(type) }
          }
          return i.color ? { ...i, color: undefined } : i
        })
      })
    } else if (color.colorBy === 'tag') {
      setNodes(curr => {
        return curr.map(i => {
          const tags = MetaStore.getCachedMetaObject(i.id)?.tags
          if (tags) {
            let color = undefined
            tags.some(i => {
              const c = ObjectStore('tag').getCachedOneById(i)?.color
              if (c) {
                color = c
                return true
              }
            })
            return { ...i, color }
          }
          return i.color ? { ...i, color: undefined } : i
        })
      })
    }
  }, [color.colorBy, nodes.length])
}

useGraphColor.atom = GraphColorAtom
export default useGraphColor as typeof useGraphColor & {
  atom: typeof GraphColorAtom
}
