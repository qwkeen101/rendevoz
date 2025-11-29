import { MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Content } from '@/components'

const FromCell = ({ value }: { value: MetaObject['fromObject'] }) => {
  const meta = MetaStore.useValue(value?.metaId)
  if (!meta) return null
  return (
    <Content
      flex
      gap={6}
      alignItems="center"
      role={'prop-container'}
      onClick={() => {
        Global.layoutOps?.openObject(meta.id)
      }}
    >
      {meta.coverImgSrc && <img src={meta.coverImgSrc} width={24} height={24} style={{ borderRadius: 4, objectFit: 'cover' }} />}
      <div style={{ fontWeight: 500 }}>{meta.name}</div>
    </Content>
  )
}

export default FromCell
