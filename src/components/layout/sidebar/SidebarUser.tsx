import { AnimatePopover, Button, Content, Icon, Image, Modal, Tooltip, WithBorder } from '@/components/base'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import DateFormat from '@/utils/dateFormat'
import { memo, ReactElement, useEffect } from 'react'
import Login from '@/components/Login'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import UserService from '@/api/services/user.service'
import trans from '@/consts/trans'
import { GlobalSetting } from '@/core'

const SidebarUser = memo(({ extra }: { extra?: ReactElement }) => {
  const [user] = UserService.useUser()
  const [popoverVisible, togglePopoverVisible] = useToggle(false)
  const [loginVisible, toggleLoginVisible] = useToggle(false)
  useEffect(() => {
    if (user && user.displayName !== undefined && loginVisible) {
      toggleLoginVisible(false)
    }
    if (!user?.uid) {
      togglePopoverVisible(false)
    }
  }, [user])
  if (user) {
    return (
      <AnimatePopover
        containerStyle={{
          zIndex: String(Zindexes.PopupMenu)
        }}
        visible={popoverVisible}
        onClickOutside={() => togglePopoverVisible(false)}
        content={<UserPopover onClose={() => togglePopoverVisible(false)} />}
        positions={['bottom']}
        padding={4}
        align={'start'}
      >
        <div onClick={() => togglePopoverVisible()} className={'flex mb-2 items-center button gap-2 !p-2 primary-font'}>
          <img src={user.photoURL} className={'rounded-md size-6 object-cover mr-1'} />
          <div>{user.displayName}</div>
          {extra}
        </div>
      </AnimatePopover>
    )
  }
  return (
    <>
      <div onClick={() => toggleLoginVisible(true)} className={'flex items-center button gap-2 mb-2 !p-2 primary-font'}>
        <Icon name={'park-login'} size={18} />
        <div className={'ml-1'}>Login</div>
        {extra}
      </div>
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
  )
})

const UserPopover = ({ onClose }: { onClose: VoidFunction }) => {
  const [user] = UserService.useUser()
  const { t } = useTranslation()
  const isPro = UserService.useIsUserPro(false)
  const isLifetime = UserService.useIsUserLifetime()
  return (
    <WithBorder
      style={{
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 220
      }}
    >
      <div style={{ padding: '4px 8px' }} className={'text-xs leading-normal transparent-font'}>
        <div>Email: {user?.email || 'Unknown Email'}</div>
        <div>UID: {user?.uid || 'Unknown UID'}</div>
      </div>
      <Content style={{ padding: '4px 8px 8px' }} className={'border-bottom mb-1.5'} flex column gap={4}>
        <Content flex alignItems="center" gap={8}>
          {user?.photoURL && <img className={'object-cover size-7 rounded'} src={user.photoURL} />}
          <div className={'font-medium max-w-64 break-all line-clamp-1'}>{user?.displayName || 'Unnamed User'}</div>
          <Tooltip>
            <Icon theme="filled" fill={isPro || isLifetime ? Colors.Emphasis.Emphasis : 'rgb(218,223,225)'} name="park-vip" />
          </Tooltip>
        </Content>
        {isLifetime && (
          <Content flex alignItems={'center'} gap={8} className={'font-size-12 text-yellow-500'}>
            <Icon size={15} name={'park-vip-one'} />
            <div>{t('general.Lifetime Pro')}</div>
          </Content>
        )}
        {user?.premiumStartDate && user.premiumEndDate && (
          <div className={'transparent-font font-size-12'}>
            {t('general.premium end date')}: {DateFormat.format(user?.premiumEndDate, DateFormat.Formats.yearMonthDays)}
          </div>
        )}
        {!isPro && !isLifetime && <div className={'transparent-font max-w-64 font-size-12'}>{t(trans.Settings.FreePlanDesc)}</div>}
      </Content>
      {!isPro && !isLifetime && (
        <Button.IconButton
          text={t('general.Subscription')}
          icon={'park-crown'}
          iconClassName={'text-yellow-500'}
          theme={'filled'}
          onClick={() => {
            onClose()
            setTimeout(() => GlobalSetting.focusSetting('subscription'), 300)
          }}
        ></Button.IconButton>
      )}
      <Button.IconButton
        text={t(trans.Settings.MyAccount)}
        icon={'park-user'}
        onClick={() => {
          onClose()
          setTimeout(() => GlobalSetting.focusSetting('account'), 300)
        }}
      ></Button.IconButton>
      <Button.IconButton
        text={t(trans.Logout)}
        icon={'park-logout'}
        onClick={() => {
          UserService.logout()
        }}
      ></Button.IconButton>
    </WithBorder>
  )
}

export default SidebarUser
