import { CSSProperties, memo } from 'react'
import { MetaObject } from '~/typings'
import { useRenderLabel } from '@/core'

export type OriginalTextRendererProps = {
  name?: string
  objectId: number
  type: MetaObject['type']
  style?: CSSProperties
  showEdit?: boolean
  ellipis?: boolean
  onClick?: VoidFunction
  editorStyle?: CSSProperties
}
export default memo(({ objectId, style, showEdit, ellipis, editorStyle, type, name, onClick }: OriginalTextRendererProps) => {
  const { renderOriginalText, label } = useRenderLabel({ objectId: objectId, type })
  if (!label?.selectedText || label.selectedText === name) return null
  return renderOriginalText({
    text: label.selectedText,
    style,
    onClick,
    showEdit,
    ellipis,
    editorStyle
  })
})
