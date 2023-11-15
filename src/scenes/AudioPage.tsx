import { MetaStore } from '@/api/stores'
import { Content } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { Rendevoz } from '@/core/rendevoz'
import Audio from '@/core/media/wrappers/Audio'
import { MediaProps } from '@/core'

export default ({ audioId, onInstanceInitialized }: { audioId: number; onInstanceInitialized: MediaProps['onInstanceInitialized'] }) => {
  const audio = MetaStore.useObjectToMetaValue(audioId)
  return (
    <Content fullWidth fullHeight>
      <TabTitle title={audio?.name || 'Unnamed audio'} icon={Rendevoz.Utils.Object.getMetaObjectIcon('audio')} />
      <Audio audioId={audioId} onInstanceInitialized={onInstanceInitialized} />
    </Content>
  )
}
