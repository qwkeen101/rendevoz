import { AnimatePopover, Content, Icon, Toolbar, WithBorder } from '@/components'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { useWhiteboardEdges } from '@/core/components/whiteboard/StateHooks'
import { IWhiteboardEdge } from '~/typings'
import { Colors } from '@/consts'
import BlockColorPicker from '@/core/components/editor/components/BlockColorPicker'
import { defaultBgColor } from '@/components/picker/colorPicker'
import { useTranslation } from 'react-i18next'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import { getSetting } from '@/core'
const types = {
  straight: {
    icon: 'custom-straight',
    value: 'straight',
    children: 'straight'
  },
  curve: {
    icon: 'custom-curve',
    value: 'curve',
    children: 'curve'
  },
  polyline: {
    icon: 'park-connection',
    value: 'polyline',
    children: 'step'
  }
}
const styles = {
  straight: {
    icon: 'custom-straight-no-arrow',
    value: 'straight',
    width: 10,
    children: 'straight'
  },
  regular: {
    icon: 'custom-straight-no-arrow',
    value: 'regular',
    children: 'regular',
    width: 20
  },
  thick: {
    icon: 'custom-straight-no-arrow',
    value: 'thick',
    width: 30,
    children: 'thick'
  },
  dash: {
    icon: 'custom-dash',
    value: 'dash',
    children: 'dash'
  },
  animatedDash: { icon: 'custom-animated-dash', value: 'animatedDash', children: 'animated' }
}

export default ({ edgeId }: { edgeId: number }) => {
  const { t } = useTranslation()
  const instance = useWhiteboardInstance()
  const currentEdge = useWhiteboardEdges().get(edgeId) as IWhiteboardEdge | undefined
  const setting = getSetting()
  return (
    <Toolbar
      itemRadius={0}
      style={{
        gap: 0,
        height: '32px',
        overflow: 'hidden',
        borderRadius: 5
      }}
      itemStyle={{
        padding: '0px 8px',
        height: '100%'
      }}
      itemClickPreventDefault
      itemSize={16}
    >
      <Toolbar.Item
        tooltip={t('whiteboard.Edit connection')}
        iconName={'park-edit'}
        onClick={() => {
          instance.edgeOps?.getEdgeFuncs(edgeId)?.edit()
          instance.toolbarOps?.closeToolbar()
        }}
      />
      <AnimatePopover
        padding={4}
        content={setV => (
          <BlockColorPicker
            onPickBackgroundColor={c => {
              instance.updateEdge?.(edgeId, e => ({ ...e, color: c === defaultBgColor ? undefined : c }), true)
              setV(false)
            }}
            showMoreBg={false}
            showBg
            showFont={false}
          />
        )}
      >
        <Toolbar.Item tooltip={t('whiteboard.Color')} style={{ padding: '0px 8px', borderRadius: 0, height: 32 }}>
          <div
            style={{
              background: currentEdge?.color || Colors.Font.Primary,
              width: 18,
              height: 18,
              borderRadius: 4
            }}
          ></div>
        </Toolbar.Item>
      </AnimatePopover>
      <AnimatePopover
        borderRadius={4}
        padding={4}
        onClickOutside={e => {
          console.log(e)
        }}
        content={setV => (
          <WithBorder borderRadius={4}>
            <Toolbar
              itemRadius={0}
              style={{
                gap: 0,
                height: '32px',
                overflow: 'hidden',
                borderRadius: 5
              }}
              itemStyle={{
                padding: '0px 8px',
                height: '100%'
              }}
              itemClickPreventDefault
              itemSize={16}
            >
              {Object.values(types).map(i => (
                <Toolbar.Item
                  key={i.value}
                  onClick={() => {
                    instance.updateEdge?.(edgeId, e => ({ ...e, lineType: i.value }), true)
                    setV(false)
                  }}
                  iconName={i.icon}
                />
              ))}
            </Toolbar>
          </WithBorder>
        )}
      >
        <Toolbar.Item
          size={16}
          tooltip={t('whiteboard.Line style')}
          iconName={types[currentEdge?.lineType || setting.whiteboard.defaultLineType].icon}
          style={{ padding: '0px 8px', height: 32, borderRadius: 0 }}
        ></Toolbar.Item>
      </AnimatePopover>
      <AnimatePopover
        borderRadius={4}
        padding={4}
        content={setV => (
          <WithBorder borderRadius={4}>
            <Toolbar
              itemRadius={0}
              style={{
                gap: 0,
                height: '32px',
                overflow: 'hidden',
                borderRadius: 5
              }}
              itemStyle={{
                padding: '0px 8px',
                height: '100%'
              }}
              itemClickPreventDefault
              itemSize={16}
            >
              {Object.values(styles).map(i => (
                <Toolbar.Item
                  strokeWidth={i.width}
                  onClick={() => {
                    instance.updateEdge?.(edgeId, e => ({ ...e, lineStyle: i.value }), true)
                    setV(false)
                  }}
                  key={i.value}
                  iconName={i.icon}
                />
              ))}
            </Toolbar>
          </WithBorder>
        )}
      >
        <Toolbar.Item
          size={16}
          tooltip={t('whiteboard.Line thickness')}
          iconName={styles[currentEdge?.lineStyle || 'straight'].icon}
          strokeWidth={styles[currentEdge?.lineStyle || 'straight'].width}
          style={{ padding: '0px 8px', height: 32, borderRadius: 0 }}
        ></Toolbar.Item>
      </AnimatePopover>
      <Toolbar.Item
        tooltip={t('general.delete')}
        iconName={'park-delete'}
        onClick={() => {
          instance.deleteEdge?.(edgeId)
          instance.toolbarOps?.closeToolbar()
        }}
      />
    </Toolbar>
  )
}
