import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { t } from 'i18next'
import { Button, ColorPicker, Content, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'

export const WhiteboardNodeMenuItems = (instance: IWhiteboardInstance, selected: IWhiteboardNode[]) => {
  return {
    MindmapLineOptions: {
      type: 'item',
      icon: 'park-mind-mapping',
      key: 'mindmap-line-options',
      text: t('whiteboard.Mindmap line style'),
      popOver: {
        key: 'mindmap-line-options-popover',
        node: (
          <WithBorder width={280} padding={6}>
            <div
              style={{
                paddingBottom: 3
              }}
              className={'font-size-12 transparent-font'}
            >
              {t('whiteboard.Mindmap connection type')}
            </div>
            <Content flex gap={6}>
              {[
                {
                  icon: 'park-right-branch-two',
                  text: t('whiteboard.Curve'),
                  key: 'curve'
                },
                {
                  icon: 'park-right-branch-one',
                  text: t('whiteboard.Tight curve'),
                  key: 'tightCurve'
                },
                {
                  icon: 'custom-mindmap-connection-branch',
                  text: t('whiteboard.Polyline'),
                  key: 'polyline'
                }
              ].map(i => (
                <Icon
                  onClick={() => {
                    instance.updateWhiteboard?.(w => {
                      selected.forEach(n => {
                        if (n.type === 'mindmap') {
                          const o = w.nodes?.get(n.id)
                          if (o) {
                            w.nodes?.set(o.id, {
                              ...o,
                              edgeType: i.key
                            })
                          }
                        }
                      })
                    }, true)
                  }}
                  size={22}
                  className={ClassName.flatButton(4, '3px')}
                  name={i.icon}
                  key={i.text}
                />
              ))}
            </Content>
            <div style={{ paddingTop: 8, paddingBottom: 3 }} className={'font-size-12 transparent-font'}>
              {t('whiteboard.Mindmap connection color')}
            </div>
            <ColorPicker
              onPick={v => {
                instance.updateWhiteboard?.(w => {
                  selected.forEach(n => {
                    if (n.type === 'mindmap') {
                      const o = w.nodes?.get(n.id)
                      if (o) {
                        w.nodes?.set(o.id, {
                          ...o,
                          edgeColor: v === Colors.Background.Blank ? undefined : v
                        })
                      }
                    }
                  })
                }, true)
              }}
            />
          </WithBorder>
        )
      }
    },
    BorderOptions: {
      type: 'item',
      key: 'border-options',
      icon: 'custom-border',
      text: t('whiteboard.Border style'),
      popOver: {
        key: 'border-options-popover',
        node: (
          <WithBorder width={280} padding={6}>
            <div className={'font-size-12 transparent-font'} style={{ paddingBottom: 3 }}>
              {t('whiteboard.Border type')}
            </div>
            <Content flex gap={6}>
              {[
                {
                  icon: 'custom-rect',
                  text: t('whiteboard.Rect border'),
                  key: 'rect'
                },
                {
                  icon: 'custom-round-rect',
                  text: t('whiteboard.Round rect border'),
                  key: 'roundRect'
                },
                {
                  icon: 'custom-round',
                  text: t('whiteboard.Round border'),
                  key: 'round'
                },
                {
                  icon: 'custom-border-bottom',
                  text: t('whiteboard.Underline border'),
                  key: 'underline'
                }
              ].map(i => (
                <Icon
                  size={22}
                  className={ClassName.flatButton(4, '3px')}
                  name={i.icon}
                  key={i.text}
                  onClick={() => {
                    instance.updateWhiteboard?.(w => {
                      selected.forEach(n => {
                        const o = w.nodes?.get(n.id)
                        if (o) {
                          w.nodes?.set(o.id, {
                            ...o,
                            borderType: i.key
                          })
                        }
                      })
                    }, true)
                  }}
                />
              ))}
            </Content>
            <div style={{ paddingTop: 8, paddingBottom: 3 }} className={'font-size-12 transparent-font'}>
              {t('whiteboard.Border color')}
            </div>
            <ColorPicker
              onPick={v => {
                instance.updateWhiteboard?.(w => {
                  selected.forEach(n => {
                    const o = w.nodes?.get(n.id)
                    if (o) {
                      w.nodes?.set(o.id, {
                        ...o,
                        border: v === Colors.Background.Blank ? undefined : v
                      })
                    }
                  })
                }, true)
              }}
            />
          </WithBorder>
        )
      }
    }
  }
}
