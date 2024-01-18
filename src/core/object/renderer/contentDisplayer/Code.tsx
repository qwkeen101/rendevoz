import { memo } from 'react'
import Code from '@/core/components/code'

function CodeDisplayer({ id }: { id: number }) {
  return (
    <Code
      layout={{
        header: false,
        maxLines: 25
      }}
      styles={{
        contentFontSize: 10,
        contentStyle: {
          padding: '2px 4px',
          overflow: 'hidden'
        }
      }}
      id={id}
    />
  )
}

export default memo(CodeDisplayer)
