import { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import { Content } from '@/components'
import CodeHeader from '@/core/components/code/CodeHeader'
import CodeEditor from '@/core/components/code/CodeEditor'

const Inner = memo(({ id }: { id: number }) => {
  const code = ObjectStore('code').useValue(id)

  return (
    <Content flex column fullWidth fullHeight style={{ overflowY: 'auto', fontSize: 14 }}>
      <CodeHeader id={id} />
      <CodeEditor
        value={code?.content}
        onChange={v => {
          ObjectStore('code').updateOne({ id: id, content: v })
        }}
        language={code?.language}
      />
    </Content>
  )
})

export default memo(({ id }: { id: number }) => {
  const code = ObjectStore('code').useValue(id)
  return <Inner id={id} />
})
