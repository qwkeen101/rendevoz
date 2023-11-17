import { Content } from '@/components'
import { useRenderObject } from '@/core'
import { useAtomValue } from 'jotai'
import { memo } from 'react'
import { EditorObjectsAtom } from './useEditorFilter'
import { CustomEditor } from '~/typings'
import { useMemoizedFn } from '@/hooks'
import { goToBlock, highlightMeta } from '@/core/components/editor/utils'
import FontSize from '@/consts/font'

const AllObjects = ({ editor }: { editor: CustomEditor }) => {
  const allObjects = useAtomValue(EditorObjectsAtom)

  const handleJump = useMemoizedFn((blockId: number) => {
    goToBlock(blockId, editor).then(() => {
      highlightMeta(blockId, editor)
    })
  })
  return (
    <Content
      flex
      column
      gap={8}
      style={{
        height: '100%',
        overflowY: 'overlay',
        paddingRight: 6
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
    <Content flex gap={8} justifyContent="space-between">
      <Content flex column>
        {renderTags({})}
        {renderTitle({
          style: {
            fontSize: FontSize['12px']
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
