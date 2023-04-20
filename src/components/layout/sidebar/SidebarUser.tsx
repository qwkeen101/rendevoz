import { AnimatePopover, Content, Icon, Image, Modal, Tooltip, WithBorder } from '@/components/base'
import UpgradePlan from '@/components/UpgradePlan'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import LoginService, { useUser } from '@/services/login.service'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { memo, useState } from 'react'
import useFileUpload from '@/components/base/useFileUpload'
import { IUser } from '~/typings/data'
import { indicatorClassName, loginInputClassName } from '@/components/Login'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const SidebarUser = memo(() => {
  const [user] = useUser()
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [updateUserVisible, toggleUpdateUserVisible] = useToggle(false)
  const [upgradePlanVisible, toggleUpgradPlanVisible] = useToggle(false)
  const isPremium = user?.premiumEndDate && user?.premiumEndDate > Date.now()
  return (
    <>
      <Modal noStyle visible={upgradePlanVisible} onClose={toggleUpgradPlanVisible}>
        <UpgradePlan />
      </Modal>
      <Modal visible={updateUserVisible} onClose={toggleUpdateUserVisible}>
        <UpdateUser />
      </Modal>
      <AnimatePopover
        containerStyle={{
          zIndex: String(Zindexes.PopupMenu)
        }}
        visible={popoverVisible}
        onClickOutside={togglePopoverVisible}
        content={<UserPopover onUpdateUser={toggleUpdateUserVisible} onUpgradePlan={toggleUpgradPlanVisible} />}
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
            className={css([
              {
                fontWeight: 600,
                fontFamily: 'Muli'
              },
              ClassName.ellipsisFont(1)
            ])}
          >
            {user?.displayName || 'Unnamed User'}
          </div>
          <Tooltip content={isPremium ? 'You are premium user' : 'You are not premium user'}>
            <Icon theme="filled" fill={isPremium ? 'rgb(255,215,0)' : 'rgb(218,223,225)'} name="park-vip" />
          </Tooltip>
        </Content>
      </AnimatePopover>
    </>
  )
})

const UserPopover = ({ onUpgradePlan, onUpdateUser }: { onUpgradePlan: VoidFunction; onUpdateUser: VoidFunction }) => {
  const [user, setUser] = useUser()
  const { t } = useTranslation()
  const isPremium = user?.premiumEndDate && user?.premiumEndDate > Date.now()
  return (
    <WithBorder style={{ padding: 12, display: 'flex', flexDirection: 'column', fontFamily: 'Muli', minWidth: 220 }}>
      <div style={{ padding: '0 8px' }} className={ClassName.description()}>
        Email: {user?.email || 'Unknown Email'}
      </div>
      <div style={{ padding: '0 8px' }} className={ClassName.description()}>
        Uid: {user?.uid || 'Unknown Uid'}
      </div>
      <Content style={{ padding: '12px 8px 12px' }} flex column gap={6}>
        <Content flex alignItems="center" gap={8}>
          {user?.photoURL && <Image width={25} src={user.photoURL} className={css({ borderRadius: 4 })} />}
          <div
            className={css({
              fontWeight: 600,
              fontFamily: 'Muli'
            })}
          >
            {user?.displayName || 'Unnamed User'}
          </div>
          <Tooltip content={isPremium ? 'You are premium user' : 'You are not premium user'}>
            <Icon theme="filled" fill={isPremium ? 'rgb(255,215,0)' : 'rgb(218,223,225)'} name="park-vip" />
          </Tooltip>
        </Content>
        {user?.premiumStartDate && user.premiumEndDate && (
          <div className={ClassName.description('12px')}>
            Premium: {DateFormat.format(user?.premiumStartDate, DateFormat.Formats.default)} -{' '}
            {DateFormat.format(user?.premiumEndDate, DateFormat.Formats.default)}
          </div>
        )}
      </Content>

      <Content flex gap={10} className={ClassName.flatButton()} onClick={onUpgradePlan}>
        <Icon size={16} name="park-arrow-circle-up" />
        {t('sidebar.upgrade plan')}
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()} onClick={onUpdateUser}>
        <Icon size={16} name="park-me" />
        {t('sidebar.update profile')}
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()} onClick={() => setUser(null)}>
        <Icon size={16} name="park-logout" />
        {t('sidebar.log out')}
      </Content>
    </WithBorder>
  )
}

const UpdateUser = () => {
  const [user, setUser] = useUser()
  const [innerUser, setInnerUser] = useState<IUser>({
    displayName: user?.displayName,
    photoURL: user?.photoURL
  })
  const [formState, setFormState] = useState<{
    mainVisible?: boolean
    emailVisible?: boolean
    passwordVisible?: boolean
  }>({
    mainVisible: true
  })
  const handleConfirm = () => {
    LoginService.updateUserDetails(innerUser)
      .then(us => {
        setUser(u => ({ ...u, ...us.data }))
        toast.success('Successfully update user details!')
      })
      .catch(e => toast.error('Failed to update user details!'))
  }
  const handleChangeEmail = () => {}

  const handleChangePassword = () => {}

  const { renderUploader, upload } = useFileUpload(file => {
    setInnerUser({ ...innerUser, photoURL: file.path })
  }, 'image/*')
  if (!user) return null
  const renderMain = () => (
    <>
      {/* <div onClick={upload} style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'relative', cursor: 'pointer' }}>
        {renderUploader()}
        <Image src={innerUser.photoURL || avatarPlaceholder} width={80} style={{ borderRadius: 999 }} />
        <Icon
          style={{ position: 'absolute', top: 50, right: -5, background: 'rgba(255,255,255,0.8)', borderRadius: 999, padding: 4 }}
          name="park-edit-two"
        />
      </div> */}
      <div>
        <div style={{ fontSize: 12 }} className={indicatorClassName}>
          Name
        </div>
        <input
          style={{
            background: 'transparent'
          }}
          className={loginInputClassName}
          value={innerUser.displayName}
          onChange={e => setInnerUser({ ...innerUser, displayName: e.target.value })}
          placeholder="Input your name"
        />
      </div>
      <Content
        className={ClassName.flatButton()}
        style={{ boxShadow: '0 0 0 1px rgba(31,34,39,0.1)' }}
        flex
        alignItems="center"
        justifyContent="center"
        onClick={handleConfirm}
      >
        Confirm
      </Content>
      {/* <Content>
        <div className={ClassName.description()}>More</div>
        <Content
          onClick={() => setFormState({ emailVisible: true })}
          className={ClassName.flatButton()}
          style={{ margin: '0px -8px' }}
          flex
          alignItems="center"
          justifyContent="space-between"
        >
          Change Email
          <Icon name="park-right" />
        </Content>
        <Content className={ClassName.flatButton()} style={{ margin: '0px -8px' }} flex alignItems="center" justifyContent="space-between">
          Change Password
          <Icon name="park-right" />
        </Content>
      </Content> */}
    </>
  )
  const renderEmail = () => (
    <Content flex column>
      <Icon
        onClick={() => setFormState({ mainVisible: true })}
        name="park-close"
        className={ClassName.circleButton()}
        style={{ position: 'absolute', top: 0, right: 0 }}
      />
      <div style={{ fontSize: 12 }} className={indicatorClassName}>
        Current Email Address
      </div>
      <div style={{ marginBottom: 20 }}>{user.email}</div>
      <div style={{ fontSize: 12 }} className={indicatorClassName}>
        New Email Address
      </div>
      <input placeholder="Input your new email address" style={{ background: 'transparent' }} className={loginInputClassName}></input>
      <Content
        className={ClassName.flatButton()}
        style={{ boxShadow: '0 0 0 1px rgba(31,34,39,0.1)', marginTop: 20 }}
        flex
        alignItems="center"
        justifyContent="center"
      >
        Confirm
      </Content>
    </Content>
  )
  return (
    <Content flex column gap={16} style={{ fontFamily: 'Muli', width: 400 }}>
      {formState.mainVisible && renderMain()}
      {formState.emailVisible && renderEmail()}
    </Content>
  )
}

export default SidebarUser
