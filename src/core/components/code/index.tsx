import { CSSProperties, memo } from 'react'
import { ObjectStore } from '@/api/stores'
import { Content } from '@/components'
import CodeHeader from '@/core/components/code/CodeHeader'
import CodeEditor from '@/core/components/code/CodeEditor'

type Props = {
  id: number
  layout?: {
    header?: boolean
    maxLines?: number
  }
  styles?: {
    contentFontSize?: number
    contentStyle?: CSSProperties
  }
}
const Inner = memo(({ id, layout, styles }: Props) => {
  const code = ObjectStore('code').useValue(id)

  return (
    <Content flex column fullWidth fullHeight style={{ overflowY: 'auto', fontSize: 14 }}>
      {layout?.header !== false && <CodeHeader id={id} />}
      <CodeEditor
        value={layout?.maxLines ? code?.content.split('\n').slice(0, layout.maxLines).join('\n') : code?.content}
        onChange={v => {
          ObjectStore('code').updateOne({ id: id, content: v })
        }}
        style={{
          fontSize: styles?.contentFontSize,
          ...styles?.contentStyle
        }}
        language={code?.language}
      />
    </Content>
  )
})

export default memo((props: Props) => {
  return <Inner {...props} />
})
