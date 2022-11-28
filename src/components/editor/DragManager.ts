import { Node, Path } from 'slate'
import { ReactEditor } from 'slate-react'
import { getElementId } from '../dragReposition/utils/element'
import { getDistanceBetweenPointAndElement } from '../dragReposition/utils/position'
import { CustomEditor } from './types'
import { searchBlock } from './utils/algorithm'
import moveMultiElements from './utils/moveMultiElements'
import moveSingleElement from './utils/moveSingleElement'
import rebuildDragSelect from './utils/rebuildDragSelect'
import { getDistanceBetweenPointAndScrollableElement } from './utils/scroll'
import { ElementFunctions, ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'

type Indicator = {
  direction: string
  id: number
  isNested?: boolean
}
class DragManager {
  private blockElementsArray: HTMLElement[] = []
  private blockElementsMap = new Map<HTMLElement, any>()
  private scrollElement: HTMLElement | null = null
  private dragLayer: HTMLElement | null = null
  private dragElement: HTMLElement | null = null
  private dragElementPath: Path | null = null
  private editor: CustomEditor | null = null
  private indicator: Indicator | null = null
  private prevIndicator: Indicator | null = null
  private elementsMap: Map<number, ElementFunctions> | null = null
  registerDragElement = (dragElement: HTMLElement, dragElementPath: Path) => {
    this.dragElement = dragElement
    this.dragElementPath = dragElementPath
  }
  registerEditor = (editor: CustomEditor) => {
    this.editor = editor
    this.elementsMap = ID_TO_ELEMENTS_MAP.get(editor) || null
  }
  registerScrollElement = (scrollElement: HTMLElement) => {
    this.scrollElement = scrollElement
  }
  registerDragLayer = (dragLayer: HTMLElement) => {
    this.dragLayer = dragLayer
  }
  prepareDragging = () => {
    if (!this.scrollElement) return
    document.body.style.cursor = 'grabbing'
    this.blockElementsArray = []
    this.blockElementsMap.clear()
    // get all outermost blocks like columnList block, paragraph block
    Array.from(this.scrollElement.querySelector(`[role="textbox"]`)?.children || [])
      .filter(i => i.getAttribute('data-type') === 'block' && i instanceof HTMLElement)
      .forEach(i => {
        if (!this.scrollElement) return
        const { left, top, width, height } = i.getBoundingClientRect()
        const distance = getDistanceBetweenPointAndScrollableElement({ x: left, y: top }, this.scrollElement)
        this.blockElementsArray.push(i)
        this.blockElementsMap.set(i, {
          left: distance.left,
          top: distance.top,
          width,
          height
        })
      })
  }

  drag = (e: MouseEvent): Indicator | undefined => {
    const dragResult = (direction: string, id?: number) => {
      return {
        direction,
        id
      }
    }
    if (!this.scrollElement || !this.dragElement || !this.dragLayer || !this.editor || this.blockElementsArray.length === 0) return
    if (!this.dragLayer.hasChildNodes()) {
      const selectedBlocksSet = SELECTED_BLOCKS_MAP.get(this.editor)
      if (selectedBlocksSet && selectedBlocksSet.size > 0) {
        this.dragLayer.appendChild(rebuildDragSelect(this.editor, e) || document.createElement('div'))
      } else {
        const cloned = this.dragElement.cloneNode(true)
        const rect = this.dragElement.getBoundingClientRect()
        this.dragLayer.style.opacity = '0.5'
        this.dragLayer.style.width = `${rect?.width}px`
        this.dragLayer.style.height = `${rect?.height}px`
        this.dragLayer.appendChild(cloned)
      }
    }
    this.dragLayer.firstElementChild &&
      ((this.dragLayer.firstElementChild as HTMLElement).style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`)

    const distanceToScrollElement = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, this.scrollElement)
    const currentBlock = searchBlock(Array.from(this.blockElementsMap.entries()), distanceToScrollElement.top)
    if (currentBlock === -1) {
      // right now we need to check if dragging over the toppest / bottomest
      const firstBlock = this.blockElementsArray[0]
      const lastBlock = this.blockElementsArray[this.blockElementsArray.length - 1]
      const distanceToFirstBlock = getDistanceBetweenPointAndElement(e, firstBlock)
      const distanceToLastBlock = getDistanceBetweenPointAndElement(e, lastBlock)
      if (distanceToFirstBlock.top < 0 && distanceToFirstBlock.left > 0 && distanceToFirstBlock.right > 0) {
        return dragResult('top', getElementId(firstBlock))
      }
      if (distanceToLastBlock.bottom < 0 && distanceToLastBlock.left > 0 && distanceToLastBlock.right > 0) {
        return dragResult('bottom', getElementId(lastBlock))
      }
      return
    }
    const currentBlockId = getElementId(currentBlock)
    const previousBlock = currentBlock?.previousElementSibling
    const previousBlockId = getElementId(previousBlock)
    let draggingOverColumn = null

    // right now dragging over column list,we do not determine the top / bottom direction of column list
    if (currentBlock?.getAttribute('data-spec-type') === 'columnList') {
      const columns = currentBlock.querySelectorAll(`[data-spec-type="column"]`)
      // check if dragging over the right blank space
      const lastColumn = Array.from(columns).pop()
      if (lastColumn) {
        const distance = getDistanceBetweenPointAndElement(e, lastColumn)
        if (distance.right < 0) {
          return dragResult('right', getElementId(lastColumn))
        }
      }

      // else check if dragging between the columns or in the columns
      for (const column of columns) {
        const distance = getDistanceBetweenPointAndElement(e, column)
        if (distance.left < 0) {
          return dragResult('left', getElementId(column))
        }
        if (distance.left > 0 && distance.right > 0) {
          if (distance.top > 0 && (distance.top < currentBlock.getBoundingClientRect().height * 0.8 || distance.bottom > 0)) {
            draggingOverColumn = column
          }
          break
        }
      }
      if (draggingOverColumn) {
        const currentDraggingOverBlock = Array.from(draggingOverColumn.children).find(i => {
          const distance = getDistanceBetweenPointAndElement(e, i)
          if (distance.top > 0 && distance.bottom > 0) {
            return i
          }
        })
        // we have the dragging over block,means we are not dragging over the blank space
        if (currentDraggingOverBlock) {
          // next we need to determine the mouse pos on top 50% side or bottom 50% side
          const distance = getDistanceBetweenPointAndElement(e, currentDraggingOverBlock)
          const { height } = currentDraggingOverBlock.getBoundingClientRect()
          const currentDraggingOverBlockId = getElementId(currentDraggingOverBlock)
          if (distance.top / height < 0.5) {
            // we are on the top side and current dragging over block is the first one,so we can put the indicator above it
            if (currentDraggingOverBlock === draggingOverColumn.firstElementChild) {
              return dragResult('top', currentDraggingOverBlockId)
            } else {
              const previousBlockId = getElementId(currentDraggingOverBlock.previousElementSibling)
              // if current dragging over block is not the first child,we need to check if the indicator is under the previous block
              if (this.indicator && this.indicator.direction === 'bottom' && this.indicator.id === previousBlockId) {
                // do nothing here
                return
              } else {
                return dragResult('bottom', previousBlockId)
                // we need to put the indicator under the previous block
              }
            }
          } else {
            // now we are dragging over the bottom 50% side
            // we can't eagerly return right here because maybe we are dragging over list-item block so change indicator should be trigger for marker/line wrapper check
            return dragResult('bottom', currentDraggingOverBlockId)
          }
        } else {
          // now we are dragging over the blank space of the column,always the bottom side
          // so we should set indicator on the bottomest block
          const lastBlock = draggingOverColumn.lastElementChild
          const lastBlockId = getElementId(lastBlock)
          return dragResult('bottom', lastBlockId)
        }
      } else {
        const distance = getDistanceBetweenPointAndElement(e, currentBlock)
        const { height } = currentBlock.getBoundingClientRect()
        if (distance.top / height > 0.8) {
          return dragResult('bottom', currentBlockId)
        }
        if (distance.top / height < 0.2) {
          if (currentBlock === this.scrollElement.querySelector(`[role="textbox"]`)?.firstElementChild) {
            return dragResult('top', currentBlockId)
          } else {
            return dragResult('bottom', previousBlockId)
          }
        }
      }
    } else {
      // right now dragging over normal block,direction can be top / right / bottom / left
      // eslint-disable-next-line no-unsafe-optional-chaining
      const distance = getDistanceBetweenPointAndElement(e, currentBlock)
      const { height } = currentBlock.getBoundingClientRect()
      // right direction and left direction are more important on noraml block
      // bottom 50% -> direction is bottom of current block      top 50% -> direction is bottom of previous block,if there is no previous block,direction is top of current block
      if (distance.right < 0) {
        // direction is right
        if (getElementId(currentBlock) === getElementId(this.dragElement)) {
          return
        }
        return dragResult('right', currentBlockId)
      }
      if (distance.left < 0) {
        if (getElementId(currentBlock) === getElementId(this.dragElement)) {
          return
        }
        if (Number(currentBlock.getAttribute('data-level')) > 0) {
          return
        }
        return dragResult('left', currentBlockId)
      }
      if (distance.top / height < 0.5) {
        if (currentBlock === currentBlock.parentElement?.firstElementChild) {
          return dragResult('top', currentBlockId)
        } else {
          return dragResult('bottom', previousBlockId)
        }
      } else {
        return dragResult('bottom', currentBlockId)
      }
    }
  }
  shouldNested = (isNested: boolean) => {
    this.indicator &&
      (this.indicator = {
        ...this.indicator,
        isNested
      })
  }
  changeIndicator = (indicator: Indicator, e: MouseEvent) => {
    const { direction, id } = indicator
    if (direction === null) {
      this.indicator = null
    } else {
      this.indicator = { direction, id }
    }
    if (id) {
      const block = this.elementsMap?.get(id)
      if (!block?.changeIndicator(direction, e)) {
        this.indicator = null
      }
    }
    if (this.prevIndicator && this.prevIndicator.id === id && this.prevIndicator.direction === direction) {
      return
    } else {
      if (this.prevIndicator?.id) {
        const prevBlock = this.elementsMap?.get(this.prevIndicator.id)
        prevBlock?.changeIndicator(null)
      }
      this.prevIndicator = {
        direction,
        id
      }
    }
  }
  drop = (): boolean => {
    if (this.indicator && this.editor) {
      const { direction, isNested, id } = this.indicator
      document.body.style.cursor = 'auto'
      const currPath = this.dragElementPath
      this.elementsMap?.get(id)?.changeIndicator(null)
      this.blockElementsArray = []
      this.blockElementsMap.clear()
      this.dragElement = null
      this.dragElementPath = null
      this.indicator = null
      const selectedBlocksMap = SELECTED_BLOCKS_MAP.get(this.editor)
      const [targetElement, targetPath] = Array.from(Node.descendants(this.editor)).find(i => i[0].id === id) || []

      if (selectedBlocksMap && selectedBlocksMap.size > 0) {
        const selectedBlocks = Array.from(selectedBlocksMap.values())
        const selectedElements = selectedBlocks.map(i => this.elementsMap?.get(getElementId(i))?.getElement()).filter(i => !!i)
        if (selectedElements.length === 1) {
          const currPath = ReactEditor.findPath(this.editor, selectedElements[0])
          moveSingleElement(this.editor, currPath, targetElement, targetPath, direction, isNested)
          return true
        }
        moveMultiElements(this.editor, selectedElements, targetElement, targetPath, direction, isNested)
        return true
      }

      moveSingleElement(this.editor, currPath, targetElement, targetPath, direction, isNested)
      return true
    }
    return false
  }
}

export default DragManager
