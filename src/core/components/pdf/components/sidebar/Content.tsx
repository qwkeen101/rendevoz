import { TabPane, Tabs } from '@/components'
import Outline from '@/core/components/pdf/components/sidebar/Outline'
import Mindmap from '@/core/components/pdf/components/sidebar/Mindmap'
import Thumbnail from '@/core/components/pdf/components/sidebar/Thumbnail'
import { Tab } from '@/components/base/tabs'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export default memo(({ id }: { id: number }) => {
  const size = 15
  const { t } = useTranslation()
  return (
    <Tabs tabNavMode={'switch'} tabNavContainerClassname={'p-3'} tabNavClassname={'font-size-12'} defaultActiveKey={'outline'}>
      <TabPane tab={<Tab iconSize={size} text={t('general.Contents')} icon={'custom-list'} />} key={'outline'}>
        <Outline />
      </TabPane>
      <TabPane tab={<Tab iconSize={size} text={t('general.Mindmap')} icon={'park-mindmap-map'} />} key={'mindmap'}>
        <Mindmap id={id} />
      </TabPane>
      <TabPane tab={<Tab iconSize={size} text={t('general.Thumbnail')} icon={'park-picture-one'} />} key={'thumbnail'}>
        <Thumbnail />
      </TabPane>
    </Tabs>
  )
})
