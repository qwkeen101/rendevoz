import EventEmitter from '@/events/eventEmitter'
import Id from '@/utils/id'
import { Transforms } from 'slate'
import { getElementId, getDistanceBetweenPointAndElement } from '@/utils'
import { GlobalDragOverlayInstance, ReactEditor } from '@/core'
import { CustomEditor, CustomElement } from '~/typings'
import { searchBlock } from '../utils/algorithm'
import moveSingleElement from '../utils/moveSingleElement'
import { getDistanceBetweenPointAndScrollableElement } from '../utils/scroll'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP } from '../weakMaps'
import { checkDropCanBeMeta, normalizeDropToMeta } from '@/core/global/globalDragOverlay/useDropObject'
import { TypeToRegisteredObject } from '@/stores/object.store'

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
  event?: DragEvent
}

const getElementType = (element: globalThis.Element) => {
  const specType = element.getAttribute('data-spec-type')
  return {
    specType
  }
}
// in manager we do not change real state of editor, we just process and return result for further processing.
class DragManager {
  private blockElementsArray: HTMLElement[] = []
  private blockElementsMap = new Map<HTMLElement, any>()
  private scrollElement: HTMLElement | null = null
  public dragHtmlElement: HTMLElement | null = null
  private editor: CustomEditor | null = null
  private indicator: Indicator | null = null

  public isDraggingFromOtherEditor = false
  public eventEmitter?: EventEmitter
  public onDrop?: (result: DropResult) => void
  registerDragHtmlElement = (dragElement: HTMLElement) => {
    this.dragHtmlElement = dragElement
  }
  registerEditor = (editor: CustomEditor) => {
    this.editor = editor
  }
  registerScrollElement = (scrollElement: HTMLElement) => {
    this.scrollElement = scrollElement
  }
  public onIndicatorChange?: (indicator: Indicator) => void
  prepareDragging = () => {
    if (!this.scrollElement || !this.editor) return
    const editorNode = ReactEditor.toDOMNode(this.editor, this.editor)
    const firstChild = editorNode.children[0]
    if (this.blockElementsArray[0] === firstChild) return
    // document.body.style.cursor = 'grabbing'
    this.blockElementsArray = []
    this.blockElementsMap.clear()
    // get all outermost blocks like columnList block, paragraph block
    Array.from(editorNode.children || [])
      .filter(i => i.getAttribute('data-type') === 'block' && i instanceof HTMLElement)
      .forEach(i => {
        if (!this.scrollElement) return
        const { left, top, width, height } = i.getBoundingClientRect()
        const marginTop = parseInt(window.getComputedStyle(i).marginTop)
        const marginBottom = parseInt(window.getComputedStyle(i).marginBottom)
        const distance = getDistanceBetweenPointAndScrollableElement({ x: left, y: top - marginTop }, this.scrollElement)
        this.blockElementsArray.push(i)
        this.blockElementsMap.set(i, {
          left: distance.left,
          top: distance.top,
          width,
          height: height + marginBottom
        })
      })
  }

  public dragInTableCell = (e: PointerEvent) => {
    // cell is also like column
    // get in which cell
    const cellContainer = e.currentTarget as HTMLTableCellElement
    const result = this.dragInColumnContainer(cellContainer, e)
    if (result) {
      this.onIndicatorChange?.(result)
    }
  }
  dragResult = (direction: 'top' | 'left' | 'right' | 'bottom', id?: number, e: PointerEvent): Indicator => {
    let shouldNested = false
    if (this.editor && id) {
      const targetElement = ID_TO_ELEMENTS_MAP.get(this.editor)?.get(id)
      if (targetElement) {
        const type = targetElement.getElement().type
        if (direction === 'bottom' && (type === 'list-item' || type === 'order-list-item')) {
          const targetBound = targetElement.getClientBound()
          const mousePos = {
            x: e.clientX,
            y: e.clientY
          }
          if (targetBound) {
            const { left } = targetBound
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
  drag = (e: PointerEvent): Indicator | undefined => {
    if (!this.scrollElement || !GlobalDragOverlayInstance?.draggingDetails || !this.editor || this.blockElementsArray.length === 0) {
      return
    }
    const dragResult = this.dragResult
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
    const { specType } = getElementType(currentBlock)
    // right now dragging over column list,we do not determine the top / bottom direction of column list
    if (specType === 'columnList') {
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
        return this.dragInColumnContainer(draggingOverColumn, e)
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

      // drag in table content, handle this situation is drag in table cell
      // if drag in table margin, continue
      if (specType === 'table') {
        const tableBounding = currentBlock.getBoundingClientRect()
        const tableMarginTop = parseInt(window.getComputedStyle(currentBlock).marginTop)
        const tableMarginBottom = parseInt(window.getComputedStyle(currentBlock).marginBottom)
        const { clientY } = e
        if (
          !(
            (clientY > tableBounding.top - tableMarginTop && clientY < tableBounding.top) ||
            (clientY > tableBounding.bottom && clientY < tableBounding.bottom + tableMarginBottom)
          )
        )
          return
      }
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

  private dragInColumnContainer = (columnContainer: HTMLElement, e: PointerEvent) => {
    const dragResult = this.dragResult
    const childrenBlocks = Array.from(columnContainer.children).filter(c => c.hasAttribute('data-type'))
    const currentDraggingOverBlock = childrenBlocks.find(i => {
      const distance = getDistanceBetweenPointAndElement(e, i)
      const marginTop = parseInt(window.getComputedStyle(i).marginTop)
      const marginBottom = parseInt(window.getComputedStyle(i).marginBottom)
      if (distance.top + marginTop > 0 && distance.bottom + marginBottom > 0) {
        return i
      }
    })
    // we have the dragging over block,means we are not dragging over the blank space
    if (currentDraggingOverBlock) {
      const { specType } = getElementType(currentDraggingOverBlock)
      // drag in table, handle this situation is drag in table cell
      if (specType === 'table') {
        return
      }
      // next we need to determine the mouse pos on top 50% side or bottom 50% side
      const distance = getDistanceBetweenPointAndElement(e, currentDraggingOverBlock)
      const { height } = currentDraggingOverBlock.getBoundingClientRect()
      const currentDraggingOverBlockId = getElementId(currentDraggingOverBlock)
      if (distance.top / height < 0.5) {
        // we are on the top side and current dragging over block is the first one,so we can put the indicator above it
        if (currentDraggingOverBlock === columnContainer.firstElementChild) {
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
      // now we are dragging over the blank space of the column,decide put indicator on toppest or bottomest
      const firstBlock = childrenBlocks[0]
      const firstBlockTop = firstBlock?.getBoundingClientRect().top
      if (firstBlockTop !== undefined && e.clientY < firstBlockTop) {
        return dragResult('top', getElementId(firstBlock), e)
      }
      const lastBlock = childrenBlocks[childrenBlocks.length - 1]
      const lastBlockBottom = lastBlock?.getBoundingClientRect().bottom
      const lastBlockId = getElementId(lastBlock)
      if (lastBlockBottom !== undefined && e.clientY > lastBlockBottom) {
        return dragResult('bottom', lastBlockId, e)
      }
    }
  }

  changeIndicator = (indicator: Indicator) => {
    this.indicator = indicator
  }

  drop = async (e?: PointerEvent | DragEvent) => {
    if (this.indicator && this.editor) {
      // first get indicator
      const { direction, isNested, id } = this.indicator
      if (!id) return
      const draggingEle = GlobalDragOverlayInstance.draggingDetails
      if (!draggingEle && e !== undefined && !(e instanceof DragEvent)) return

      // this means not dragging something outside editor, such as pdf / pdf element / meta element, etc. And is dragging things of the same note.
      const isDraggingInSameNoteIdEditor = draggingEle?.type === 'noteBlock' && draggingEle.noteId === this.editor.noteId
      // reset cursor
      document.body.style.cursor = 'auto'
      const isDraggingNoteElement = draggingEle?.type === 'noteBlock'
      // we need to process this differently
      console.log('get here 2', isDraggingNoteElement, draggingEle)
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
        if (e instanceof DragEvent) {
          // not meta, just plain text drop
          const canBeMeta = checkDropCanBeMeta(e)
          if (!canBeMeta) {
            if (e.dataTransfer?.getData('text/plain')) {
              const plainText = e.dataTransfer.getData('text/plain')
              this.onDrop?.({
                targetNodeId: id,
                direction,
                isNested,
                shouldAddElements: [
                  {
                    type: 'paragraph',
                    id: Id.getId(),
                    children: [
                      {
                        text: plainText
                      }
                    ]
                  }
                ]
              })
              return
            }
          }
          this.onDrop?.({
            targetNodeId: id,
            direction,
            isNested,
            event: e
          })
          return
        }
        if (!draggingEle) return
        if (draggingEle.type && TypeToRegisteredObject.get(draggingEle.type)?.allowDropOnEditor === true) {
          needFurtherProcess = {
            objectId: 1
          }
        }
        switch (draggingEle.type) {
          // need further process: add meta object
          case 'pdfLabel': {
            draggingEle.labelId &&
              (needFurtherProcess = {
                objectId: draggingEle.labelId
              })
            break
          }
          case 'metaElement': {
            draggingEle.metaId &&
              (needFurtherProcess = {
                objectId: draggingEle.metaId
              })
            break
          }
          case 'pdf': {
            draggingEle.pdfId &&
              (needFurtherProcess = {
                objectId: draggingEle.pdfId
              })
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
          case 'note': {
            draggingEle.noteId &&
              (needFurtherProcess = {
                objectId: draggingEle.noteId
              })
            break
          }
          case 'whiteboard': {
            draggingEle.whiteboardId &&
              (needFurtherProcess = {
                objectId: draggingEle.whiteboardId
              })
            break
          }
          case 'webpageLabel': {
            draggingEle.highlightId &&
              (needFurtherProcess = {
                objectId: draggingEle.highlightId
              })
            break
          }
          case 'noteLabel': {
            draggingEle.highlightId &&
              (needFurtherProcess = {
                objectId: draggingEle.highlightId
              })
            break
          }
          case 'videoLabel': {
            draggingEle.id &&
              (needFurtherProcess = {
                objectId: draggingEle.id
              })
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
    console.log(targetPath)
    moveSingleElement(this.editor, [end], targetPath, direction, nested)
  }
}

export default DragManager
