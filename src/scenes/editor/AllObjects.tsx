import { Content } from '@/components'
import { useRenderObject } from '@/core'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import { EditorObjectsAtom } from './useEditorFilter'
import { Path } from 'slate'
import { CustomEditor } from '~/typings'
import { useMemoizedFn } from '@/hooks'
import { highlightMeta, goToBlock } from '@/core/editor/utils'

const AllObjects = ({ editor }: { editor: CustomEditor }) => {
  const allObjects = useAtomValue(EditorObjectsAtom)
  //   const {} = useVirtualizer({
  //     count: allObjects?.length
  //   })
  const handleJump = useMemoizedFn((blockId: number) => {
    goToBlock(blockId, editor).then(() => {
      highlightMeta(blockId, editor)
    })
  })
  return (
    <Content
      flex
      column
      gap={10}
      style={{
        height: '100%',
        overflowY: 'overlay',
        paddingRight: 10
      }}
    >
      {allObjects?.map(i => (
        <ObjectItem key={i[0].id} metaId={i[0].originId} onJump={() => handleJump(i[0].id)} />
      ))}
    </Content>
  )
}

const ObjectItem = memo(({ metaId, onJump }: { metaId: number; onJump: VoidFunction }) => {
  const { renderTags, renderTitle, renderPopover, metaObject } = useRenderObject({ metaObjectId: metaId })

  if (!metaObject) return null
  return (
    <Content flex gap={10} justifyContent="space-between">
      <Content flex column>
        {renderTags({})}
        {renderTitle({
          style: {
            fontSize: 14
          }
        })}
      </Content>
      {renderPopover({
        position: 'right',
        align: 'start',
        visibility: {
          jumpToVisible: true
        },
        onJump
      })}
    </Content>
  )
})

export default AllObjects
