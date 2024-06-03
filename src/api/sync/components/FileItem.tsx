import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import SyncAPI from '@/api/sync'
import { formatBytes } from '@/utils/fetchProcess'

export default ({
  item,
  type
}: {
  item: { error?: boolean; skiped?: boolean; name: string; progress: number; size: number }
  type: 'upload' | 'download'
}) => {
  let state: 'successful' | 'error' | 'pending' | undefined = undefined
  if (item.skiped || item.error) {
    state = 'error'
  }
  if (item.progress === 1) {
    state = 'successful'
  }
  if (item.progress === 0 && !item.skiped && !item.error) {
    state = 'pending'
  }
  const errorState = state === 'error'
  const successState = state === 'successful'
  const pendingState = state === 'pending'
  return (
    <Content gap={12} flex justifyContent={'space-between'}>
      <Content flex gap={8} alignItems={'center'}>
        <Icon
          style={{
            borderRadius: 99,
            padding: 2,
            cursor: errorState ? 'pointer' : undefined,
            color: errorState ? Colors.Common.Red : Colors.Common.SelectColor,
            background: successState ? Colors.Common.SelectColorTransparentLight : 'transparent'
          }}
          onClick={() => {
            if (errorState) {
              if (type === 'upload') {
                SyncAPI.cloudClient()?.uploadFile(item.name, {
                  skipSetting: true
                })
              } else {
                SyncAPI.cloudClient()?.downloadFile(item.name)
              }
            }
          }}
          size={12}
          spin={pendingState}
          name={item.skiped ? 'park-pause' : item.error ? 'park-close' : item.progress === 1 ? 'park-check-small' : 'park-loading-four'}
        />
        <div title={item.name} className={'ellipsis-font-1 font-size-12'}>
          {item.name.split('/')[1]}
        </div>
      </Content>

      <div style={{ flexShrink: 0 }} className={'super-transparent-font font-size-12'}>
        {formatBytes(item.size, 1)}
      </div>
    </Content>
  )
}
