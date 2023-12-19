import { Content, Icon, Tooltip } from '@/components'
import { useAtom } from 'jotai'
import { WhiteboardSidebarStateAtom } from '@/core/components/whiteboard/sidebar/WhiteboardRightbar'
import { ClassName } from 'rendevoz'
import WhiteboardSettings from '@/core/components/whiteboard/WhiteboardSettings'
import { Colors } from '@/consts'

export default () => {
  const [rightBarState, setRightBarState] = useAtom(WhiteboardSidebarStateAtom)
  return (
    <Content
      flex
      alignItems={'center'}
      justifyContent={'flex-end'}
      gap={4}
      style={{
        zIndex: 99,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        paddingTop: 8,
        paddingRight: 8
      }}
    >
      {rightBarState.currentTab && (
        <Tooltip content={'Side peek'}>
          <Icon
            name={'park-share-one'}
            className={ClassName.flatButton(4, '5px')}
            onClick={() => {
              setRightBarState(s => ({ ...s, visible: s.active === 'content' ? !s.visible : true, active: 'content' }))
            }}
            size={18}
            containerStyle={{
              marginRight: 6,
              pointerEvents: 'auto'
            }}
          />
        </Tooltip>
      )}
      <Tooltip content={'Contents'}>
        <Icon
          name={'park-view-list'}
          className={ClassName.flatButton(4, '5px')}
          onClick={() => {
            setRightBarState(s => ({ ...s, visible: s.active === 'outline' ? !s.visible : true, active: 'outline' }))
          }}
          size={18}
          containerStyle={{
            marginRight: 6,
            pointerEvents: 'auto'
          }}
        />
      </Tooltip>
      <WhiteboardSettings />
    </Content>
  )
}
