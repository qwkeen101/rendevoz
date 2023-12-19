import { Content } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { memo } from 'react'

export default memo(({ summary, onChange }: { summary: string; onChange?: (v: string) => void }) => {
  return (
    <Content style={{ marginBottom: 12, fontSize: 14 }}>
      <div
        style={{
          fontSize: 13,
          color: Colors.Font.Transparent,
          marginBottom: 4
        }}
      >
        Summary
      </div>
      <div>{summary}</div>
    </Content>
  )
})
