import React, { MouseEventHandler, ReactNode } from 'react'
import { Filter } from './Algorithm'
/** @ignore */
export const placeHolderStyle = 'place-holder'
/** @ignore */
export const maximePlaceHolderId = '-maximized-placeholder-'

/** @ignore */
interface DockDataBase {
  minWidth?: number
  minHeight?: number
}

export type DockMode = 'horizontal' | 'vertical' | 'float' | 'window' | 'maximize'

export interface TabBase {
  /**
   * id must be unique
   */
  id: string
}

export interface PanelBase {
  /**
   * id will be auto generated if it's undefined
   */
  id: string

  /**
   * The size in dock box,
   * width when in horizontal layout and height when in vertical layout
   */
  size?: number
  tabs: TabBase[]
  /**
   * The id of current tab
   */
  activeId?: string

  /** float mode only */
  x?: number
  /** float mode only */
  y?: number
  /** float mode only */
  z?: number
  /** float mode only */
  w?: number
  /** float mode only */
  h?: number
}

export interface BoxBase {
  /**
   * id will be auto generated if it's undefined
   */
  id?: string
  mode: DockMode

  /**
   * The size in dock box,
   * width when in horizontal layout and height when in vertical layout
   */
  size?: number
  children: (BoxBase | PanelBase)[]
}

export interface LayoutBase {
  dockbox: BoxBase
}

interface BoxChild extends DockDataBase {
  parent?: BoxData
  widthFlex?: number
  heightFlex?: number
}

/**
 * a box is the layout element that contains other boxes or panels
 */
export interface BoxData extends BoxBase, BoxChild {
  mode: DockMode
  children: (BoxData | PanelData)[]
}

export interface TabData extends TabBase, DockDataBase {
  /**
   * - group defines style of the panel
   * - tabs with different tab groups can not be put in same panel
   * - more options for the group can be defined as TabGroup in [[LayoutProps.groups]]
   */
  group?: string

  /** @ignore */
  parent?: PanelData
  /**
   * title that's shown in the tab of the panel header
   */
  title: React.ReactChild
  content: React.ReactElement | ((tab: TabData) => React.ReactElement)
  closable?: boolean
  objectId?: number
  /**
   * - when value is true: content will always reuse the react component thus allows the component to keep its internal state
   * - when value is false: content will be destroyed when it's not visible, [[TabGroup.animated]] should be set to false, otherwise animation would show blank pages
   * - when value is undefined: content is rendered normally as react component
   */
  cached?: boolean
  icon?: ReactNode
}
/**
 * a panel is a visiaul container with tabs button in the title bar
 */
export interface PanelData extends PanelBase, BoxChild {
  parent?: BoxData

  tabs: TabData[]

  /**
   * if group is undefined, it will be set to the group name of first tab
   */
  group?: string
}

export interface GlobalData {
  currentFocusedPanelId?: string
}
export interface TabPaneCache {
  id: string
  div: HTMLDivElement
  owner: any
  portal?: React.ReactPortal
  children?: React.ReactNode
}

export interface LayoutData extends LayoutBase {
  /**
   * global data
   */
  global: GlobalData
  /**
   * dock box
   */

  dockbox: BoxData
  /**
   * float box,
   * Children must be PanelData, child box is not allowed
   */

  /** @ignore
   * keep the last loaded layout to prevent unnecessary reloading
   */
  loadedFrom?: LayoutBase
}

export type DropDirection =
  | 'left'
  | 'right'
  | 'bottom'
  | 'top'
  | 'middle'
  | 'remove'
  | 'before-tab'
  | 'after-tab'
  | 'float'
  | 'front'
  | 'maximize'
  | 'new-window'
  | 'move' // dockbox or float panel moved, or float panel resized
  | 'active' // become active tab
  | 'update' // tab updated with updateTab

export interface DockContext {
  draggingPanel?: PanelData
  /** @ignore */
  getDockId(): any

  getLayout(): LayoutData

  setLayout(layout: LayoutData): void

  getGlobal(): GlobalData

  /** @ignore */
  setDropRect(element: HTMLElement, direction?: DropDirection, source?: any): void

  /** @ignore */
  getLayoutSize(): { width: number; height: number }

  /** @ignore
   * When a state change happen to the layout that's handled locally, like inside DockPanel or DockBox.
   * It still need to tell the context there is a change so DockLayout can call onLayoutChange callback.
   * This usually happens on dragEnd event of size/location change.
   */
  onSilentChange(currentTabId?: string, direction?: DropDirection): void

  /**
   * Move a tab or a panel, if source or target is already in the layout, you can use the find method to get it with id first
   * @param source the source TabData or PanelData being moved
   *  - it can exist in the layout already
   *  - or can be a new tab or new panel that you want to add to the layout
   * @param target where you want to drop the source, can be the id or target data model
   * @param direction which direction to drop<br>
   *  - when direction is 'after-tab' or 'before-tab', target must be TabData
   *  - when direction is 'remove' or 'front', target must be null
   *  - when direction is 'float', target doesnt matter. If this is called directly from code without any user interaction, source must be PanelData with x,y,w,h properties
   *
   */
  dockMove(source: TabData | PanelData, target: string | TabData | PanelData | BoxData | null, direction: DropDirection): void

  /**
   * Find PanelData or TabData by id
   */
  find(id: string, filter?: Filter): PanelData | TabData | BoxData | null

  /**
   * Update a tab with new TabData
   * @param id tab id to update
   * @param newTab new tab data, if newTab is null, it only changes the active tab of parent panel
   * @param makeActive whether to make the tab the active child of parent panel
   * @returns returns false if the tab is not found
   */
  updateTab(id: string, newTab: TabData | null, makeActive: boolean): boolean

  updatePanel(id: string, newPanel: PanelData | null): boolean

  /** @ignore */
  getTabCache(id: string, owner: any): TabPaneCache

  /** @ignore */
  removeTabCache(id: string, owner: any): void

  /** @ignore */
  updateTabCache(id: string, portal: React.ReactNode): void

  /** @ignore */
  getRootElement(): HTMLDivElement

  panelsCount(): number
}

/** @ignore */
export const DockContextType = React.createContext<DockContext>(null)
/** @ignore */
export const DockContextProvider = DockContextType.Provider
/** @ignore */
export const DockContextConsumer = DockContextType.Consumer
