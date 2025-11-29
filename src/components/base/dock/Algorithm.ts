import { BoxData, DockMode, DropDirection, LayoutData, PanelData, placeHolderStyle, TabData } from './DockData'

let _watchObjectChange: WeakMap<any, any> = new WeakMap()

export function getUpdatedObject(obj: any): any {
  const result = _watchObjectChange.get(obj)
  if (result) {
    return getUpdatedObject(result)
  }
  return obj
}

export function clearObjectCache() {
  _watchObjectChange = new WeakMap()
}

export function clone<T>(value: T, extra?: any): T {
  const newValue: any = { ...value, ...extra }
  if (Array.isArray(newValue.tabs)) {
    newValue.tabs = newValue.tabs.concat()
  }
  if (Array.isArray(newValue.children)) {
    newValue.children = newValue.children.concat()
  }
  _watchObjectChange.set(value, newValue)
  return newValue
}

function maxFlex(currentFlex: number, newFlex: number) {
  if (currentFlex == null) {
    return newFlex
  }
  return Math.max(currentFlex, newFlex)
}

function mergeFlex(currentFlex: number, newFlex: number) {
  if (currentFlex == null) {
    return newFlex
  }
  if (currentFlex === newFlex) {
    return newFlex
  }
  if (currentFlex >= 1) {
    if (newFlex <= 1) {
      return 1
    }
    return Math.min(currentFlex, newFlex)
  } else {
    if (newFlex >= 1) {
      return 1
    }
    return Math.max(currentFlex, newFlex)
  }
}

let _idCount = 0

export function nextId() {
  ++_idCount
  return `+${_idCount}`
}

let _zCount = 0

export function nextZIndex(current?: number): number {
  if (current === _zCount) {
    // already the top
    return current
  }
  return ++_zCount
}

function findInPanel(panel: PanelData, id: string, filter: Filter): PanelData | TabData {
  if (panel.id === id && filter & Filter.Panel) {
    return panel
  }
  if (filter & Filter.Tab) {
    for (const tab of panel.tabs) {
      if (tab.id === id || tab.noteId === Number(id)) {
        return tab
      }
    }
  }
  return null
}

function findInBox(box: BoxData, id: string, filter: Filter): PanelData | TabData | BoxData {
  let result: PanelData | TabData | BoxData = undefined
  if (!box) return result
  if (filter | Filter.Box && box.id === id) {
    return box
  }
  for (const child of box.children) {
    if ('children' in child) {
      if ((result = findInBox(child, id, filter))) {
        break
      }
    } else if ('tabs' in child) {
      if ((result = findInPanel(child, id, filter))) {
        break
      }
    }
  }
  return result
}

export enum Filter {
  Tab = 1,
  Panel = 1 << 1,
  Box = 1 << 2,
  Docked = 1 << 3,
  Floated = 1 << 4,
  Windowed = 1 << 5,
  Max = 1 << 6,
  EveryWhere = Docked | Floated | Windowed | Max,
  AnyTab = Tab | EveryWhere,
  AnyPanel = Panel | EveryWhere,
  AnyTabPanel = Tab | Panel | EveryWhere,
  All = Tab | Panel | Box | EveryWhere
}

export function find(layout: LayoutData, id: string, filter: Filter = Filter.AnyTabPanel): PanelData | TabData | BoxData {
  let result: PanelData | TabData | BoxData

  if (filter & Filter.Docked) {
    result = findInBox(layout.dockbox, id, filter)
  }
  return result
}

export function addNextToTab(layout: LayoutData, source: TabData | PanelData, target: TabData, direction: DropDirection): LayoutData {
  let pos = target.parent.tabs.indexOf(target)
  if (pos >= 0) {
    if (direction === 'after-tab') {
      ++pos
    }
    return addTabToPanel(layout, source, target.parent, pos)
  }
  return layout
}

export function addTabToPanel(layout: LayoutData, source: TabData | PanelData, panel: PanelData, idx = -1): LayoutData {
  if (idx === -1) {
    idx = panel.tabs.length
  }

  let tabs: TabData[]
  let activeId: string
  if ('tabs' in source) {
    // source is PanelData
    tabs = source.tabs
    activeId = source.activeId
  } else {
    // source is TabData
    tabs = [source]
  }

  if (tabs.length) {
    const newPanel = clone(panel)
    newPanel.tabs.splice(idx, 0, ...tabs)
    newPanel.activeId = tabs[tabs.length - 1].id
    for (const tab of tabs) {
      tab.parent = newPanel
    }
    if (activeId) {
      newPanel.activeId = activeId
    }
    layout = replacePanel(layout, panel, newPanel)
  }

  return layout
}

export function converToPanel(source: TabData | PanelData): PanelData {
  if ('tabs' in source) {
    // source is already PanelData
    return source
  } else {
    const newPanel: PanelData = {
      tabs: [source],
      group: source.group,
      activeId: source.id
    }
    source.parent = newPanel
    return newPanel
  }
}

export function dockPanelToPanel(layout: LayoutData, newPanel: PanelData, panel: PanelData, direction: DropDirection): LayoutData {
  const box = panel.parent

  const dockMode: DockMode = direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical'
  const afterPanel = direction === 'bottom' || direction === 'right'

  let pos = box.children.indexOf(panel)
  if (pos >= 0) {
    const newBox = clone(box)

    if (dockMode === box.mode) {
      if (afterPanel) {
        ++pos
      }
      // panel.size *= 0.5
      newPanel.size = panel.size

      newBox.children.splice(pos, 0, newPanel)
    } else {
      const newChildBox: BoxData = { mode: dockMode, children: [] }
      newChildBox.size = panel.size
      if (afterPanel) {
        newChildBox.children = [panel, newPanel]
      } else {
        newChildBox.children = [newPanel, panel]
      }
      panel.parent = newChildBox
      panel.size = 200
      newPanel.parent = newChildBox
      newPanel.size = 200
      newBox.children[pos] = newChildBox
      newChildBox.parent = newBox
    }
    layout.dockbox = newBox
    return layout
  }
  return layout
}

export function dockPanelToBox(layout: LayoutData, newPanel: PanelData, box: BoxData, direction: DropDirection): LayoutData {
  const parentBox = box.parent
  const dockMode: DockMode = direction === 'left' || direction === 'right' ? 'horizontal' : 'vertical'

  const afterPanel = direction === 'bottom' || direction === 'right'

  if (parentBox) {
    let pos = parentBox.children.indexOf(box)
    if (pos >= 0) {
      const newParentBox = clone(parentBox)
      if (dockMode === parentBox.mode) {
        if (afterPanel) {
          ++pos
        }
        newPanel.size = box.size * 0.3
        box.size *= 0.7

        newParentBox.children.splice(pos, 0, newPanel)
      } else {
        const newChildBox: BoxData = { mode: dockMode, children: [] }
        newChildBox.size = box.size
        if (afterPanel) {
          newChildBox.children = [box, newPanel]
        } else {
          newChildBox.children = [newPanel, box]
        }
        box.parent = newChildBox
        box.size = 280
        newPanel.parent = newChildBox
        newPanel.size = 120
        newParentBox.children[pos] = newChildBox
      }
      return replaceBox(layout, parentBox, newParentBox)
    }
  } else if (box === layout.dockbox) {
    const newBox = clone(box)
    if (dockMode === box.mode) {
      let pos = 0
      if (afterPanel) {
        pos = newBox.children.length
      }
      newPanel.size = box.size * 0.3
      box.size *= 0.7

      newBox.children.splice(pos, 0, newPanel)
      return replaceBox(layout, box, newBox)
    } else {
      // replace root dockbox

      const newDockBox: BoxData = { mode: dockMode, children: [] }
      newDockBox.size = box.size
      if (afterPanel) {
        newDockBox.children = [newBox, newPanel]
      } else {
        newDockBox.children = [newPanel, newBox]
      }
      newBox.size = 280
      newPanel.size = 120
      return replaceBox(layout, box, newDockBox)
    }
  }

  return layout
}

export function removeFromLayout(layout: LayoutData, source: TabData | PanelData): LayoutData {
  if (source) {
    let panelData: PanelData
    if ('tabs' in source) {
      panelData = source
      layout = removePanel(layout, panelData)
    } else {
      panelData = source.parent
      layout = removeTab(layout, source)
    }
  }
  return layout
}

function removePanel(layout: LayoutData, panel: PanelData): LayoutData {
  const box = panel.parent
  if (box) {
    const pos = box.children.indexOf(panel)
    if (pos >= 0) {
      const newBox = clone(box)
      newBox.children.splice(pos, 1)
      return replaceBox(layout, box, newBox)
    }
  }
  return layout
}

function removeTab(layout: LayoutData, tab: TabData): LayoutData {
  const panel = tab.parent
  if (panel) {
    const pos = panel.tabs.indexOf(tab)
    if (pos >= 0) {
      const newPanel = clone(panel)
      newPanel.tabs.splice(pos, 1)
      if (newPanel.activeId === tab.id) {
        // update selection id
        if (newPanel.tabs.length > pos) {
          newPanel.activeId = newPanel.tabs[pos].id
        } else if (newPanel.tabs.length) {
          newPanel.activeId = newPanel.tabs[0].id
        }
      }

      return replacePanel(layout, panel, newPanel)
    }
  }
  return layout
}
export function fixLayoutData(layout: LayoutData): LayoutData {
  function fixPanelOrBox(d: PanelData | BoxData) {
    if (d.id == null) {
      d.id = nextId()
    } else if (d.id.startsWith('+')) {
      const idnum = Number(d.id)
      if (idnum > _idCount) {
        // make sure generated id is unique
        _idCount = idnum
      }
    }
    if (!(d.size >= 0)) {
      d.size = 200
    }
    d.minWidth = 0
    d.minHeight = 0
    d.widthFlex = null
    d.heightFlex = null
  }

  function fixPanelData(panel: PanelData): PanelData {
    fixPanelOrBox(panel)
    let findActiveId = false
    if (panel.group == null && panel.tabs.length) {
      panel.group = panel.tabs[0].group
    }
    for (const child of panel.tabs) {
      child.parent = panel
      if (child.id === panel.activeId) {
        findActiveId = true
      }
      if (child.minWidth > panel.minWidth) panel.minWidth = child.minWidth
      if (child.minHeight > panel.minHeight) panel.minHeight = child.minHeight
    }
    if (!findActiveId && panel.tabs.length) {
      panel.activeId = panel.tabs[0].id
    }
    if (panel.minWidth <= 0) {
      panel.minWidth = 1
    }
    if (panel.minHeight <= 0) {
      panel.minHeight = 1
    }
    if (panel.z > _zCount) {
      // make sure next zIndex is on top
      _zCount = panel.z
    }
    return panel
  }

  function fixBoxData(box: BoxData): BoxData {
    fixPanelOrBox(box)
    for (let i = 0; i < box.children.length; ++i) {
      const child = box.children[i]
      child.parent = box
      if ('children' in child) {
        fixBoxData(child)
        if (child.children.length === 0) {
          // remove box with no child
          box.children.splice(i, 1)
          --i
        } else if (child.children.length === 1) {
          // box with one child should be merged back to parent box
          const subChild = child.children[0]
          if ((subChild as BoxData).mode === box.mode) {
            // sub child is another box that can be merged into current box
            let totalSubSize = 0
            for (const subsubChild of (subChild as BoxData).children) {
              totalSubSize += subsubChild.size
            }
            const sizeScale = child.size / totalSubSize
            for (const subsubChild of (subChild as BoxData).children) {
              subsubChild.size *= sizeScale
            }
            // merge children up
            box.children.splice(i, 1, ...(subChild as BoxData).children)
          } else {
            // sub child can be moved up one layer
            subChild.size = child.size
            box.children[i] = subChild
          }
          --i
        }
      } else if ('tabs' in child) {
        fixPanelData(child)
        if (child.tabs.length === 0) {
          // remove panel with no tab
          if (box.children.length >= 2) {
            box.children.splice(i, 1)
            --i
          } else if (child.group === placeHolderStyle && (box.children.length > 1 || box.parent)) {
            // remove placeHolder Group
            box.children.splice(i, 1)
            --i
          }
        }
      }
      // merge min size
      switch (box.mode) {
        case 'horizontal':
          if (child.minWidth > 0) box.minWidth += child.minWidth
          if (child.minHeight > box.minHeight) box.minHeight = child.minHeight
          if (child.widthFlex != null) {
            box.widthFlex = maxFlex(box.widthFlex, child.widthFlex)
          }
          if (child.heightFlex != null) {
            box.heightFlex = mergeFlex(box.heightFlex, child.heightFlex)
          }
          break
        case 'vertical':
          if (child.minWidth > box.minWidth) box.minWidth = child.minWidth
          if (child.minHeight > 0) box.minHeight += child.minHeight
          if (child.heightFlex != null) {
            box.heightFlex = maxFlex(box.heightFlex, child.heightFlex)
          }
          if (child.widthFlex != null) {
            box.widthFlex = mergeFlex(box.widthFlex, child.widthFlex)
          }
          break
      }
    }
    // add divider size
    if (box.children.length > 1) {
      switch (box.mode) {
        case 'horizontal':
          box.minWidth += (box.children.length - 1) * 4
          break
        case 'vertical':
          box.minHeight += (box.children.length - 1) * 4
          break
      }
    }

    return box
  }

  fixBoxData(layout.dockbox)

  if (layout.dockbox.children.length === 0) {
    // add place holder panel when root box is empty
    const newPanel: PanelData = {
      id: '+0',
      group: placeHolderStyle,
      size: 200,
      tabs: []
    }
    newPanel.parent = layout.dockbox
    layout.dockbox.children.push(newPanel)
  } else {
    // merge and replace root box when box has only one child
    while (layout.dockbox.children.length === 1 && 'children' in layout.dockbox.children[0]) {
      const newDockBox = clone(layout.dockbox.children[0] as BoxData)
      layout.dockbox = newDockBox
      for (const child of newDockBox.children) {
        child.parent = newDockBox
      }
    }
  }
  layout.dockbox.parent = null
  clearObjectCache()
  return layout
}

export function replacePanel(layout: LayoutData, panel: PanelData, newPanel: PanelData): LayoutData {
  for (const tab of newPanel.tabs) {
    tab.parent = newPanel
  }

  const box = panel.parent
  if (box) {
    const pos = box.children.indexOf(panel)
    if (pos >= 0) {
      const newBox = clone(box)
      newBox.children[pos] = newPanel
      return replaceBox(layout, box, newBox)
    }
  }
  return layout
}

function replaceBox(layout: LayoutData, box: BoxData, newBox: BoxData): LayoutData {
  for (const child of newBox.children) {
    child.parent = newBox
  }

  const parentBox = box.parent
  if (parentBox) {
    const pos = parentBox.children.indexOf(box)
    if (pos >= 0) {
      const newParentBox = clone(parentBox)
      newParentBox.children[pos] = newBox
      return replaceBox(layout, parentBox, newParentBox)
    }
  } else {
    if (box.id === layout.dockbox.id || box === layout.dockbox) {
      return { ...layout, dockbox: newBox }
    }
  }
  return layout
}
