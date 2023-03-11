import { AnimatePopover, Content, Toolbar, WithBorder } from '@/components/base'
import ToolbarItem from '@/components/base/toolbar/ToolbarItem'
import useRenderObject from '@/components/database/useRenderObject'
import MetaObject from '@/components/editor/elements/meta'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import { useToggle } from '@/hooks'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { PageSize } from '@/pdfViewer/core/types'
import { globalStore, LabelStore } from '@/stores'
import { labelsAtom } from '@/stores/label.store'
import { metaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { IObjectLabel } from '~/typings/data'

const ObjectLabel = ({ labelId, pageSize, documentId }: { labelId: number; pageSize: PageSize; documentId: number }) => {
  const labelAtom = useMemo(() => selectAtom(labelsAtom, l => l.get(labelId)), [labelId])
  const label = useGlobalAtomValue(labelAtom) as IObjectLabel
  const { renderWhole, renderExpand, metaObject } = useRenderObject({ metaObjectId: label.metaObjectId })
  const [innerPosition, setInnerPosition] = useState<{ x: number; y: number }>()
  const [top, left] = label?.rect || []
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [expanded, toggleExpanded] = useToggle(false)
  const rndRef = useRef<Rnd>(null)
  useLayoutEffect(() => {
    const { width, height } = pageSize
    if (top && left) {
      setInnerPosition({
        x: left * width,
        y: top * height
      })
    }
  }, [pageSize, top, left])

  useEffect(() => {
    if (!expanded) {
      rndRef.current?.updateSize({ width: 'auto', height: 'auto' })
    }
  }, [expanded])
  return (
    <Rnd
      ref={rndRef}
      onDragStop={(e, data) => {
        LabelStore.updateLabel({ id: labelId, rect: [data.y / pageSize.height, data.x / pageSize.width] })
      }}
      position={innerPosition}
      bounds="parent"
      onResizeStop={(e, dir, ele, delta, pos) => {
        LabelStore.updateLabel({ id: labelId, rect: [pos.y / pageSize.height, pos.x / pageSize.width] })
      }}
      dragHandleClassName={expanded ? 'dragHandle' : undefined}
      enableResizing={expanded}
      maxHeight="50%"
      maxWidth="50%"
      style={{
        pointerEvents: 'auto',
        zIndex: 10,
        background: 'white',
        boxShadow: '0px 0px 0px 2px #dce3e8',
        borderRadius: 4,
        padding: '6px 8px'
      }}
    >
      <AnimatePopover
        visible={popoverVisible}
        onClickOutside={togglePopoverVisible}
        positions={['top', 'bottom']}
        padding={10}
        disableIntersection
        content={
          <WithBorder>
            <Toolbar>
              <Toolbar.Item tooltip="Delete" iconName="park-delete" onClick={() => LabelStore.deleteLabel(labelId)} />
              <Toolbar.Item
                tooltip="Graph"
                iconName="park-share-one"
                onClick={() =>
                  globalStore.get(metaObjectsAtom).has(label.metaObjectId) &&
                  GlobalGraphInstance?.open(globalStore.get(metaObjectsAtom).get(label.metaObjectId)!)
                }
              />
              <Toolbar.Item
                tooltip={expanded ? 'Fold Up' : 'Expand'}
                iconName={expanded ? 'park-collapse-text-input' : 'park-expand-text-input'}
                onClick={toggleExpanded}
              ></Toolbar.Item>
            </Toolbar>
          </WithBorder>
        }
      >
        <Content fullHeight fullWidth onClick={togglePopoverVisible}>
          {expanded && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -30
              }}
              className="dragHandle"
            >
              {metaObject?.name || 'Unnamed Object'}
            </div>
          )}
          {expanded ? (
            <div
              style={{
                width: pageSize.width * 0.4,
                height: pageSize.height * 0.4,
                minWidth: '100%',
                maxHeight: '100%',
                maxWidth: '100%',
                minHeight: '100%',
                overflow: 'hidden'
              }}
            >
              {renderExpand({})}
            </div>
          ) : (
            renderWhole({
              titleOptions: {
                style: {
                  fontSize: 14,
                  cursor: 'pointer'
                }
              },
              containerStyle: {
                maxWidth: pageSize.width * 0.2,
                maxHeight: pageSize.height * 0.3,
                overflow: 'auto'
              }
            })
          )}
        </Content>
      </AnimatePopover>
    </Rnd>
  )
}

export default memo(ObjectLabel)
