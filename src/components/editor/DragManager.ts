import EventEmitter from '@/events/eventEmitter'
import Id from '@/utils/id'
import { MouseEvent } from 'react'
import { Editor, Node, Path, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { getElementId } from '../dragReposition/utils/element'
import { getDistanceBetweenPointAndElement } from '../dragReposition/utils/position'
import { AvaliableGlobalDraggingElements, GlobalDragOverlayInstance } from '../globalDragOverlay/GlobalDragOverlay'
import { CustomEditor, CustomElement } from './types'
import { searchBlock } from './utils/algorithm'
import moveMultiElements from './utils/moveMultiElements'
import moveSingleElement from './utils/moveSingleElement'
import rebuildDragSelect from './utils/rebuildDragSelect'
import { getDistanceBetweenPointAndScrollableElement } from './utils/scroll'
import { ElementFunctions, ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'

type Indicator = {
  direction: 'top' | 'left' | 'bottom' | 'right'
  id?: number
  isNested?: boolean
}
type DropResult = {
  targetNodeId: number
  direction: Indicator['direction']
  isNested: Indicator['isNested']
  shouldAddElements?: CustomElement[]
  shouldRemoveElements?: CustomElement[]
  objectId?: number
}
// in manager we do not change real state of editor, we just process and return result for further processing.
class DragManager {
  static globalDragElement: HTMLElement | null = null
  static globalDragElementPath: Path | null = null
  static globalDraggingEditor: CustomEditor | null = null

  private blockElementsArray: HTMLElement[] = []
  private blockElementsMap = new Map<HTMLElement, any>()
  private scrollElement: HTMLElement | null = null
  public dragHtmlElement: HTMLElement | null = null
  private dragElementPath: Path | null = null
  private editor: CustomEditor | null = null
  private indicator: Indicator | null = null

  static dragElementsAdded = false
  public isDraggingFromOtherEditor = false
  public eventEmitter?: EventEmitter
  public onDrop?: (result: DropResult) => void
  registerDragHtmlElement = (dragElement: HTMLElement, dragElementPath: Path) => {
    this.dragHtmlElement = dragElement
    this.dragElementPath = dragElementPath
    DragManager.globalDragElement = dragElement
    DragManager.globalDragElementPath = dragElementPath
  }
  registerEditor = (editor: CustomEditor) => {
    this.editor = editor
  }
  registerScrollElement = (scrollElement: HTMLElement) => {
    this.scrollElement = scrollElement
  }

  prepareDragging = () => {
    if (!this.scrollElement || !this.editor) return
    // document.body.style.cursor = 'grabbing'
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

  drag = (e: PointerEvent): Indicator | undefined => {
    if (
      !this.scrollElement ||
      (!this.dragHtmlElement && !GlobalDragOverlayInstance?.draggingDetails) ||
      !this.editor ||
      this.blockElementsArray.length === 0
    ) {
      return
    }
    if (!DragManager.dragElementsAdded) {
      const selectedBlocksSet = SELECTED_BLOCKS_MAP.get(this.editor)
      if (selectedBlocksSet && selectedBlocksSet.size > 0) {
        GlobalDragOverlayInstance.addDragElements?.(rebuildDragSelect(this.editor, e) || document.createElement('div'))
      } else {
        if (this.dragHtmlElement) {
          const cloned = this.dragHtmlElement.cloneNode(true)
          const rect = this.dragHtmlElement.getBoundingClientRect()
          const wrapper = document.createElement('div')
          wrapper.style.width = `${rect.width}px`
          wrapper.style.height = `${rect.height}px`
          wrapper.appendChild(cloned)
          GlobalDragOverlayInstance.addDragElements?.(wrapper)
        }
      }
      GlobalDragOverlayInstance.startDrag?.()
    }

    DragManager.dragElementsAdded = true
    const dragResult = (direction: 'top' | 'left' | 'right' | 'bottom', id?: number, e: PointerEvent): Indicator => {
      let shouldNested = false
      if (this.editor && id) {
        const targetElement = ID_TO_ELEMENTS_MAP.get(this.editor)?.get(id)
        if (targetElement) {
          if (direction === 'bottom' && targetElement.getElement().type === 'list-item') {
            const targetBound = targetElement.getClientBound()
            const mousePos = {
              x: e.clientX,
              y: e.clientY
            }
            if (targetBound) {
              const { left, width } = targetBound
              if (mousePos.x - left > 24) {
                shouldNested = true
              }
            }
          }
        }
      }
      return {
        direction,
        id,
        isNested: shouldNested
      }
    }
    const distanceToScrollElement = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, this.scrollElement)
    const currentBlock = searchBlock(Array.from(this.blockElementsMap.entries()), distanceToScrollElement.top)
    if (currentBlock === -1) {
      // right now we need to check if dragging over the toppest / bottomest
      const firstBlock = this.blockElementsArray[0]
      const lastBlock = this.blockElementsArray[this.blockElementsArray.length - 1]
      const distanceToFirstBlock = getDistanceBetweenPointAndElement(e, firstBlock)
      const distanceToLastBlock = getDistanceBetweenPointAndElement(e, lastBlock)
      if (distanceToFirstBlock.top < 0 && distanceToFirstBlock.left > 0 && distanceToFirstBlock.right > 0) {
        return dragResult('top', getElementId(firstBlock), e)
      }
      if (distanceToLastBlock.bottom < 0 && distanceToLastBlock.left > 0 && distanceToLastBlock.right > 0) {
        return dragResult('bottom', getElementId(lastBlock), e)
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
          return dragResult('right', getElementId(lastColumn), e)
        }
      }

      // else check if dragging between the columns or in the columns
      for (const column of columns) {
        const distance = getDistanceBetweenPointAndElement(e, column)
        if (distance.left < 0) {
          return dragResult('left', getElementId(column), e)
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
              return dragResult('top', currentDraggingOverBlockId, e)
            } else {
              const previousBlockId = getElementId(currentDraggingOverBlock.previousElementSibling)
              // if current dragging over block is not the first child,we need to check if the indicator is under the previous block
              if (this.indicator && this.indicator.direction === 'bottom' && this.indicator.id === previousBlockId) {
                // do nothing here
                return
              } else {
                return dragResult('bottom', previousBlockId, e)
                // we need to put the indicator under the previous block
              }
            }
          } else {
            // now we are dragging over the bottom 50% side
            // we can't eagerly return right here because maybe we are dragging over list-item block so change indicator should be trigger for marker/line wrapper check
            return dragResult('bottom', currentDraggingOverBlockId, e)
          }
        } else {
          // now we are dragging over the blank space of the column,always the bottom side
          // so we should set indicator on the bottomest block
          const lastBlock = draggingOverColumn.lastElementChild
          const lastBlockId = getElementId(lastBlock)
          return dragResult('bottom', lastBlockId, e)
        }
      } else {
        const distance = getDistanceBetweenPointAndElement(e, currentBlock)
        const { height } = currentBlock.getBoundingClientRect()
        if (distance.top / height > 0.8) {
          return dragResult('bottom', currentBlockId, e)
        }
        if (distance.top / height < 0.2) {
          if (currentBlock === this.scrollElement.querySelector(`[role="textbox"]`)?.firstElementChild) {
            return dragResult('top', currentBlockId, e)
          } else {
            return dragResult('bottom', previousBlockId, e)
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
        if (getElementId(currentBlock) === getElementId(this.dragHtmlElement)) {
          return
        }
        return dragResult('right', currentBlockId, e)
      }
      if (distance.left < 0) {
        if (getElementId(currentBlock) === getElementId(this.dragHtmlElement)) {
          return
        }
        if (Number(currentBlock.getAttribute('data-level')) > 0) {
          return
        }
        return dragResult('left', currentBlockId, e)
      }
      if (distance.top / height < 0.5) {
        if (currentBlock === currentBlock.parentElement?.firstElementChild) {
          return dragResult('top', currentBlockId, e)
        } else {
          return dragResult('bottom', previousBlockId, e)
        }
      } else {
        return dragResult('bottom', currentBlockId, e)
      }
    }
  }

  changeIndicator = (indicator: Indicator) => {
    this.indicator = indicator
  }
  private clearState = () => {
    this.blockElementsArray = []
    this.blockElementsMap.clear()
    this.dragHtmlElement = null
    this.dragElementPath = null
    this.indicator = null
    DragManager.globalDraggingEditor = null
  }

  drop = () => {
    if (this.indicator && this.editor) {
      // first get indicator
      const { direction, isNested, id } = this.indicator
      if (!id) return
      const draggingEle = GlobalDragOverlayInstance.draggingDetails
      if (!draggingEle) return
      // this means not dragging something outside editor, such as pdf / pdf element / meta element, etc. And is dragging things of the same note.
      const isDraggingInSameNoteIdEditor = draggingEle?.type === 'noteElement' && draggingEle.noteId === this.editor.noteId
      // reset cursor
      document.body.style.cursor = 'auto'
      const isDraggingNoteElement = draggingEle?.type === 'noteElement'
      // we need to process this differently
      if (isDraggingNoteElement) {
        if (!draggingEle.element && !draggingEle.elements) return
        const isMultipleDrag = draggingEle.elements !== undefined
        if (isMultipleDrag) {
          // if in same note, we just need to change the positions of the selected blocks
          if (isDraggingInSameNoteIdEditor) {
            this.onDrop?.({
              targetNodeId: id,
              isNested,
              direction,
              shouldAddElements: draggingEle.elements!,
              shouldRemoveElements: draggingEle.elements!
            })
          } else {
            this.onDrop?.({
              targetNodeId: id,
              isNested,
              direction,
              shouldAddElements: draggingEle.elements!.map(e => ({ ...e, id: Id.getId() }))
            })
          }
        } else {
          if (!draggingEle.element) return
          if (isDraggingInSameNoteIdEditor) {
            this.onDrop?.({
              targetNodeId: id,
              direction,
              isNested,
              shouldAddElements: [draggingEle.element],
              shouldRemoveElements: [draggingEle.element]
            })
          } else {
            this.onDrop?.({
              targetNodeId: id,
              direction,
              isNested,
              shouldAddElements: [
                {
                  ...draggingEle.element,
                  id: Id.getId()
                }
              ]
            })
          }
        }
      }
      // we are not dragging note elements, maybe something eles
      else {
        let ele = {
          id: Id.getId(),
          children: [{ text: '' }]
        }
        let needFurtherProcess:
          | boolean
          | {
              objectId: number
            } = false
        switch (draggingEle.type) {
          // need further process: add meta object
          case 'pdfElement': {
            draggingEle.labelId &&
              (needFurtherProcess = {
                objectId: draggingEle.labelId
              })
            break
          }
          case 'metaElement': {
            draggingEle.metaId &&
              (ele = {
                ...ele,
                type: 'metaObject',
                originId: draggingEle.metaId,
                children: [{ text: '' }]
              })
            break
          }
          // need further process: add meta object
          case 'pdf': {
            draggingEle.pdfId &&
              (needFurtherProcess = {
                objectId: draggingEle.pdfId
              })
            // ele = {
            //   type: 'pdf',
            //   pdfId: draggingEle.pdfId,
            //   children: [{ text: '' }]
            // }
            break
          }
          case 'image': {
            ele = {
              ...ele,
              type: 'image',
              url: draggingEle.url,
              children: [{ text: '' }]
            }
            break
          }
          // need further process: add meta object
          case 'note': {
            draggingEle.noteId &&
              (needFurtherProcess = {
                objectId: draggingEle.noteId
              })
            // ele = {
            //   type: 'note',
            //   noteId: draggingEle.noteId,
            //   children: [{ text: '' }]
            // }
          }
        }
        if (typeof needFurtherProcess === 'object') {
          this.onDrop?.({
            targetNodeId: id,
            direction,
            isNested,
            objectId: needFurtherProcess.objectId
          })
        } else {
          this.onDrop?.({
            targetNodeId: id,
            direction,
            isNested,
            shouldAddElements: [ele]
          })
        }
      }
    }
  }

  public insertNodeAtTargetPlace = (
    node: Partial<CustomElement>,
    targetNodeId: number,
    direction: Indicator['direction'],
    nested: Indicator['isNested']
  ) => {
    if (!this.editor) return
    const end = this.editor.children.length
    Transforms.insertNodes(this.editor, node, { at: [end] })
    const targetPath = ID_TO_PATH_MAP.get(this.editor)?.get(targetNodeId)
    if (!targetPath) return
    moveSingleElement(this.editor, [end], targetPath, direction, nested)
  }
}

export default DragManager
