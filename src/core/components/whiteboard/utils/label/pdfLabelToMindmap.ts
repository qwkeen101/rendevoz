import { MetaStore, ObjectStore } from '@/api/stores'
import { IPDFLabel, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import usePdfjs from '@/hooks/utils/usePdfjs'
import Id from '@/utils/id'
import { GlobalInstance } from '@/hooks'

export default async (pdfId: number) => {
  const pdf = await ObjectStore('pdf').getOneById(pdfId)
  if (pdf) {
    const labels = (await Promise.all(pdf.labels?.map(async i => await ObjectStore('pdfLabel').getOneById(i)) || [])).filter(
      i => i
    ) as IPDFLabel[]
    const document = await usePdfjs().getDocument(pdf.url).promise
    if (document) {
      const outline = await document.getOutline()
      if (!outline.length) {
        throw ''
      }
      const parseOutline = async (root: typeof outline) => {
        return await Promise.all(
          root.map(async o => {
            const dest = o.dest
            const pageIdx =
              typeof dest === 'string'
                ? await document.getDestination(dest).then(o => document.getPageIndex(o[0]))
                : await document.getPageIndex(dest[0])
            return {
              pageIdx,
              title: o.title,
              children: await parseOutline(o.items)
            }
          })
        )
      }
      const parsed = await parseOutline(outline)
      const pageIdxToLabels: Record<number, typeof labels> = {}
      labels.forEach(l => {
        const arr = pageIdxToLabels[l.page] || []
        arr.push(l)
        pageIdxToLabels[l.page] = arr
      })
      const attachLabelsToOutlineTree = (p: typeof parsed) => {
        p.forEach(i => {
          i.labels = pageIdxToLabels[i.pageIdx]
          delete pageIdxToLabels[i.pageIdx]
          attachLabelsToOutlineTree(i.children)
        })
      }
      attachLabelsToOutlineTree(parsed)
      const needAddNodes: IWhiteboardNode[] = []
      const parseOutlineTreeToMindmap = async (p: typeof parsed): IWhiteboardMindmap[] => {
        return await Promise.all(
          p.map(async i => {
            const node: IWhiteboardNode = {
              id: Id.getId(),
              type: 'text',
              x: 0,
              y: 0,
              content: [{ type: 'paragraph', id: Id.getId(), children: [{ text: i.title }] }]
            }
            const labels = i.labels as IPDFLabel[] | undefined
            const labelNodes = (
              await Promise.all(
                labels?.map(async l => {
                  const lMeta = await GlobalInstance.metaOps?.addDraggableAsMeta(
                    {
                      type: 'pdfLabel',
                      labelId: l.id
                    },
                    true
                  )
                  if (lMeta) {
                    return {
                      type: 'metaObject',
                      id: Id.getId(),
                      metaObjectId: lMeta.id,
                      x: 0,
                      y: 0
                    } as IWhiteboardNode
                  }
                }) || []
              )
            ).filter(i => i) as IWhiteboardNode[]
            const m: IWhiteboardMindmap = {
              root: node.id,
              children: [
                ...((await parseOutlineTreeToMindmap(i.children)) || []),
                ...labelNodes.map(i => ({
                  root: i.id,
                  children: []
                }))
              ]
            }
            labelNodes.forEach(n => needAddNodes.push(n))
            needAddNodes.push(node)
            return m
          })
        )
      }
      const m = await parseOutlineTreeToMindmap(parsed)
      const mId = Id.getId()
      needAddNodes.forEach(i => {
        i.rootId = mId
      })
      const pdfMeta = MetaStore.getMetaObjectByObjectId(pdfId)
      needAddNodes.push({
        id: mId,
        type: 'mindmap',
        nodeType: 'text',
        x: 0,
        y: 0,
        rightChildren: m,
        leftChildren: [],
        edgeType: 'curve',
        edgeColor: '#67C6E3',
        content: [{ type: 'paragraph', id: Id.getId(), children: [{ text: pdfMeta?.name || 'Unnamed PDF' }] }]
      })
      console.log(needAddNodes)
      return needAddNodes
    }
  }
}
