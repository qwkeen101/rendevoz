import { MetaObject } from '~/typings'
import { MetaStore } from '@/stores'
import { Content, Image } from '@/components'
import { ClassName } from 'rendevoz'

const FromCell = ({ value }: { value: MetaObject['fromObject'] }) => {
  const meta = MetaStore.useValue(value?.metaId)
  if (!meta) return null
  return (
    <Content flex gap={6} alignItems="center">
      {meta.coverImgSrc && <Image src={meta.coverImgSrc} preview width={20} />}
      <div className={ClassName.ellipsisFont(1)}>{meta.name}</div>
    </Content>
  )
}

export default FromCell
