import usePdfBarState from '../../hooks/usePdfBarState'
import { Content, Icon, TabPane, Tabs } from '@/components'
import PdfThumbnail from '../Thumbnail'
import { Resizable } from 're-resizable'
import Colors from '@/consts/colors'
import PdfOutline from '../floatbar/Outline'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from 'react-error-boundary'

const PdfLeftSidebar = () => {
  const { t } = useTranslation()
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  return (
    <Resizable
      defaultSize={{
        width: pdfBarState.leftBarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) =>
        setPdfBarState(s => ({
          ...s,
          leftBarWidth: ele.getBoundingClientRect().width
        }))
      }
      enable={{
        right: true
      }}
      maxWidth={500}
      minWidth={100}
      style={{
        height: '100%',
        position: pdfBarState.showLeftBar ? 'relative' : 'absolute',
        left: 0,
        zIndex: pdfBarState.showLeftBar ? 20 : -1,
        padding: 10,
        marginRight: 5,
        background: Colors.Background.Global,
        borderRight: '1px solid var(--border-background)',
        visibility: pdfBarState.showLeftBar ? 'visible' : 'hidden'
      }}
    >
      <Tabs
        defaultActiveKey="thumbnail"
        onTabClick={key => setPdfBarState(s => ({ ...s, leftBarActive: key }))}
        activeKey={pdfBarState.leftBarActive}
      >
        <TabPane
          style={{
            paddingTop: 20
          }}
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-pic" />
              {t('general.thumbnail')}
            </Content>
          }
          key="thumbnail"
        >
          <ErrorBoundary fallback={<div></div>}>
            <PdfThumbnail/>
          </ErrorBoundary>
        </TabPane>
        <TabPane
          style={{
            paddingTop: 20
          }}
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-view-list" />
              {t('general.outline')}
            </Content>
          }
          key="outline"
        >
          <PdfOutline />
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default PdfLeftSidebar
