import Icon from '@/components/base/Icon'
import styles from './index.module.less'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import SidebarDatabase from './SidebarDatabase'
import SidebarSetting from './SidebarSetting'
import SidebarSearch from './SidebarSearch'
import classNames from 'classnames'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'
import { Rendevoz } from '@/core/rendevoz'
import { KeyToRegisteredSidebarElement } from '@/core/plugin/RegisterMap'
import React, { Fragment, useEffect, useRef } from 'react'
import { useGlobalAtom, useGlobalSetAtom, useToggle } from '@/hooks'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar/index'
import { Colors } from '@/consts'
import { useSetting } from '@/core'
import { Reorder } from 'framer-motion'
import produce from 'immer'
import ContextMenu from '@/components/contextMenu'
import { Button, Content, Tooltip, WithBorder } from '@/components'
import { GlobalScreenshotInstance } from '@/core/global/globalScreenShot'
import { RegisteredSidebarItem } from '~/typings/registered'
import { globalStore } from '@/stores'
import { GlobalTextSearchInstance } from '@/core/global/GlobalTextSearch'
import { t } from 'i18next'
import { ClassName } from 'rendevoz'
import SidebarUser from '@/components/layout/sidebar/SidebarUser'
import { useUpdate } from 'react-use'

const BuiltInSidebarItems: Record<string, RegisteredSidebarItem> = {
  home: {
    key: 'home',
    icon: 'park-home',
    onClick: () => {
      Rendevoz.Actions.Open.openHome()
    },
    text: () => t('general.home')
  },
  collections: {
    key: 'collections',
    icon: 'park-folder-close',
    onClick: () => {
      const panelState = globalStore.get(SidebarPanelStateAtom)
      globalStore.set(SidebarPanelStateAtom, {
        ...panelState,
        open: panelState.visible === 'collections' ? !panelState.open : true,
        visible: 'collections'
      })
    },
    text: () => t('general.collection')
  },
  screenshot: {
    key: 'screenshot',
    icon: 'park-screenshot-one',
    onClick: () => {
      GlobalScreenshotInstance.open?.()
    },
    text: () => t('general.screenshot')
  },
  search: {
    key: 'search',
    icon: 'park-search',
    onClick: () => {
      GlobalTextSearchInstance.open?.()
    },
    text: () => t('general.search')
  },
  graph: {
    key: 'graph',
    icon: 'park-share-one',
    text: () => t('general.graph'),
    onClick: () => {
      Rendevoz.Actions.Layout.openNewTab({ data: { type: 'graph' } })
    }
  },
  database: {
    key: 'database',
    text: () => `${t('general.object library')}: ${t('general.drop here to add object')}`,
    element: <SidebarDatabase />,
    icon: 'park-data'
  },
  settings: {
    key: 'settings',
    text: () => t('general.settings'),
    element: <SidebarSetting />,
    icon: 'park-setting-two'
  },
  webSearch: {
    key: 'webSearch',
    text: () => t('general.web search'),
    icon: 'park-google',
    onClick: () => {
      const panelState = globalStore.get(SidebarPanelStateAtom)
      globalStore.set(SidebarPanelStateAtom, {
        ...panelState,
        open: panelState.visible === 'webSearch' ? !panelState.open : true,
        visible: 'webSearch'
      })
    }
  }
}
const Navigation = ({ hovered }: { hovered: boolean }) => {
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  const registeredSidebarEles = Array.from(KeyToRegisteredSidebarElement.values())
  const [settings, setSettings] = useSetting()
  const selectedItem = panelState.visible
  const renderSidebarItem = (k: string) => {
    const buildIn = BuiltInSidebarItems[k] || KeyToRegisteredSidebarElement.get(k)
    if (buildIn) {
      const rendered = buildIn.element ? (
        buildIn.element
      ) : (
        <MenuItem onClick={buildIn.onClick}>
          <Icon name={buildIn.icon || 'park-help'} size={20} />
        </MenuItem>
      )
      return (
        <Tooltip position="right" content={typeof buildIn.text === 'string' ? buildIn.text : buildIn.text?.()}>
          <Content
            style={{
              background: selectedItem === k && panelState.open ? Colors.Background.HighContrast : undefined,
              borderRadius: 6
            }}
          >
            {rendered}
          </Content>
        </Tooltip>
      )
    }
  }
  const isDraggingRef = useRef(false)
  const update = useUpdate()
  useEffect(() => {
    const interval = setInterval(() => update(), 1000)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <>
      <ContextMenu
        content={
          <WithBorder padding={6} style={{ minWidth: 160 }}>
            {[...Object.values(BuiltInSidebarItems), ...registeredSidebarEles].map(i => (
              <Content
                onClick={() => {
                  setSettings(
                    produce(settings, draft => {
                      const s = new Set(settings.sidebarVisibleItems)
                      if (s.has(i.key)) {
                        s.delete(i.key)
                      } else {
                        s.add(i.key)
                      }
                      draft.sidebarVisibleItems = Array.from(s)
                    })
                  )
                }}
                key={i.key}
                flex
                gap={6}
                className={ClassName.flatButton(3, '2px 6px')}
              >
                {i.icon && <Icon name={i.icon} />}
                <span>{typeof i.text === 'string' ? i.text : i.text?.()}</span>
                {settings.sidebarVisibleItems.includes(i.key) && <Icon name="park-check" containerStyle={{ marginLeft: 'auto' }} />}
              </Content>
            ))}
          </WithBorder>
        }
      >
        <Reorder.Group
          axis="y"
          as="div"
          style={{ width: '100%', height: '100%' }}
          className={classNames(
            styles.list,
            css({
              display: 'flex',
              paddingTop: '4px !important',
              paddingBottom: '20px !important',
              flexDirection: 'column',
              borderRight: `1px solid ${Colors.Background.Border}`,
              gap: 8,
              '*': {
                fontSize: FontSize['13px']
              }
            })
          )}
          onReorder={v =>
            setSettings(
              produce(settings, draft => {
                draft.sidebarVisibleItems = v
              })
            )
          }
          values={settings.sidebarVisibleItems}
        >
          <SidebarUser />
          {settings.sidebarVisibleItems.map(
            i =>
              i && (
                <Reorder.Item
                  onDrag={() => {
                    isDraggingRef.current = true
                  }}
                  onContextMenuCapture={e => e.stopPropagation()}
                  onDragEnd={e => {
                    setTimeout(() => {
                      isDraggingRef.current = false
                    })
                  }}
                  onClickCapture={e => {
                    if (isDraggingRef.current) {
                      e.stopPropagation()
                      isDraggingRef.current = false
                    }
                  }}
                  as="div"
                  key={i}
                  value={i}
                >
                  {renderSidebarItem(i)}
                </Reorder.Item>
              )
          )}
        </Reorder.Group>
      </ContextMenu>
    </>
  )
}

export default Navigation
