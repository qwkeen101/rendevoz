import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import isHotkey from 'is-hotkey'
import { Icon } from './base'
import { Icons, KEY } from '@/consts'
import trans from '@/consts/trans'
import UserService from '@/api/services/user.service'
import LocalAuth, { LOCAL_PASSWORD_MIN_LENGTH, LocalAuthError } from '@/api/services/localAuth'

const inputClassName = 'focus-input rounded px-2.5 py-1.5 bg-input border-box-shadow w-full'
const labelClassName = 'font-medium text-sm mb-2 transparent-font'
const buttonClass = 'select-button !py-2 font-medium !rounded-md !h-auto px-2 flex items-center justify-center gap-2'

export const localAuthErrorText = (e: unknown, t: TFunction) => {
  if (e instanceof LocalAuthError) {
    switch (e.code) {
      case 'usernameInvalid':
        return t(trans.LocalAccount.UsernameInvalid)
      case 'usernameTaken':
        return t(trans.LocalAccount.UsernameTaken)
      case 'passwordTooShort':
        return `${t('login.password length must be greater than 6 digits')}!`
      case 'wrongCredentials':
        return t(trans.LocalAccount.WrongCredentials)
      case 'wrongPassword':
        return t(trans.Errors.IncorrectPassword)
    }
  }
  return t(trans.Errors.InvalidArgs)
}

/** Sign in / create account form for local accounts (see localAuth.ts). */
const LocalLogin = () => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'signup'>(() => (LocalAuth.hasAccounts() ? 'login' : 'signup'))
  const [form, setForm] = useState({ username: '', password: '', confirm: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const isSignup = mode === 'signup'

  const submit = async () => {
    if (loading) return
    if (!form.username.trim()) return toast.error(t(trans.LocalAccount.InputUsername))
    if (!form.password) return toast.error(`${t('login.please input your password')}!`)
    if (isSignup) {
      if (form.password.length < LOCAL_PASSWORD_MIN_LENGTH) {
        return toast.error(`${t('login.password length must be greater than 6 digits')}!`)
      }
      if (form.password !== form.confirm) return toast.error(t('error.Your passwords do not match'))
    }
    setLoading(true)
    try {
      const user = isSignup
        ? await LocalAuth.register(form.username, form.password, form.displayName)
        : await LocalAuth.login(form.username, form.password)
      // SidebarUser closes this dialog once the user is set
      UserService.updateLocalUserDetails(user)
    } catch (e) {
      toast.error(localAuthErrorText(e, t))
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, type = 'text', autoFocus = false) => (
    <div>
      <div className={labelClassName}>{label}</div>
      <input
        key={`${mode}-${key}`}
        autoFocus={autoFocus}
        type={type}
        value={form[key]}
        className={inputClassName}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        onKeyDown={e => {
          if (isHotkey(KEY.Enter, e)) submit()
        }}
      />
    </div>
  )

  return (
    <div className={'h-full w-full flex items-center justify-center'}>
      <div className={'flex flex-col gap-5 w-full max-w-lg'}>
        <div className={'text-xl md:text-3xl mb-4 font-bold'}>
          {isSignup ? t(trans.LocalAccount.CreateAccount) : t('login.login')}
        </div>
        {field('username', t(trans.LocalAccount.Username), 'text', true)}
        {isSignup && field('displayName', t(trans.LocalAccount.DisplayNameOptional))}
        {field('password', t(trans.Password), 'password')}
        {isSignup && field('confirm', t('settings.Confirm password'), 'password')}
        <div className={buttonClass} onClick={submit}>
          {loading && <Icon name={Icons.Loading} size={16} spin />}
          {isSignup ? t(trans.LocalAccount.CreateAccount) : t('login.login')}
        </div>
        <div
          className={'button w-fit text-sm transparent-font'}
          onClick={() => {
            setMode(isSignup ? 'login' : 'signup')
            setForm(f => ({ ...f, password: '', confirm: '' }))
          }}
        >
          {isSignup ? t(trans.LocalAccount.GoLogin) : t(trans.LocalAccount.GoSignup)}
        </div>
        <div className={'text-xs transparent-font'}>{t(trans.LocalAccount.Hint)}</div>
      </div>
    </div>
  )
}

export default LocalLogin
