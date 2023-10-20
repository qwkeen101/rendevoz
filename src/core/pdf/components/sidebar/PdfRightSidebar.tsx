import { Content, Icon, TabPane, Tabs } from '@/components'
import usePdfBarState from '../../hooks/usePdfBarState'
import PdfLabelController from './PdfLabelController'
import { Resizable } from 're-resizable'
import PdfSearch from '../floatbar/Search'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'

const PdfRightSidebar = () => {
  const [pdfBarState, setPdfBarState] = usePdfBarState()
  const { t } = useTranslation()

  return (
    <Resizable
      defaultSize={{
        width: pdfBarState.rightBarWidth,
        height: '100%'
      }}
      onResizeStop={(e, dir, ele) =>
        setPdfBarState(s => ({
          ...s,
          rightBarWidth: ele.getBoundingClientRect().width
        }))
      }
      maxWidth={500}
      minWidth={200}
      enable={{
        left: true
      }}
      style={{
        height: '100%',
        position: 'relative',
        zIndex: 20,
        padding: 10,
        marginLeft: 5,
        background: Colors.Background.Secondary,
        display: pdfBarState.showRightBar ? undefined : 'none'
      }}
    >
      <Tabs
        extra={
          <Icon
            name="park-close"
            className={ClassName.circleButton()}
            onClick={() => setPdfBarState(s => ({ ...s, showRightBar: false }))}
          />
        }
        defaultActiveKey="search"
        activeKey={pdfBarState.rightBarActive}
        onTabClick={key => setPdfBarState(s => ({ ...s, rightBarActive: key }))}
      >
        <TabPane
          style={{ paddingTop: 10 }}
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-search" />
              {t('general.search')}
            </Content>
          }
          key="search"
        >
          <PdfSearch />
        </TabPane>
        <TabPane
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-label" />
              {t('general.label')}
            </Content>
          }
          key="label"
        >
          <PdfLabelController />
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default PdfRightSidebar
