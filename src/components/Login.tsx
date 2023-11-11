import { useEffect, useState } from 'react'
import { CheckBox, Content, Icon } from './base'
import { css } from '@emotion/css'
import { toast } from 'react-hot-toast'
import { useGlobalAtom, useToggle } from '@/hooks'
import LoginService, { useUser } from '@/services/login.service'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import { atomWithStorage } from 'jotai/utils'

localStorage.setItem(
  'loginState',
  localStorage.getItem('loginState') ||
    JSON.stringify({
      rememberMe: false,
      autoLogin: false
    })
)
export const loginStateAtom = atomWithStorage<{
  rememberMe?: boolean
  autoLogin?: boolean
  password?: string
}>('loginState', JSON.parse(localStorage.getItem('loginState')!))
const localLoginState = JSON.parse(localStorage.getItem('loginState')!)
export const loginInputClassName = css({
  border: 'none',
  borderBottom: `1px solid ${Colors.Background.Border}`,
  outline: 'none',
  padding: '4px 0px',
  background: 'transparent',
  width: '100%',
  transition: 'all 0.2s ease'
})
const loginTextClassName = css({
  fontWeight: 600,
  fontSize: '2rem',
  marginBottom: 20
})
export const indicatorClassName = css({
  fontSize: '1rem',
  fontWeight: 500,
  textTransform: 'capitalize'
})
const validateEmail = (email?: string) => {
  const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  if (email?.match(validRegex)) {
    return true
  } else {
    return false
  }
}
let autoLogined = false
const Login = () => {
  const [loginState, setLoginState] = useGlobalAtom(loginStateAtom)
  const [emailVerified, setEmailVerified] = useState(false)
  const [codeVisible, toggleCodeVisible] = useState(false)
  const [user, setUser] = useState<{
    email: string
    password?: string
  }>({
    email: localStorage.getItem('email') || '',
    password: localLoginState.rememberMe ? localLoginState.password : undefined
  })
  const [loadingState, setLoadingState] = useState<{
    isSendingVerificationCode?: boolean
    validatingEmail?: boolean
    verifingCode?: boolean
    logining?: boolean
    gettingUserDetails?: boolean
    autoLogining?: boolean
  }>()
  const [previewPassword, togglePreviewPassword] = useToggle(false)
  const [code, setCode] = useState<string>()
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  const [, setGlobalUser] = useUser()
  const { t } = useTranslation()

  useEffect(() => {
    if (loginState.autoLogin && loginState.password && !autoLogined) {
      user.password = loginState.password
      setUser(s => ({ ...s, password: loginState.password }))

      setTimeout(() => {
        handleLogin()
        setLoadingState({ autoLogining: true })
      })
    }
  }, [])
  const handleLogin = () => {
    setLoadingState({ logining: true })
    if (user.password) {
      if (user.password.length < 6) {
        toast.error(`${t('login.password length must be greater than 6 digits')}!`)
        setLoadingState({})
      } else {
        LoginService.login(user.email, user.password)
          .then(data => {
            localStorage.setItem('email', user.email)
            if (loginState.rememberMe) {
              setLoginState(s => ({ ...s, password: user.password }))
            }
            setLoadingState({ gettingUserDetails: true })
            LoginService.getUserDetails(user.email, data.data.token)
              .then(u => {
                setGlobalUser({ ...u.data, password: user.password })
                toast.success(`${t('login.welcome to rendevoz')}!`)
              })
              .catch(e => toast.error(`${t('login.failed to get user details')}!`))
              .finally(() => {
                if (loginState.autoLogin) {
                  autoLogined = true
                }
                setLoadingState({})
              })
          })
          .catch(e => {
            toast.error(`${t('login.failed to login')}!`)
            setLoadingState({})
          })
      }
    } else {
      toast.error(`${t('login.please input your password')}!`)
      setLoadingState({})
    }
  }
  const handleCheckEmailExist = () => {
    const valid = validateEmail(user.email)
    setLoadingState({ validatingEmail: true })
    if (valid) {
      LoginService.checkEmailExist(user.email)
        .then(data => {
          if (data.data.exist) {
            setEmailVerified(true)
            setIsFirstLogin(false)
          } else {
            setLoadingState({ isSendingVerificationCode: true })
            LoginService.sendVerifyEmail(user.email)
              .then(() => {
                setLoadingState({})
                toast.success(t('login.verification code has been sent to your account, please check it'))
                toggleCodeVisible(true)
              })
              .catch(e => {
                toast.error(`${t('login.failed to send email')}!`)
                setLoadingState({})
              })
          }
        })
        .catch(e => {
          toast.error('No Email Is In Request!')
        })
    } else {
      setLoadingState({ validatingEmail: false })
      toast.error(`${t('login.invalid email')}!`)
    }
  }
  const handleVerifyCode = () => {
    if (code && code.length === 6) {
      if (user.email) {
        setLoadingState({ verifingCode: true })
        LoginService.verifyCode(Number(code), user.email)
          .then(data => {
            setLoadingState({ verifingCode: false })
            if (data) {
              setIsFirstLogin(true)
              toggleCodeVisible(false)
              setEmailVerified(true)
            }
          })
          .catch(e => {
            toast.error('Failed To Verify Code!')
            setLoadingState({ verifingCode: false })
          })
      } else {
        toast.error('Email Not Exist')
      }
    } else {
      toast.error('Please Input Code!')
    }
  }
  return (
    <Content fullHeight fullWidth flex alignItems="center" justifyContent="center">
      <Content flex column gap={20} style={{ width: 400 }}>
        <div className={loginTextClassName}>{t('login.login')}</div>
        <div>
          <div className={indicatorClassName}>{t('general.email address')}</div>
          <input
            value={user.email}
            className={loginInputClassName}
            placeholder={t('login.please input your email address')}
            onChange={e => setUser({ ...user, email: e.target.value })}
          ></input>
        </div>
        {emailVerified ? (
          <>
            <div style={{ position: 'relative' }}>
              <div className={indicatorClassName}>{t('general.password')}</div>
              <input
                type={previewPassword ? 'text' : 'password'}
                className={loginInputClassName}
                defaultValue={user.password}
                value={user.password}
                placeholder={t('login.please input your password')}
                onChange={e => setUser({ ...user, password: e.target.value })}
              ></input>
              <Icon
                onClick={togglePreviewPassword}
                name={previewPassword ? 'park-preview-close' : 'park-preview-open'}
                className={css([{ position: 'absolute', right: 0, bottom: 2 }, ClassName.circleButton()])}
              />
            </div>
            <Content flex alignItems={'center'} gap={10}>
              <CheckBox checked={loginState.rememberMe} onChange={v => setLoginState(s => ({ ...s, rememberMe: v }))} />
              <div>{t('login.remember me')}</div>
              <CheckBox checked={loginState.autoLogin} onChange={v => setLoginState(s => ({ ...s, autoLogin: v }))} />
              <div>{t('login.auto login')}</div>
            </Content>
            <Content flex alignItems="center" gap={10} justifyContent="center" className={ClassName.selectButton()} onClick={handleLogin}>
              {(loadingState?.logining || loadingState?.gettingUserDetails) && <Icon name="park-loading-one" size={20} spin />}
              {loadingState?.gettingUserDetails ? t('login.retrieving user details') : isFirstLogin ? t('login.sign up') : t('login.login')}
            </Content>
          </>
        ) : (
          <>
            {!codeVisible && (
              <Content
                flex
                gap={10}
                alignItems="center"
                className={ClassName.selectButton()}
                onClick={handleCheckEmailExist}
                justifyContent="center"
              >
                {loadingState?.autoLogining ? (
                  <>
                    <Icon size={20} spin name="park-loading-one" />
                    {t('login.auto logining')}...
                  </>
                ) : loadingState?.validatingEmail ? (
                  <>
                    <Icon size={20} spin name="park-loading-one" />
                    {t('login.validating email')}...
                  </>
                ) : loadingState?.isSendingVerificationCode ? (
                  <>
                    <Icon size={20} spin name="park-loading-one" />
                    {t('login.sending verification code')}...
                  </>
                ) : (
                  <>
                    <Icon size={20} name="park-mail" />
                    {t('login.continue with email')}
                  </>
                )}
              </Content>
            )}
            {codeVisible && (
              <>
                <div>
                  <div className={indicatorClassName}>{t('login.verification code')}</div>
                  <input
                    className={loginInputClassName}
                    placeholder={t('login.please input code')}
                    onChange={e => setCode(e.target.value)}
                  ></input>
                </div>
                <Content
                  flex
                  gap={10}
                  alignItems="center"
                  justifyContent="center"
                  className={ClassName.selectButton()}
                  onClick={handleVerifyCode}
                >
                  {loadingState?.verifingCode ? (
                    <>
                      <Icon size={20} spin name="park-loading-one" />
                      {t('login.verifing code')}
                    </>
                  ) : (
                    <>
                      <Icon size={18} name="park-protect" />
                      {t('login.verify code')}
                    </>
                  )}
                </Content>
              </>
            )}
          </>
        )}
        {/* <div className={textDividerClassName}>OR</div>

        <Content
          className={ClassName.flatButton()}
          style={{ border: '1px solid rgba(31,34,39,0.1)' }}
          onClick={handleLoginWithGoogle}
          flex
          alignItems="center"
          justifyContent="center"
          gap={10}
        >
          <img width={20} height={20} src={googleLogo} />
          <span>Continue with Google</span>
        </Content> */}
      </Content>
    </Content>
  )
}

export default Login
