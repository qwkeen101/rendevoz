import { AnimatePopover, Content, Icon, Image, Modal, Tooltip, WithBorder } from '@/components/base'
import UpgradePlan from '@/components/UpgradePlan'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import LoginService, { useUser } from '@/api/services/login.service'
import { ClassName } from 'rendevoz'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { memo, useEffect, useState } from 'react'
import useFileUpload from '@/components/base/useFileUpload'
import { IUser } from '~/typings/data'
import Login, { indicatorClassName, loginInputClassName } from '@/components/Login'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'
import Colors from '@/consts/colors'
import UserService from '@/api/services/user.service'

const SidebarUser = memo(() => {
  const [user] = useUser()
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [updateUserVisible, toggleUpdateUserVisible] = useToggle(false)
  const [upgradePlanVisible, toggleUpgradPlanVisible] = useToggle(false)
  const [loginVisible, toggleLoginVisible] = useToggle(false)

  const islifetime = user?.lifetimePro === true
  const isPremium = (user?.premiumEndDate && user?.premiumEndDate > Date.now()) || islifetime
  useEffect(() => {
    if (user && loginVisible) {
      toggleLoginVisible(false)
    }
  }, [user])
  return (
    <Content
      flex
      alignItems="center"
      gap={10}
      style={{ borderBottom: `1px solid ${Colors.Background.Border}`, paddingBottom: 10, paddingTop: 2 }}
    >
      <Content auto>
        {user ? (
          <>
            <Modal noStyle visible={upgradePlanVisible} onClose={toggleUpgradPlanVisible}>
              <UpgradePlan />
            </Modal>
            <Modal noStyle visible={updateUserVisible} onClose={toggleUpdateUserVisible}>
              <UpdateUser onClose={toggleUpdateUserVisible} />
            </Modal>
            <AnimatePopover
              containerStyle={{
                zIndex: String(Zindexes.PopupMenu)
              }}
              visible={popoverVisible}
              onClickOutside={togglePopoverVisible}
              content={<UserPopover onUpdateUser={toggleUpdateUserVisible} onUpgradePlan={toggleUpgradPlanVisible} />}
              positions={['right']}
              padding={10}
              align={'start'}
            >
              <Content flex onClick={togglePopoverVisible} alignItems="center" style={{ cursor: 'pointer' }}>
                {user?.photoURL && <Image width={25} src={user.photoURL} className={css({ borderRadius: 4 })} />}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    fontSize: '12px',
                    backgroundColor: Colors.Background.ButtonHover
                  }}
                >
                  {user?.displayName?.slice(0, 2) || '?'}
                </div>
                <Tooltip content={isPremium ? 'You are premium user' : 'You are not premium user'}>
                  <Icon
                    containerStyle={{ position: 'absolute', top: -2, right: -1 }}
                    theme="filled"
                    fill={isPremium ? 'rgb(255,215,0)' : 'rgb(218,223,225)'}
                    name="park-vip"
                    size={10}
                  />
                </Tooltip>
              </Content>
            </AnimatePopover>
          </>
        ) : (
          <>
            <Icon onClick={() => toggleLoginVisible(true)} name={'park-user'} size={20} className={ClassName.flatButton(6, '4px')} />
            <Modal visible={loginVisible} onClose={toggleLoginVisible} noStyle>
              <div
                style={{
                  width: '800px',
                  height: '600px',
                  borderRadius: '16px'
                }}
              >
                <Login />
              </div>
            </Modal>
          </>
        )}
      </Content>
    </Content>
  )
})

const UserPopover = ({ onUpgradePlan, onUpdateUser }: { onUpgradePlan: VoidFunction; onUpdateUser: VoidFunction }) => {
  const [user, setUser] = useUser()
  const { t } = useTranslation()
  const isPremium = user?.premiumEndDate && user?.premiumEndDate > Date.now()
  const islifetime = user?.lifetimePro === true
  return (
    <WithBorder
      style={{
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 220
      }}
    >
      <div style={{ padding: '4px 8px' }} className={'font-size-12 transparent-font'}>
        <div>Email: {user?.email || 'Unknown Email'}</div>
        <div>UID: {user?.uid || 'Unknown UID'}</div>
      </div>
      <Content style={{ padding: '6px 8px 8px' }} flex column gap={4}>
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
            <Icon theme="filled" fill={isPremium || islifetime ? Colors.Emphasis.Emphasis : 'rgb(218,223,225)'} name="park-vip" />
          </Tooltip>
        </Content>
        {islifetime && (
          <Content
            flex
            alignItems={'center'}
            gap={8}
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: Colors.Emphasis.Emphasis
            }}
          >
            <Icon size={15} name={'park-vip-one'} />
            <div>{t('general.Lifetime Pro')}</div>
          </Content>
        )}
        {user?.premiumStartDate && user.premiumEndDate && (
          <div className={ClassName.description('12px')}>
            {t('general.premium end date')}: {DateFormat.format(user?.premiumEndDate, DateFormat.Formats.default)}
          </div>
        )}
      </Content>

      <Content flex gap={10} className={ClassName.flatButton()} onClick={onUpgradePlan}>
        <Icon size={16} name="park-vip" theme={'filled'} />
        {t('sidebar.upgrade plan')}
      </Content>
      <Content flex gap={10} className={ClassName.flatButton()} onClick={onUpdateUser}>
        <Icon size={16} name="park-me" />
        {t('sidebar.update profile')}
      </Content>
      <Content
        flex
        gap={10}
        className={ClassName.flatButton()}
        onClick={() => {
          setUser(null)
          const loginState = localStorage.getItem('loginState')
          localStorage.removeItem('userDetails')
          if (loginState) {
            localStorage.setItem(
              'loginState',
              JSON.stringify({
                ...JSON.parse(loginState),
                autoLogin: false
              })
            )
          }
        }}
      >
        <Icon size={16} name="park-logout" />
        {t('sidebar.log out')}
      </Content>
    </WithBorder>
  )
}

const UpdateUser = ({ onClose }: { onClose: VoidFunction }) => {
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

  const { t } = useTranslation()
  const handleConfirm = () => {
    LoginService.updateUserDetails(innerUser)
      .then(us => {
        setUser(u => ({ ...u, ...us.data }))
        toast.success('Successfully update user details!')
        onClose()
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
        <div style={{ fontSize: '0.857rem' }} className={indicatorClassName}>
          Name
        </div>
        <input
          style={{
            background: 'transparent'
          }}
          className={loginInputClassName}
          value={innerUser.displayName}
          onChange={e => setInnerUser({ ...innerUser, displayName: e.target.value })}
          placeholder="Type your name..."
        />
      </div>
      <div
        style={{
          color: Colors.Common.SelectColor,
          width: 'fit-content'
        }}
        onClick={() => setFormState({ passwordVisible: true })}
        className={ClassName.link()}
      >
        Reset password
      </div>
      <Content
        className={ClassName.selectButton()}
        style={{ border: `1px solid ${Colors.Background.Border}` }}
        flex
        alignItems="center"
        justifyContent="center"
        onClick={handleConfirm}
      >
        {t('general.OK')}
      </Content>
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
      <div style={{ fontSize: FontSize.Secondary }} className={indicatorClassName}>
        Current Email Address
      </div>
      <div style={{ marginBottom: 20 }}>{user.email}</div>
      <div style={{ fontSize: FontSize.Secondary }} className={indicatorClassName}>
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
  const renderPassword = () => (
    <>
      <input
        style={{
          background: 'transparent'
        }}
        className={loginInputClassName}
        defaultValue={''}
        onChange={e => setInnerUser({ ...innerUser, password: e.target.value })}
        placeholder="Type your new password..."
      />
      <Content
        className={ClassName.selectButton()}
        style={{ border: `1px solid ${Colors.Background.Border}` }}
        flex
        alignItems="center"
        justifyContent="center"
        onClick={() => {
          if (innerUser.password) {
            UserService.resetPassword(innerUser.password).then(() => {
              toast.success('Reset password successfully!')
              onClose?.()
              setUser(s => ({ ...s, password: innerUser.password }))
              const loginState = localStorage.getItem('loginState')
              if (loginState) {
                localStorage.setItem(
                  'loginState',
                  JSON.stringify({
                    ...JSON.parse(loginState),
                    password: innerUser.password
                  })
                )
              }
            })
          } else {
            toast.error('Password cannot be empty!')
          }
        }}
      >
        {t('general.OK')}
      </Content>
    </>
  )
  return (
    <Content flex column gap={16} style={{ width: 400, padding: 20, borderRadius: 10 }}>
      {formState.mainVisible && renderMain()}
      {formState.emailVisible && renderEmail()}
      {formState.passwordVisible && renderPassword()}
    </Content>
  )
}

export default SidebarUser
