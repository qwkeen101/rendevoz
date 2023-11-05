import { MetaObject } from '~/typings'
import { MetaStore } from '@/stores'
import { Content, Image } from '@/components'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'

const FromCell = ({ value }: { value: MetaObject['fromObject'] }) => {
  const meta = MetaStore.useValue(value?.metaId)
  if (!meta) return null
  return (
    <Content
      flex
      gap={6}
      alignItems="center"
      onClick={() => {
        Rendevoz.Actions.Open.Meta.openMetaObject(meta.id)
      }}
    >
      {meta.coverImgSrc && <img src={meta.coverImgSrc} width={24} height={24} style={{ borderRadius: 4, objectFit: 'cover' }} />}
      <div style={{ fontWeight: 600 }}>{meta.name}</div>
    </Content>
  )
}

export default FromCell
