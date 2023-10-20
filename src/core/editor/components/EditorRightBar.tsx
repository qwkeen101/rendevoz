import { Content, Icon, TabPane, Tabs } from '@/components'
import EditorSearchPanel from '@/scenes/editor/Search'
import { useTranslation } from 'react-i18next'
import useEditorBarState from '../hooks/useEditorBarState'
import { Resizable } from 're-resizable'
import ClassName from '@/styles/classNames'
import EditorLabelController from './EditorLabelController'
import Colors from '@/consts/colors'
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { EditorSearchAtom } from '../hooks/useEditorSearch'

const EditorRightBar = () => {
  const [barState, setBarState] = useEditorBarState()
  const { t } = useTranslation()
  const setEditorSearch = useSetAtom(EditorSearchAtom)
  useEffect(() => {
    if (!barState.showRightBar || barState.rightBarActive !== 'search') {
      setEditorSearch(s => ({ ...s, isSearching: false }))
    } else if (barState.showRightBar && barState.rightBarActive === 'search') {
      setEditorSearch(s => ({ ...s, isSearching: true }))
    }
  }, [barState])

  return (
    <Resizable
      enable={{
        left: true
      }}
      defaultSize={{
        width: 340,
        height: '100%'
      }}
      minWidth={300}
      maxWidth={600}
      handleStyles={{
        left: {
          left: 0
        }
      }}
      style={{
        transform: barState.showRightBar ? 'unset' : 'translateX(100%)',
        transition: 'transform 0.2s ease',
        position: barState.showRightBar ? 'relative' : 'absolute',
        pointerEvents: barState.showRightBar ? 'auto' : 'none',
        padding: '6px 12px',
        borderLeft: `1px solid ${Colors.Background.Border}`,
        background: Colors.Background.Secondary,
        right: 0,
        top: 0
      }}
    >
      <Tabs
        tabNavContainerStyle={{
          padding: '8px 0px 4px'
        }}
        extra={
          <Icon name="park-close" className={ClassName.circleButton()} onClick={() => setBarState(s => ({ ...s, showRightBar: false }))} />
        }
        defaultActiveKey="search"
        onTabClick={key => setBarState(s => ({ ...s, rightBarActive: key }))}
        activeKey={barState.rightBarActive}
      >
        <TabPane
          key="search"
          style={{
            paddingTop: 12
          }}
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-search" />
              {t('general.search')}
            </Content>
          }
        >
          <EditorSearchPanel />
        </TabPane>
        <TabPane
          key="label"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-label" />
              {t('general.label')}
            </Content>
          }
        >
          <EditorLabelController />
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default EditorRightBar
