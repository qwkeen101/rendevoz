import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { Button, IconWithPopover, Toolbar, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { IWhiteboardAlignment, IWhiteboardLayout } from '~/typings'

export default () => {
  const { t } = useTranslation()
  const instance = useWhiteboardInstance()

  const handleAlignNodes = (alignment: IWhiteboardAlignment) => {
    const selected = instance.selectOps?.getSelectedNodes()
    console.log(selected)
    if (selected?.length) {
      instance.layoutOps?.alignNodes(selected, alignment)
      setTimeout(() => {
        instance.selectOps?.resetSelectionBox()
      })
    }
  }
  const handleSpacing = (direction: IWhiteboardLayout, spacing = 45) => {
    const selected = instance.selectOps?.getSelectedNodes()
    if (selected?.length) {
      instance.layoutOps?.layoutNodes(selected, direction, spacing)
      setTimeout(() => {
        instance.selectOps?.resetSelectionBox()
      })
    }
  }
  return (
    <>
      <Toolbar.Item tooltip="Delete" iconName="park-delete" onClick={() => {}} />
      <Toolbar.Item
        tooltip="Group"
        iconName="custom-group"
        onClick={() => {
          // setMultiSelectedBox(undefined)
          // flow.hasMultiSelectBox = false
          // updateWhiteboard(w => {
          //   const groupNodeId = Id.getId()
          //   w.nodes?.set(groupNodeId, {
          //     id: groupNodeId,
          //     type: 'group',
          //     x: left - 10,
          //     y: top - 10,
          //     width: width + 20,
          //     height: height + 20,
          //     name: 'Unnamed Group'
          //   })
          // }, true)
        }}
      />
      <Toolbar.Item tooltip="Align">
        <IconWithPopover
          name="park-left-alignment"
          size={18}
          renderOnParent={false}
          content={
            <WithBorder style={{ padding: '4px' }} width={140}>
              {[
                {
                  icon: 'align-left',
                  key: 'left'
                },
                {
                  icon: 'align-horizontally',
                  key: 'horizontallyCenter'
                },
                {
                  icon: 'align-right',
                  key: 'right'
                },
                {
                  icon: 'align-top',
                  key: 'top'
                },
                {
                  icon: 'align-vertically',
                  key: 'verticallyCenter'
                },
                {
                  icon: 'align-bottom',
                  key: 'bottom'
                }
              ].map(i => (
                <Button.IconButton
                  onClick={() => {
                    handleAlignNodes(i.key)
                  }}
                  icon={`park-${i.icon}`}
                  text={t(`general.Align ${i.key}`)}
                  key={i.key}
                />
              ))}
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item tooltip="Spacing">
        <IconWithPopover
          name="park-waterfalls-v"
          size={18}
          renderOnParent={false}
          content={
            <WithBorder style={{ padding: '4px', width: 200 }}>
              {[
                {
                  icon: 'park-horizontal-tidy-up',
                  key: 'horizontallySpacing'
                },
                {
                  icon: 'park-vertical-tidy-up',
                  key: 'verticallySpacing'
                },
                {
                  icon: 'park-application-menu',
                  key: 'byType'
                },
                {
                  icon: 'park-grid-nine',
                  key: 'auto'
                }
              ].map(i => (
                <Button.IconButton size={16} onClick={() => handleSpacing(i.key)} icon={i.icon} text={i.key} key={i.key} />
              ))}
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
    </>
  )
}
