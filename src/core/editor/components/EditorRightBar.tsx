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
import { useEditorInstance } from '@/core/rendevoz/hooks'

const EditorRightBar = () => {
  const [barState, setBarState] = useEditorBarState()
  const { t } = useTranslation()
  const setEditorSearch = useSetAtom(EditorSearchAtom)
  useEffect(() => {
    if (barState.showRightBar === false || barState.rightBarActive !== 'search') {
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
      style={{
        contentVisibility: barState.showRightBar ? 'visible' : 'hidden',
        position: barState.showRightBar ? 'relative' : 'absolute',
        pointerEvents: barState.showRightBar ? 'auto' : 'none',
        padding: '6px 12px',
        marginLeft: 12
      }}
      handleStyles={{
        left: {
          width: 3,
          background: Colors.Background.Border
        }
      }}
    >
      <Tabs
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
            paddingTop: 20
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
