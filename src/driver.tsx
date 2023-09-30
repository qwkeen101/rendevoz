import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { ClassName } from 'rendevoz'
import { css } from '@emotion/css'
const SIDEBAR_DATABASE = 'sidebar-database'
const HOME_CREATE_BUTTON = 'home-create-button'
const SIDEBAR_FOLDERS = 'sidebar-collections'
const SIDEBAR_SEARCH = 'sidebar-search'
const SIDEBAR_GRAPH = 'sidebar-graph'
const SIDEBAR_WEBSEARCH = 'sidebar-webSearch'
import { t } from 'i18next'
import { Content } from '@/components'
import { renderToStaticMarkup } from 'react-dom/server'
import { useTranslation } from 'react-i18next'

const IntroEle = () => {
  const { t } = useTranslation()
  return (
    <Content>
      <div>你好👋！非常高兴您能对本软件感兴趣，在开始前我想首先为您介绍一些本软件的核心理念。</div>
      <div style={{ margin: '0.6rem 0px', fontSize: '1.8rem', fontWeight: 600 }}>实体</div>
      <div>首先，第一个核心概念就是实体</div>
      <div style={{ margin: '0.6rem 0px', fontSize: '1.8rem', fontWeight: 600 }}>关联</div>
    </Content>
  )
}
export const startDrive = () => {
  const driverObj = driver({
    showProgress: true,
    nextBtnText: t('intro.next'),
    prevBtnText: t('intro.prev'),
    doneBtnText: t('intro.done'),
    progressText: '{{current}} / {{total}}',
    steps: [
      {
        popover: {
          title: t('intro.before getting started'),
          description: renderToStaticMarkup(<IntroEle />),
          popoverClass: css({
            maxWidth: '800px !important'
          })
        }
      },
      {
        element: `#${HOME_CREATE_BUTTON}`,
        popover: {
          title: t('intro.create something'),
          description: t('intro.create desc')
        }
      },
      {
        element: `#${SIDEBAR_DATABASE}`,
        popover: {
          title: t('intro.object library'),
          description: t('intro.library desc')
        }
      },
      {
        element: `#${SIDEBAR_GRAPH}`,
        popover: {
          title: t('intro.graph view'),
          description: t('intro.graph desc')
        }
      },
      {
        element: `#${SIDEBAR_FOLDERS}`,
        popover: {
          title: t('intro.collections'),
          description: t('intro.collections desc')
        }
      },
      {
        element: `#${SIDEBAR_SEARCH}`,
        popover: {
          title: t('intro.search'),
          description: t('intro.search desc')
        }
      },
      {
        element: `#${SIDEBAR_WEBSEARCH}`,
        popover: {
          title: t('intro.web search'),
          description: t('intro.web search desc')
        }
      }
    ]
  })
  driverObj.drive()
}
