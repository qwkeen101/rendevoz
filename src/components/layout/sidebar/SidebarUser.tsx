import { AnimatePopover, Content, Icon, Image, Modal, WithBorder } from '@/components/base'
import UpgradePlan from '@/components/UpgradePlan'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import { useUser } from '@/services/login.service'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { memo, useState } from 'react'

const SidebarUser = memo(() => {
  const [user] = useUser()
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [modalState, setModalState] = useState<{
    visible?: boolean
    content: 'updateProfile' | 'upgrade plan'
  }>()
  const [upgradePlanVisible, toggleUpgradPlanVisible] = useToggle(false)
  return (
    <>
      <Modal visible={upgradePlanVisible} onClose={toggleUpgradPlanVisible}>
        <UpgradePlan />
      </Modal>
      <AnimatePopover
        containerStyle={{
          zIndex: String(Zindexes.PopupMenu)
        }}
        visible={popoverVisible}
        onClickOutside={togglePopoverVisible}
        content={<UserPopover onUpgradePlan={toggleUpgradPlanVisible} />}
        positions={['bottom']}
        boundaryElement={document.body}
        boundaryInset={18}
        boundaryTolerance={18}
      >
        <Content
          flex
          onClick={togglePopoverVisible}
          alignItems="center"
          gap={8}
          className={ClassName.flatButton(undefined, undefined, 'rgba(31, 34, 37, 0.08)')}
          style={{ padding: '12px 8px', marginBottom: 16, cursor: 'pointer' }}
        >
          {user?.photoURL && <Image width={25} src={user.photoURL} className={css({ borderRadius: 4 })} />}
          <div
            className={css({
              fontWeight: 600,
              fontFamily: 'Muli'
            })}
          >
            {user?.displayName || 'Unnamed User'}
          </div>
        </Content>
      </AnimatePopover>
    </>
  )
})

const UserPopover = ({ onUpgradePlan }: { onUpgradePlan: VoidFunction }) => {
  const [user, setUser] = useUser()
  return (
    <WithBorder style={{ padding: 12, display: 'flex', flexDirection: 'column', fontFamily: 'Muli' }}>
      <div style={{ padding: '0 8px' }} className={ClassName.description()}>
        Email: {user?.email || 'Unknown Email'}
      </div>
      <div style={{ padding: '0 8px' }} className={ClassName.description()}>
        Uid: {user?.uid || 'Unknown Uid'}
      </div>
      <Content flex alignItems="center" gap={8} style={{ padding: '12px 8px' }}>
        {user?.photoURL && <Image width={25} src={user.photoURL} className={css({ borderRadius: 4 })} />}
        <div
          className={css({
            fontWeight: 600,
            fontFamily: 'Muli'
          })}
        >
          {user?.displayName}
        </div>
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()} onClick={onUpgradePlan}>
        <Icon size={16} name="park-arrow-circle-up" />
        Upgrade Plan
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()}>
        <Icon size={16} name="park-me" />
        Update Profile
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()} onClick={() => setUser(null)}>
        <Icon size={16} name="park-logout" />
        Log out
      </Content>
    </WithBorder>
  )
}
export default SidebarUser
