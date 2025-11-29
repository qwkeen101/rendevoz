import { memo, useState } from 'react'
import classnames from 'classnames'
import { Icon, TabPane, Tabs, WithBorder } from '@/components'
import { Tab } from '@/components/base/tabs'
import GraphDetails from '@/core/components/graph/components/GraphDetails'
import GraphSearch from '@/core/components/graph/components/GraphSearch'
import GraphSidepeek from '@/core/components/graph/components/GraphSidepeek'
import { Resizable } from 're-resizable'
import GraphSettings from '@/core/components/graph/components/GraphSettings'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(({ visible, onVisiblityChange }: { visible: boolean; onVisiblityChange: (value: boolean) => void }) => {
  const graph = useGraph()
  const [key, setKey] = useState('details')
  const [sidebarVisible, setSidebarVisible] = useState<number>()
  const { t } = useTranslation()
  graph.sidePeek = metaId => {
    if (Global.metaOps?.canPreview(metaId)) {
      setKey('page')
      setSidebarVisible(metaId)
      onVisiblityChange(true)
    } else {
      Global.layoutOps?.openObject(metaId)
    }
  }
  return (
    <>
      <Icon
        name={'park-hamburger-button'}
        onClick={() => onVisiblityChange(true)}
        className={'square-button z-[10] !absolute top-6 right-6'}
        size={20}
      />
      <Resizable
        defaultSize={{
          width: '380px',
          height: '100%'
        }}
        enable={{ left: true }}
        className={classnames(
          '!absolute bg-sidebar border-left min-w-96 z-[20] flex flex-col right-0 top-0 h-full transition-transform',
          !visible && 'translate-x-full'
        )}
      >
        <Tabs
          tabNavClassname={'!px-4 font-medium !pb-1.5'}
          tabNavContainerClassname={'border-bottom pt-3 px-6'}
          tabNavMode={'underline'}
          activeKey={key}
          onTabClick={k => setKey(k)}
          tabNavLeftClassName={'w-full justify-center'}
          tabNavLeftExtra={
            <Icon
              onClick={() => onVisiblityChange(false)}
              name={'park-right'}
              size={18}
              className={'!absolute transparent-font -left-3 mb-2 square-button-small'}
              strokeWidth={4}
            />
          }
        >
          <TabPane key={'details'} tab={<Tab text={t(trans.Details)} />}>
            <GraphDetails />
          </TabPane>
          <TabPane key={'search'} tab={<Tab text={t(trans.Search)} />}>
            <GraphSearch />
          </TabPane>
          {sidebarVisible ? (
            <TabPane key={'page'} tab={<Tab text={t('graph.Page')} />}>
              <GraphSidepeek visible={sidebarVisible} />
            </TabPane>
          ) : null}
          <TabPane key={'settings'} tab={<Tab text={t('general.Settings')} />}>
            <GraphSettings />
          </TabPane>
        </Tabs>
      </Resizable>
    </>
  )
})
