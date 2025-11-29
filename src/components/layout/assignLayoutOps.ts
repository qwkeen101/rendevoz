import { assignProperties } from '@/utils'
import { t } from 'i18next'
import { DockLayout, PanelData, TabData as DockTabData } from '@/components/base/dock'
import { addNewTab, closeTab, getCurrentFocusedTab } from '@/components/layout/utils'
import { RefObject } from 'react'
import {
  BuiltInTabTypes,
  IEditorInstance,
  ILabel,
  ILayoutTab,
  IMediaInstance,
  IPDFInstance,
  IWebpageInstance,
  OpenTabOptions,
  TabData
} from '~/typings'
import { defaultLayout, LayoutIdToTabMap } from '@/components/layout/index'
import Id from '@/utils/id'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'
import { replacePanel } from '@/components/base/dock/Algorithm'
import toast from 'react-hot-toast'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import Workspace from '@/api/common/workspace'
import { ipcInstance } from '@/electron'
import UseHomeConfig from '@/scenes/home/useHomeConfig'

const RegisterTabDataMap = new Map<BuiltInTabTypes['type'], TabData[BuiltInTabTypes['type']]>()
const initializeOneTab = (registeredData: TabData[BuiltInTabTypes['type']], options: OpenTabOptions<BuiltInTabTypes['type']>) => {
  if (!options.type) return
  const originInitializeFunction = options.onInstanceInitialized
  const layoutTab: Partial<ILayoutTab> = {
    type: options.type,
    objectId: options.objectId
  }
  const newInitializedFunction = (i: BuiltInTabTypes['instance']) => {
    layoutTab.instance = i
    originInitializeFunction?.(i)
  }

  // get rendered element
  const contentElement = registeredData.content({
    tab: layoutTab,
    objectId: options.objectId,
    onInstanceInitialized: newInitializedFunction
  })
  if (!contentElement) return
  layoutTab.tabContent = contentElement

  return layoutTab
}

export default function assignGlobalLayoutOps(layoutRef: RefObject<DockLayout>) {
  assignProperties(Global, {
    layoutOps: {
      ...Global.layoutOps,
      getTab: id => {
        return LayoutIdToTabMap.get(id)
      },
      closeTab: tabId => {
        const l = layoutRef.current
        if (l) {
          closeTab(tabId, l)
        }
      },
      closeObjectTab: metaId => {
        const m = MetaStore.getCachedMetaObject(metaId)
        if (m) {
          const maybeExistTab = Global.layoutOps?.hasTargetTab({
            objectId: m.objectId,
            type: m.type
          })
          if (maybeExistTab) {
            const l = layoutRef.current
            if (l) {
              closeTab(maybeExistTab, l)
            }
          }
        }
      },
      openObject: async metaId => {
        const m = MetaStore.getCachedMetaObject(metaId)
        if (m) {
          // delay this update to idle time
          setTimeout(() => {
            MetaStore.updateMetaObject({ id: m.id, viewAt: Date.now() })
          }, 1000)
          const objectId = m.objectId
          if (m.type.includes('Label')) {
            const targetObject = (await ObjectStore(m.type).getOneById(objectId)) as ILabel | undefined
            if (targetObject) {
              const parentMeta = MetaStore.getMetaObjectByObjectId(targetObject.parentObjectId)
              if (parentMeta) {
                const parentInstance = await new Promise(res => {
                  Global.layoutOps?.openNewTab({
                    objectId: parentMeta.objectId,
                    type: parentMeta.type,
                    metaId: parentMeta.id,
                    onInstanceInitialized: i => {
                      res(i)
                    }
                  })
                })
                switch (m.type) {
                  case 'pdfLabel':
                    ;(parentInstance as IPDFInstance).navigateOps?.jumpToLabel(objectId)
                    break
                  case 'videoLabel':
                  case 'audioLabel':
                    {
                      ;(parentInstance as IMediaInstance).actionOps?.jumpTo(targetObject.time)
                      ;(parentInstance as IMediaInstance).actionOps?.autoPlay?.()
                    }
                    break
                  case 'noteLabel':
                    ;(parentInstance as IEditorInstance).scrollToHighlight?.({ highlightId: objectId })
                    break
                  case 'webpageLabel':
                    ;(parentInstance as IWebpageInstance).editorInstance?.scrollToHighlight?.({ highlightId: objectId })
                    break
                }
              }
              return
            }
          }
          if (m.type === 'localFile' || m.type === 'cloudFile') {
            const file = await ObjectStore(m.type).getOneById(objectId)
            if (file?.url) {
              Global.utils.openSpecificURL(file.url)
            }
            return
          }
          if (m.type === 'collection') {
            if (m.objectId) {
              const parent = CollectionStore.findParentCollections(m.objectId)
              if (parent) {
                UseHomeConfig.update(c => ({ ...c, breadcrumbsFutureStack: [], breadcrumbs: parent.map(i => i.id) }))
                Global.layoutOps?.openPage('home')
              }
            }
            return
          }
          return await new Promise(res => {
            Global.layoutOps?.openNewTab({
              objectId: objectId,
              type: m.type,
              metaId: m.id,
              onInstanceInitialized: i => {
                res(i)
              }
            })
          })
        }
      },
      openDeekLink: async link => {
        if (link.startsWith('rendevoz://object')) {
          const url = new URL(link)
          const query = url.searchParams
          const pathname = url.pathname
          const metaId = parseInt(pathname.replace('//object/', ''))
          if (!metaId || metaId.toString().length !== 14) {
            return
          }
          const meta = await MetaStore.getMetaObjectById(metaId)
          // switch workspace
          const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
          if (meta?.workspace && meta?.workspace !== currentWorkspace?.id) {
            const hasWorkspace = await Workspace.hasWorkspace(meta.workspace)
            if (!hasWorkspace) {
              toast.error('Target workspace not exist!')
              return
            }
            const res = await Global.dialogOps?.confirm(t('general.Confirm switch workspace'))
            if (res) {
              await Workspace.switchWorkspace(meta.workspace)
            } else {
              return
            }
          }
          if (query.has('t')) {
            const time = parseInt(query.get('t')!)
            Global.layoutOps?.openObject(metaId).then(ins => {
              if (ins && 'actionOps' in ins) {
                ;(ins as IMediaInstance).actionOps?.jumpTo(time)
              }
            })
          } else if (query.has('blockid')) {
            const blockId = parseInt(query.get('blockid')!)
            if (blockId) {
              Global.layoutOps?.openObject(metaId).then(ins => {
                if (ins) {
                  if ('editorInstance' in ins) {
                    ins.editorInstance?.selectBlock?.({
                      blockId: blockId
                    })
                  }
                  if ('selectBlock' in ins) {
                    ins.selectBlock?.({
                      blockId: blockId
                    })
                  }
                }
              })
            }
          } else {
            await Global.layoutOps?.openObject(metaId)
          }
        }
        if (link.startsWith('rendevoz://baidudisk')) {
          const url = new URL(link)
          const search = url.searchParams
          if (search.has('code')) {
            ipcInstance.send('loginBaidudisk', search.get('code')).then(res => {
              if (res) {
                KeyvalueStore.updateOne('baiduAccessToken', res.data.access_token)
                toast.success('登录网盘成功！')
              }
            })
          }
        }
        return
      },
      openPage: (type, opts) => {
        return new Promise(res => {
          switch (type) {
            case 'youtube':
            case 'feed':
            case 'podcast':
              Global.layoutOps?.openExtraPage(type, i => {
                res(i)
              })
              return
            default: {
              Global.layoutOps?.openNewTab({
                type,
                objectId: opts?.id,
                onInstanceInitialized: i => {
                  res(i)
                }
              })
            }
          }
        })
      },
      getCurrentFocusedTab: () => {
        const layout = layoutRef.current
        if (!layout) return
        return getCurrentFocusedTab(layout)?.id
      },
      switchToTab: direction => {
        const currFocused = Global.layoutOps?.getCurrentFocusedTab()
        if (currFocused) {
          const currFocusedTab = layoutRef.current?.find(currFocused) as DockTabData | undefined
          if (currFocusedTab) {
            const parentLength = currFocusedTab.parent?.tabs.length ?? 0
            const currIdx = currFocusedTab.parent?.tabs.findIndex(i => i === currFocusedTab)
            if (currIdx === undefined || currIdx < 0) return
            let next = 0
            if (direction === 'next') {
              next = currIdx + 1
              if (next === parentLength) {
                next = 0
              }
            }
            if (direction === 'prev') {
              next = currIdx - 1
              if (next < 0) {
                next = parentLength - 1
              }
            }
            if (next >= 0 && next !== currIdx) {
              const tab = currFocusedTab.parent?.tabs[next]
              if (tab) {
                Global.layoutOps?.makeTabActive(tab.id)
              }
            }
          }
        }
      },
      getRegisteredTabData: type => RegisterTabDataMap.get(type),
      initializeOneTab,
      registerTabData: tabData => {
        RegisterTabDataMap.set(tabData.type, tabData)
      },
      openNewTab: tabData => {
        const layout = layoutRef.current
        if (!layout) return
        const registeredData = RegisterTabDataMap.get(tabData.type)
        if (!registeredData) return
        const maybeExistTab = Global.layoutOps?.hasTargetTab(tabData)
        if (maybeExistTab) {
          Global.layoutOps?.makeTabActive(maybeExistTab)
          const targetTabData = LayoutIdToTabMap.get(maybeExistTab)
          if (targetTabData && 'instance' in targetTabData && targetTabData.instance) {
            tabData.onInstanceInitialized?.(targetTabData.instance)
            registeredData.onTabActive?.()
          }
          return
        }
        const initialized = initializeOneTab(registeredData, tabData)
        if (initialized) {
          const tabId = Id.getStrId()
          LayoutIdToTabMap.set(tabId, initialized)
          registeredData.onTabActive?.()
          addNewTab(
            {
              content: initialized.tabContent,
              id: tabId,
              title: 'New Tab',
              type: initialized.type,
              objectId: initialized.objectId,
              metaType: initialized.metaType
            },
            layout
          )
        }
      },
      hasTargetTab: tabData => {
        const { type, objectId, metaType } = tabData
        const target = Array.from(LayoutIdToTabMap.entries()).find(([k, v]) => {
          if (type === v.type) {
            if ('objectId' in v && objectId) {
              if (v.objectId === objectId) {
                return k
              }
              return
            }
            if ('metaType' in v && metaType) {
              if (v.metaType === metaType) {
                return k
              }
              return
            }
            return k
          }
        })
        return target?.[0]
      },
      makeTabActive: tabId => {
        const layout = layoutRef.current
        if (!layout) return
        layout.updateTab(tabId, null, true)
      },
      closeAllTabs: keepHome => {
        LayoutIdToTabMap.clear()
        layoutRef.current?.changeLayout(defaultLayout)
        layoutRef.current?.setLayout(defaultLayout)
        if (keepHome) {
          Global.layoutOps?.openPage('home')
        }
      },
      closeCurrentFocusedPanel: () => {},
      closeTabs: (type, currTabId) => {
        const l = layoutRef.current
        if (l) {
          const currTab = currTabId || Global.layoutOps?.getCurrentFocusedTab()
          if (currTab) {
            let newPanel: PanelData | undefined = undefined
            const tabData = l.find(currTab) as DockTabData
            const parentPanel = tabData.parent as PanelData
            if (type === 'others') {
              parentPanel.tabs
                .filter(i => i !== tabData)
                .map(i => i.id)
                .forEach(id => id && LayoutIdToTabMap.delete(id))
              newPanel = { ...parentPanel, tabs: [tabData] } as PanelData
            }
            const idx = parentPanel.tabs.findIndex(i => i === tabData)
            if (type === 'right') {
              const leftTabs = parentPanel.tabs.slice(0, idx + 1)
              const rightTabs = parentPanel.tabs.slice(idx - 1)
              rightTabs.forEach(tab => tab.id && LayoutIdToTabMap.delete(tab.id))
              newPanel = {
                ...parentPanel,
                tabs: [...leftTabs],
                activeId: tabData.id
              } as PanelData
            }
            if (type === 'left') {
              const leftTabs = parentPanel.tabs.slice(0, idx)
              const rightTabs = parentPanel.tabs.slice(idx)
              leftTabs.forEach(tab => tab.id && LayoutIdToTabMap.delete(tab.id))
              newPanel = {
                ...parentPanel,
                tabs: [...rightTabs],
                activeId: tabData.id
              } as PanelData
            }
            if (newPanel) {
              const newLayout = replacePanel(l.getLayout(), parentPanel, newPanel)
              l.changeLayout(newLayout)
              l.setLayout(newLayout)
            }
          }
        }
      },
      closeCurrentFocusedTab: () => {
        const layout = layoutRef.current
        if (!layout) return
        const focusedTab = getCurrentFocusedTab(layout)
        if (focusedTab && focusedTab.id) {
          closeTab(focusedTab.id, layout)
        }
      }
    }
  })
}
