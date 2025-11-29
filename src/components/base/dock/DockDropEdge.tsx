import React from 'react'
import { BoxData, DockContext, DockContextType, DockMode, DropDirection, PanelData, TabData } from './DockData'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DragState } from './dragdrop/DragManager'

interface DockDropEdgeProps {
  panelData: PanelData
  panelElement: HTMLElement
}

export class DockDropEdge extends React.PureComponent<DockDropEdgeProps, any> {
  static contextType = DockContextType

  context!: DockContext

  _ref: HTMLDivElement
  getRef = (r: HTMLDivElement) => {
    this._ref = r
  }

  getDirection(e: DragState, samePanel: boolean): { direction: DropDirection; mode?: DockMode; depth: number } {
    const rect = this._ref.getBoundingClientRect()
    const widthRate = Math.min(rect.width, 500)
    const heightRate = Math.min(rect.height, 500)
    const left = (e.clientX - rect.left) / widthRate
    const right = (rect.right - e.clientX) / widthRate
    const top = (e.clientY - rect.top) / heightRate
    const bottom = (rect.bottom - e.clientY) / heightRate
    let min = Math.min(left, right, top, bottom)
    let depth = 0
    if (samePanel) {
      // use an impossible min value to disable dock drop
      min = 1
    }
    if (min < 0) {
      return { direction: null, depth: 0 }
    } else if (min < 0.075) {
      depth = 3 // depth 3 or 4
    } else if (min < 0.15) {
      depth = 1 // depth 1 or 2
    } else if (min < 0.3) {
      // default
    }
    switch (min) {
      case left: {
        return { direction: 'left', mode: 'horizontal', depth }
      }
      case right: {
        return { direction: 'right', mode: 'horizontal', depth }
      }
      case top: {
        return { direction: 'top', mode: 'vertical', depth }
      }
      case bottom: {
        return { direction: 'bottom', mode: 'vertical', depth }
      }
    }
    // probably a invalid input causing everything to be NaN?
    return { direction: null, depth: 0 }
  }

  getActualDepth(depth: number, mode: DockMode, direction: DropDirection): number {
    const afterPanel = direction === 'bottom' || direction === 'right'
    if (!depth) {
      return depth
    }
    const { panelData } = this.props
    let previousTarget: BoxData | PanelData = panelData
    let targetBox: BoxData = panelData.parent
    let lastDepth = 0
    if (panelData.parent.mode === mode) {
      ++depth
    }
    while (targetBox && lastDepth < depth) {
      if (targetBox.mode === mode) {
        if (afterPanel) {
          if (targetBox.children[targetBox.children.length - 1] !== previousTarget) {
            // dont go deeper if current target is on different side of the box
            break
          }
        } else {
          if (targetBox.children[0] !== previousTarget) {
            // dont go deeper if current target is on different side of the box
            break
          }
        }
      }
      previousTarget = targetBox
      targetBox = targetBox.parent
      ++lastDepth
    }
    while (depth > lastDepth) {
      depth -= 2
    }
    return depth
  }

  onDragOver = (e: DragState) => {
    const { panelData, panelElement } = this.props
    const dockId = this.context.getDockId()
    const draggingPanel = DragState.getData('panel', dockId)
    let { direction, mode, depth } = this.getDirection(e, draggingPanel === panelData)
    depth = this.getActualDepth(depth, mode, direction)
    if (!direction) {
      this.context.setDropRect(null, 'remove', this)
      return
    }
    let targetElement = panelElement
    for (let i = 0; i < depth; ++i) {
      targetElement = targetElement.parentElement
    }
    this.context.setDropRect(targetElement, direction, this)
    e.accept('')
  }

  onDragLeave = (e: DragState) => {
    this.context.setDropRect(null, 'remove', this)
  }

  onDrop = (e: DragState) => {
    const { panelData } = this.props
    const dockId = this.context.getDockId()
    let source: TabData | PanelData = DragState.getData('tab', dockId)
    const draggingPanel = DragState.getData('panel', dockId)
    if (!source) {
      source = draggingPanel
    }
    if (source) {
      let { direction, mode, depth } = this.getDirection(e, draggingPanel === panelData)
      depth = this.getActualDepth(depth, mode, direction)
      if (!direction) {
        return
      }
      let target: PanelData | BoxData = panelData
      for (let i = 0; i < depth; ++i) {
        target = target.parent
      }
      this.context.dockMove(source, target, direction)
    }
  }

  render(): React.ReactNode {
    return (
      <DragDropDiv
        ref={r => (this._ref = r)}
        className="dock-drop-edge"
        onDragOverT={this.onDragOver}
        onDragLeaveT={this.onDragLeave}
        onDropT={this.onDrop}
      />
    )
  }

  componentWillUnmount(): void {
    this.context.setDropRect(null, 'remove', this)
  }
}
