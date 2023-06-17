import usePdfBarState from '../../hooks/usePdfBarState'
import { Content, Icon, TabPane, Tabs } from '@/components'
import PdfThumbnail from '../Thumbnail'
import { Resizable } from 're-resizable'
import Colors from '@/consts/colors'
import PdfOutline from '../floatBar/Outline'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'

const PdfLeftSidebar = () => {
  const { t } = useTranslation()
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  return (
    <Resizable
      defaultSize={{
        width: pdfBarState.leftBarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) => setPdfBarState(s => ({ ...s, leftBarWidth: ele.getBoundingClientRect().width }))}
      enable={{
        right: true
      }}
      maxWidth={500}
      minWidth={100}
      style={{
        height: '100%',
        position: 'relative',
        zIndex: 20,
        padding: 10,
        marginRight: 20,
        display: pdfBarState.showLeftBar ? undefined : 'none'
      }}
      handleStyles={{
        right: {
          width: 3,
          background: Colors.Background.ButtonHover
        }
      }}
    >
      <Tabs
        defaultActiveKey="thumbnail"
        onTabClick={key => setPdfBarState(s => ({ ...s, leftBarActive: key }))}
        extra={
          <Icon
            name="park-close"
            className={ClassName.circleButton()}
            onClick={() => setPdfBarState(s => ({ ...s, showLeftBar: false }))}
          />
        }
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
          <PdfThumbnail />
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
