import pdfLabelToMindmap from '@/core/components/whiteboard/utils/label/pdfLabelToMindmap'
import { MetaStore, ObjectStore } from '@/api/stores'
import { memo, useEffect, useState } from 'react'
import { Whiteboard } from '@/core'
import { getBoxOfBoxes } from '@/core/components/whiteboard/utils'
import { Content, Icon } from '@/components'
import { LabelDetailsContext } from '@/core/object/renderer/LabelDetailsContext'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { IWhiteboard } from '~/typings'
import { Icons } from '@/consts'
import { useSelectAtomValue } from '@/hooks'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import EmptyList from '@/core/components/common/EmptyList'

const layout = {
  showControlBar: false,
  showSetting: false,
  showContents: false
}
export default memo(({ id }: { id: number }) => {
  const labelIds = useSelectAtomValue(PDFStateAtom, s => s.document?.labels)
  const [mindmapTempId, setMindmapTempId] = useState<number>()
  const [valid, setValid] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const instance = usePDFInstance()
  useEffect(() => {
    instance.getDocument?.().then(doc => {
      doc.getOutline().then(o => {
        if (!o.length) {
          setValid(false)
        } else {
          setValid(true)
        }
      })
    })
  }, [])
  const getMindmap = async () => {
    let prev: IWhiteboard | undefined = undefined
    if (mindmapTempId) {
      prev = await ObjectStore('whiteboard').getOneById(mindmapTempId)
    }
    pdfLabelToMindmap(id, prev).then(nodes => {
      console.log(nodes, prev)
      if (nodes) {
        if (mindmapTempId) {
          ObjectStore('whiteboard').updateOne({ id: mindmapTempId, nodes: new Map(nodes.map(i => [i.id, i])), edges: new Map() })
          return
        }
        ObjectStore('whiteboard')
          .addOne({
            nodes: new Map(nodes.map(i => [i.id, i])),
            edges: new Map()
          })
          .then(w => {
            setMindmapTempId(w.id)
          })
      }
    })
  }
  useEffect(() => {
    if (valid) {
      getMindmap()
    }
  }, [labelIds, valid])

  useEffect(() => {
    return () => {
      if (mindmapTempId) {
        setTimeout(() => {
          ObjectStore('whiteboard').deleteOneById(mindmapTempId)
        }, 100)
      }
    }
  }, [mindmapTempId])
  return (
    <Content fullWidth fullHeight>
      {!valid && <EmptyList className={'h-full'} />}
      {valid && !initialized && (
        <div
          className={'flex items-center justify-center transparent-font'}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10
          }}
        >
          <Icon name={Icons.Loading} size={48} spin />
        </div>
      )}
      <Content
        fullHeight
        style={{
          visibility: valid && !initialized ? 'hidden' : 'visible',
          opacity: valid && !initialized ? 0 : 1,
          transition: 'opacity 0.6s ease'
        }}
      >
        {mindmapTempId && (
          <LabelDetailsContext.Provider value={{ showSource: false, showAddNote: false }}>
            <Whiteboard
              onInstanceInitialized={i => {
                console.log(i)
                setTimeout(() => {
                  const doms = i.nodeOps?.getDOMBoxOfNodes((i.getAllNode?.() || []).map(i => i.id))
                  if (doms) {
                    const box = getBoxOfBoxes(Array.from(Object.values(doms)))
                    box && i.containerOps?.fitTo(box, { skipAnimation: true })
                  }
                  i.addEventListener('nodeClick', async e => {
                    console.log(e)
                    if ('pageIndex' in e.node) {
                      const idx = e.node.pageIndex as number
                      instance.navigateOps?.jumpToPage(idx)
                    }
                    if (e.node.type === 'metaObject') {
                      const metaId = e.node.metaObjectId
                      const meta = MetaStore.getCachedMetaObject(metaId)
                      if (meta && meta.objectId && meta.type === 'pdfLabel') {
                        const obj = await ObjectStore('pdfLabel').getOneById(meta.objectId)
                        if (obj) {
                          instance.navigateOps?.jumpToLabel(obj.id)
                        }
                      }
                    }
                  })
                  setInitialized(true)
                }, 500)
              }}
              readOnly
              layout={layout}
              state={{
                enableClickNodeWhenPanning: true
              }}
              whiteboardId={mindmapTempId}
            />
          </LabelDetailsContext.Provider>
        )}
      </Content>
    </Content>
  )
})
