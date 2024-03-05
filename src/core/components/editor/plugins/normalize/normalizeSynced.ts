import { SyncedBlockElement } from '~/typings/components/editor/outerElements'
import { Path, Transforms } from 'slate'
import { CustomEditor } from '~/typings'
import Id from '@/utils/id'

export default (node: SyncedBlockElement, path: Path, editor: CustomEditor) => {
  console.log(node)
  if (node.children.length === 0) {
    Transforms.insertNodes(
      editor,
      {
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: '' }]
      },
      { at: [...path, 0] }
    )
  }
}
