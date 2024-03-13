import { Button, ButtonChooser, Content, Icon, IconWithPopover, NumberInput, Toolbar, Tooltip, WithBorder } from '@/components'
import { useAtom } from 'jotai'
import { WhiteboardSidebarStateAtom } from '@/core/components/whiteboard/sidebar/WhiteboardRightbar'
import { ClassName } from 'rendevoz'
import WhiteboardSettings from '@/core/components/whiteboard/WhiteboardSettings'
import { memo, useState } from 'react'
import { Colors } from '@/consts'
import ButtonSelect from '@/components/base/ButtonSelect'
import { exportWhiteboardAsImage } from '@/core/components/whiteboard/utils/exportAsImage'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { downloadImg } from '@/utils'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
export default memo(() => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const [rightBarState, setRightBarState] = useAtom(WhiteboardSidebarStateAtom)
  const [exportState, setExportState] = useState({
    as: 'png',
    area: 'visible',
    width: 1920,
    height: 1080
  })
  const instance = useWhiteboardInstance()
  return (
    <Content
      flex
      alignItems={'center'}
      gap={4}
      style={{
        zIndex: 10,
        position: 'absolute',
        top: 20,
        background: Colors.Background.Popover,
        boxShadow: Colors.Background.BorderBoxShadow,
        right: 24,
        width: 'fit-content',
        padding: '6px',
        borderRadius: 8
      }}
    >
      {!whiteboardState.readOnly && (
        <Toolbar disableDefaultStyle={true} style={{ gap: 4 }} itemSize={16} itemSpace={4}>
          <Toolbar.Item
            onClick={() =>
              setWhiteboardState(s => ({
                ...s,
                currentTool: s.currentTool === 'freehand' ? undefined : 'freehand',
                pointerMode: s.currentTool === 'freehand' ? s.pointerMode : 'select',
                toolbarPointerMode: s.currentTool === 'freehand' ? s.toolbarPointerMode : 'select'
              }))
            }
            style={{
              padding: 5
            }}
            className={ClassName.flatButton(4, '5px')}
            iconName="park-pencil"
            isActive={whiteboardState?.currentTool === 'freehand'}
          />
          <Toolbar.Item
            style={{
              padding: 5
            }}
            onClick={() =>
              setWhiteboardState(s => ({
                ...s,
                currentTool: s.currentTool === 'erase' ? undefined : 'erase',
                pointerMode: s.currentTool === 'erase' ? s.pointerMode : 'select',
                toolbarPointerMode: s.currentTool === 'erase' ? s.toolbarPointerMode : 'select'
              }))
            }
            className={ClassName.flatButton(4, '5px')}
            iconName="custom-eraser"
            isActive={whiteboardState?.currentTool === 'erase'}
          />
          <div
            style={{
              width: 1,
              margin: '0px 4px',
              height: '24px',
              background: Colors.Background.Border
            }}
          />
        </Toolbar>
      )}
      {rightBarState.currentTab && (
        <Tooltip content={'Side peek'}>
          <Icon
            name={'park-share-one'}
            className={ClassName.flatButton(4, '5px')}
            onClick={() => {
              setRightBarState(s => ({ ...s, visible: s.active === 'content' ? !s.visible : true, active: 'content' }))
            }}
            size={16}
          />
        </Tooltip>
      )}
      <IconWithPopover
        placement={['bottom']}
        content={
          <WithBorder width={220} padding={6} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <ButtonSelect
              value={exportState.area}
              onSelect={v => setExportState(o => ({ ...o, area: v[0] }))}
              name={'Export area'}
              options={[
                {
                  value: 'visible',
                  children: 'Visible'
                },
                {
                  value: 'whole',
                  children: 'Whole'
                }
              ]}
            />
            <Content
              style={{
                padding: '2px 8px'
              }}
              flex
              justifyContent={'space-between'}
            >
              <div>Image width (px)</div>
              <NumberInput
                style={{
                  width: 60,
                  color: Colors.Font.Transparent
                }}
                min={800}
                max={15360}
                onChange={v => setExportState(p => ({ ...p, width: v }))}
                defaultValue={exportState.width}
              />
            </Content>
            <Content
              flex
              justifyContent={'space-between'}
              style={{
                padding: '2px 8px'
              }}
            >
              <div>Image height (px)</div>
              <NumberInput
                style={{
                  width: 60,
                  color: Colors.Font.Transparent
                }}
                min={600}
                max={15360}
                onChange={v => setExportState(p => ({ ...p, height: v }))}
                defaultValue={exportState.height}
              />
            </Content>
            <Button.IconButton
              text={'Export'}
              onClick={() => {
                const allNodes = instance.getAllNode?.()
                const container = instance.getContainerNode?.()
                if (allNodes && container) {
                  exportWhiteboardAsImage(allNodes, container, instance, exportState).then(i => {
                    downloadImg(i, 'exported-image')
                  })
                }
              }}
              style={{ justifyContent: 'center', margin: '4px 6px 4px' }}
              className={ClassName.selectButton()}
            />
          </WithBorder>
        }
        tooltip={'Export'}
        size={16}
        name={'park-download-four'}
        className={ClassName.flatButton(4, '5px')}
      />
      <Tooltip content={'Contents'}>
        <Icon
          name={'park-view-list'}
          className={ClassName.flatButton(4, '5px')}
          onClick={() => {
            setRightBarState(s => ({ ...s, visible: s.active === 'outline' ? !s.visible : true, active: 'outline' }))
          }}
          size={16}
        />
      </Tooltip>
      <WhiteboardSettings />
    </Content>
  )
})
