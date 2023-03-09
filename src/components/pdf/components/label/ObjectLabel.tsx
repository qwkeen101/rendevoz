import { AnimatePopover, Toolbar, WithBorder } from '@/components/base'
import ToolbarItem from '@/components/base/toolbar/ToolbarItem'
import useRenderObject from '@/components/database/useRenderObject'
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
import { useLayoutEffect, useMemo, useState } from 'react'
import { Rnd } from 'react-rnd'
import { IObjectLabel } from '~/typings/data'

const ObjectLabel = ({ labelId, pageSize, documentId }: { labelId: number; pageSize: PageSize; documentId: number }) => {
  const labelAtom = useMemo(() => selectAtom(labelsAtom, l => l.get(labelId)), [labelId])
  const label = useGlobalAtomValue(labelAtom) as IObjectLabel
  const { renderWhole } = useRenderObject({ metaObjectId: label.metaObjectId })
  const [innerPosition, setInnerPosition] = useState<{ x: number; y: number }>()
  const [top, left] = label?.rect || []
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  useLayoutEffect(() => {
    const { width, height } = pageSize
    if (top && left) {
      setInnerPosition({
        x: left * width,
        y: top * height
      })
    }
  }, [pageSize, top, left])
  return (
    <Rnd
      onDragStop={(e, data) => {
        LabelStore.updateLabel({ id: labelId, rect: [data.y / pageSize.height, data.x / pageSize.width] })
      }}
      position={innerPosition}
      bounds="parent"
      enableResizing={false}
      style={{ pointerEvents: 'auto', zIndex: 10 }}
    >
      <div
        style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, width: '100%', height: '100%' }}
        className={ClassName.Background.blurBackground}
      ></div>
      <AnimatePopover
        visible={popoverVisible}
        onClickOutside={togglePopoverVisible}
        positions={['top', 'bottom']}
        padding={10}
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
            </Toolbar>
          </WithBorder>
        }
      >
        {renderWhole({
          containerClassName: css({
            boxShadow: '0px 0px 0px 2px #dce3e8',
            borderRadius: 4,
            padding: '6px 8px'
          }),
          containerOnClick: togglePopoverVisible,
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
        })}
      </AnimatePopover>
    </Rnd>
  )
}

export default ObjectLabel
