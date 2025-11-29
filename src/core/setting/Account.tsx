import SettingGroup from '@/core/setting/SettingGroup'
import { ISettingItem } from '@/core/setting/SettingItem'
import { memo, useLayoutEffect, useState } from 'react'
import { Icon, Modal } from '@/components'
import UserService from '@/api/services/user.service'
import { Icons, KEY } from '@/consts'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import toast from 'react-hot-toast'
import isHotkey from 'is-hotkey'
import LoginService from '@/api/services/login.service'

const apikey = 'REDACTED'
const endpoint = 'https://freeimage.host/api/1/upload'
const upload = async (file: File) => {
  const form = new FormData()
  form.append('source', file)
  const res = await fetch(`${endpoint}?key=${apikey}`, {
    body: form,
    method: 'POST'
  }).then(i => i.json())
  return res.image.display_url
}
export default memo(() => {
  const [user] = UserService.useUser()
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { t } = useTranslation()
  const [changeModalState, setChangeModalState] = useState<{
    visible: boolean
    type?: 'password' | 'email'
    isLoading?: boolean
    value?: string
  }>({
    visible: false
  })

  const profileSetting: ISettingItem[] = [
    {
      type: 'item',
      column: true,
      children: (
        <div className={'flex gap-5 items-center'}>
          <div
            className={'border rounded-full size-16 relative'}
            onClick={() => {
              Global.commonOps
                ?.upload({
                  accept: 'image/*'
                })
                .then(f => {
                  if (f instanceof File) {
                    setIsUploading(true)
                    upload(f)
                      .catch(() => {
                        toast.error(t(trans.Errors.NetworkError))
                        throw ''
                      })
                      .then(res =>
                        UserService.updateUserDetails({
                          photoURL: res
                        })
                      )
                      .finally(() => {
                        setIsUploading(false)
                      })
                  }
                })
            }}
          >
            {isUploading ? (
              <div className={'absolute inset-0 items-center justify-center flex z-10 size-16'}>
                <Icon name={Icons.Loading} spin size={20} />
              </div>
            ) : (
              <>
                {user?.photoURL ? (
                  <img className={'size-16 rounded-full object-cover cursor-pointer'} src={user?.photoURL ?? ''}></img>
                ) : (
                  <Icon name={'park-user'} className={'rounded-full icon-20 size-16 flex cursor-pointer items-center justify-center'} />
                )}
              </>
            )}
          </div>
          <div>
            <div className={'font-size-12 transparent-font mb-1'}>{t(trans.Name)}</div>
            <input
              onBlur={e => {
                const v = e.target.value
                if (v !== user?.displayName) {
                  UserService.updateUserDetails({
                    displayName: v ?? ''
                  })
                }
              }}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  e.currentTarget.blur()
                }
              }}
              className={'bg-input w-72 rounded px-2 py-1 border-box-shadow focus-input'}
              defaultValue={user?.displayName}
            ></input>
          </div>
        </div>
      )
    }
  ]
  const securitySettings: ISettingItem[] = [
    {
      type: 'item',
      title: 'UID',
      description: user?.uid,
      containerClassName: '!select-auto'
    },
    {
      type: 'item',
      title: t(trans.Email),
      description: user?.email,
      children: (
        <div
          onClick={() => {
            setChangeModalState({
              visible: true,
              type: 'email'
            })
          }}
          className={'button'}
        >
          {t(trans.Settings.ChangeEmail)}
        </div>
      )
    },
    {
      type: 'item',
      title: t(trans.Password),
      children: (
        <div
          onClick={() => {
            setChangeModalState({
              visible: true,
              type: 'password'
            })
          }}
          className={'button'}
        >
          {t(trans.Settings.ChangePassword)}
        </div>
      )
    }
  ]
  const supportSettings: ISettingItem[] = [
    {
      type: 'item',
      title: t(trans.Logout),
      description: t(trans.Settings.Logout),
      children: (
        <div
          onClick={() => {
            UserService.logoutOfAllDevices()
          }}
          className={'button'}
        >
          {t(trans.Logout)}
        </div>
      )
    },
    {
      type: 'item',
      titleClassName: 'delete-font',
      title: t(trans.Settings.DeleteMyAccount),
      children: <Icon name={'park-right'} />,
      containerClassName: 'cursor-pointer',
      onClick: () => setDeleteVisible(true),
      description: t(trans.Settings.DeleteAccount.Desc)
    }
  ]
  return (
    <>
      <ChangeModal
        visible={changeModalState.visible}
        onClose={() => setChangeModalState({ visible: false })}
        type={changeModalState.type}
      />
      <DeleteModal visible={deleteVisible} onClose={() => setDeleteVisible(false)} />
      <SettingGroup title={t(trans.Settings.MyProfile)} layout={profileSetting} />
      <SettingGroup title={t(trans.Settings.AccountSecurity)} layout={securitySettings} />
      <SettingGroup title={t(trans.Settings.AccountSupport)} layout={supportSettings} />
    </>
  )
})

const ChangeModal = ({ visible, onClose, type }: { visible: boolean; onClose: VoidFunction; type: 'email' | 'password' }) => {
  const [user] = UserService.useUser()
  const [passwordState, setPasswordState] = useState<{
    current?: string
    newPassword?: string
    loading?: boolean
    repeatPassword?: string
  }>({})
  const [emailState, setEmailState] = useState<{
    code?: string
    newEmail?: string
    step: 'inputNewEmail' | 'inputCode'
    loading?: 'sendingCode' | 'verifingCode'
  }>({ step: 'inputNewEmail' })
  useLayoutEffect(() => {
    if (visible) {
      setPasswordState({})
      setEmailState({ step: 'inputNewEmail' })
    }
  }, [visible])
  const { t } = useTranslation()
  const renderMain = () => {
    if (type === 'email') {
      const validateEmail = (email?: string) => {
        const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
        if (email?.match(validRegex)) {
          return true
        } else {
          return false
        }
      }
      const handleContinue = async () => {
        if (step === 'inputNewEmail') {
          if (!(newEmail && validateEmail(newEmail))) {
            toast.error(t(trans.Errors.InvalidEmail))
            return
          }
          setEmailState(s => ({ ...s, loading: 'sendingCode' }))
          try {
            await LoginService.sendVerifyEmail(newEmail)
            toast.success(t('login.verification code has been sent to your account, please check it'))
            setEmailState(s => ({ ...s, loading: undefined, step: 'inputCode' }))
          } catch (e) {
            setEmailState(s => ({ ...s, loading: undefined }))
          }
        }
        if (step === 'inputCode') {
          if (!(code && code.length === 6 && newEmail)) {
            toast.error(t(trans.Errors.InvalidCode))
            return
          }
          setEmailState(s => ({ ...s, loading: 'verifingCode' }))
          try {
            const token = await LoginService.verifyCode(Number(code), newEmail)
            await UserService.updateEmail(newEmail, token)
            toast.success(t(trans.Success.UpdateSuccessful))
            onClose()
          } catch (e) {
            setEmailState(s => ({ ...s, loading: undefined }))
          }
        }
      }
      const { step, newEmail, code } = emailState
      return (
        <>
          <div className={'text-2xl font-bold'}>{t(trans.Settings.NewEmail)}</div>
          <div className={'mt-3'}>
            {t(trans.Settings.CurrentEmail)} <span className={'font-bold'}>{user?.email}</span>
          </div>
          <input
            onChange={e => {
              if (step === 'inputNewEmail') {
                setEmailState(s => ({ ...s, newEmail: e.target.value }))
              }
              if (step === 'inputCode') {
                setEmailState(s => ({ ...s, code: e.target.value }))
              }
            }}
            key={step}
            autoFocus
            placeholder={step === 'inputNewEmail' ? t(trans.Email) : t('login.Enter code')}
            className={classnames('w-full bg-input border-box-shadow focus-input px-3 py-1.5 rounded', 'mt-3')}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                handleContinue()
              }
            }}
          ></input>
          <div
            className={'select-button w-full gap-2 mt-6 font-medium !h-auto flex items-center justify-center !py-1.5'}
            onClick={handleContinue}
          >
            {emailState.loading && <Icon name={Icons.Loading} spin />}
            {t(trans.Continue)}
          </div>
        </>
      )
    }
    if (type === 'password') {
      const { current, newPassword, repeatPassword } = passwordState
      const handleContinue = async () => {
        if (!current || !newPassword || !repeatPassword) {
          toast.error(t(trans.Errors.MissingArgs))
          return
        }
        if (newPassword === current) {
          toast.error(t(trans.Errors.InvalidArgs))
          return
        }
        if (newPassword !== repeatPassword) {
          toast.error(t('error.Your passwords do not match'))
          return
        }
        try {
          setPasswordState(s => ({ ...s, loading: true }))
          await UserService.updatePassword(current, newPassword)
          toast.success(t(trans.Success.UpdateSuccessful))
          onClose()
        } catch (e) {
          setPasswordState(s => ({ ...s, loading: false }))
        }
      }
      return (
        <>
          <div className={'text-2xl font-bold'}>{t(trans.Settings.NewPassword)}</div>
          <div className={'transparent-font font-size-12 mb-1.5 mt-6'}>{t('settings.Enter your current password')}</div>
          <input
            onChange={e => {
              setPasswordState(s => ({ ...s, current: e.target.value }))
            }}
            type={'password'}
            autoFocus
            placeholder={t('settings.Current password')}
            className={classnames('w-full bg-input border-box-shadow focus-input px-2 py-1 rounded')}
          ></input>
          <div className={'transparent-font font-size-12 mb-1.5 mt-4'}>{t('settings.Enter a new password')}</div>
          <input
            onChange={e => {
              setPasswordState(s => ({ ...s, newPassword: e.target.value }))
            }}
            type={'password'}
            placeholder={t('settings.New password')}
            className={classnames('w-full bg-input border-box-shadow focus-input px-2 py-1 rounded')}
          ></input>
          <div className={'transparent-font font-size-12 mb-1.5 mt-4'}>{t('settings.Confirm your new password')}</div>
          <input
            onChange={e => {
              setPasswordState(s => ({ ...s, repeatPassword: e.target.value }))
            }}
            type={'password'}
            placeholder={t('settings.Confirm password')}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                handleContinue()
              }
            }}
            className={classnames('w-full bg-input border-box-shadow focus-input px-2 py-1 rounded')}
          ></input>
          <div
            className={'select-button w-full gap-2 mt-6 font-medium !h-auto flex items-center justify-center !py-1.5'}
            onClick={handleContinue}
          >
            {passwordState.loading && <Icon name={Icons.Loading} spin />}
            {t(trans.Continue)}
          </div>
        </>
      )
    }
  }
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className={'p-6 w-[90vw] max-w-lg'}>{renderMain()}</div>
    </Modal>
  )
}

const DeleteModal = ({ visible, onClose }: { visible: boolean; onClose: VoidFunction }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useTranslation()
  return (
    <Modal visible={visible} onClose={onClose}>
      <div className={'w-[90vw] max-w-md p-6 pb-3 flex flex-col items-center'}>
        <Icon name={'park-caution'} size={40} className={'delete-font mb-3'} theme={'filled'} />
        <div className={'text-xl font-semibold mb-1'}>{t(trans.Settings.DeleteAccount.ModalTitle)}</div>
        <div className={'transparent-font text-center'}>{t(trans.Settings.DeleteAccount.ModalDesc)}</div>
        <div
          onClick={() => {
            setIsLoading(true)
            UserService.deleteUser()
              .then(() => {
                setIsLoading(false)
                onClose()
              })
              .catch(() => {
                setIsLoading(false)
              })
          }}
          className={
            'button flex gap-2 items-center justify-center text-white w-full mt-3 !py-1.5 text-center font-medium hover:!bg-opacity-85 !bg-red-500'
          }
        >
          {isLoading && <Icon name={Icons.Loading} spin />}
          {t(trans.Settings.DeleteMyAccount)}
        </div>
        <div className={'button transparent-font w-fit mt-2 text-center font-medium'} onClick={onClose}>
          {t(trans.Cancel)}
        </div>
      </div>
    </Modal>
  )
}
