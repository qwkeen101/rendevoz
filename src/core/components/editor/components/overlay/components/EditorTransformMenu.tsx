import getEditorTransformMenu from '@/core/components/editor/components/overlay/components/getEditorTransformMenu'
import { Menu, WithBorder } from '@/components'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { Transforms } from 'slate'
import { Colors } from '@/consts'

export default () => {
  const instance = useEditorInstance()
  const menuItems = getEditorTransformMenu(type => {
    const currentBlock = instance.blockOps?.getAboveBlock()
    instance.overlayOps?.close()
    console.log(currentBlock)
    if (currentBlock) {
      const editor = instance.getSlateEditor?.()
      if (editor) {
        Transforms.setNodes(
          editor,
          {
            type
          },
          {
            at: currentBlock[1]
          }
        )
      }
    }
  })
  return (
    <WithBorder padding={'0.25rem 0'} width={180}>
      <Menu.NavigationMenu layout={menuItems} />
    </WithBorder>
  )
}
