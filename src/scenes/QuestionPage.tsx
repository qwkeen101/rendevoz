import { Content, Icon } from '@/components'
import QuestionCard from '@/core/ai/components/question/QuestionCard'
import { ObjectStore } from '@/api/stores'
import { TabTitle } from '@/core/rendevoz/components'
import { Rendevoz } from '@/core/rendevoz'
import { memo } from 'react'

export default memo(({ id }: { id: number }) => {
  const q = ObjectStore('question').useValue(id)
  return (
    <Content
      flex
      fullHeight
      fullWidth
      style={{
        overflowY: 'auto',
        padding: 24
      }}
    >
      <TabTitle title={q?.name || 'Unnamed question'} icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('question')} />} />
      <QuestionCard
        containerStyle={{
          margin: 'auto',
          minWidth: 'min(400px,90%)',
          maxWidth: '800px'
        }}
        display={{
          from: true
        }}
        pointerEllipsis={0}
        id={id}
      />
    </Content>
  )
})
