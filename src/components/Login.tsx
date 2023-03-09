import { useState } from 'react'
import { Content, Icon, IconWithPopover, WithBorder } from './base'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { css } from '@emotion/css'
import googleLogo from '@/assets/google_logo.png'
import { toast } from 'react-hot-toast'
import { useToggle } from '@/hooks'
import LoginService, { useUser } from '@/services/login.service'
import ClassName from '@/styles/classNames'
import { IUser } from '~/typings/data'
import { useTranslation } from 'react-i18next'
import { useSetting } from './globalSetting/Main'
import produce from 'immer'

const provider = new GoogleAuthProvider()

export const loginInputClassName = css({
  border: 'none',
  borderBottom: '1px solid rgba(33,34,39,0.1)',
  outline: 'none',
  padding: '4px 0px',
  width: '100%',
  transition: 'all 0.2s ease',
  '::placeholder': {
    color: 'rgba(0,0,0,0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'capitalize'
  },
  ':focus': {
    '::placeholder': {
      color: 'rgba(0,0,0,0.8)'
    }
  }
})
const loginTextClassName = css({
  fontWeight: 600,
  fontSize: 30,
  marginBottom: 20
})
export const indicatorClassName = css({
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'capitalize'
})
const textDividerClassName = css({
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  width: '100%',
  '::before,::after': {
    content: '""',
    borderBottom: '1px solid silver',
    flexGrow: 1
  },
  '::before': {
    marginRight: '1rem'
  },
  '::after': {
    marginLeft: '1rem'
  }
})
const validateEmail = (email?: string) => {
  const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  if (email?.match(validRegex)) {
    return true
  } else {
    return false
  }
}
const Login = () => {
  const [user, setUser] = useState<{
    email: string
    password: string
  }>({})
  const [emailVerified, setEmailVerified] = useState(false)
  const [codeVisible, toggleCodeVisible] = useState(false)
  const [loadingState, setLoadingState] = useState<{
    isSendingVerificationCode?: boolean
    validatingEmail?: boolean
    verifingCode?: boolean
    logining?: boolean
    gettingUserDetails?: boolean
  }>()
  const [previewPassword, togglePreviewPassword] = useToggle(false)
  const [code, setCode] = useState<string>()
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [setting, setSetting] = useSetting()
  const [, setGlobalUser] = useUser()
  const { t } = useTranslation()
  const handleLogin = () => {
    setLoadingState({ logining: true })
    if (user.password) {
      if (user.password.length < 6) {
        toast.error(`${t('login.password length must be greater than 6 digits')}!`)
        setLoadingState({})
      } else {
        LoginService.login(user.email, user.password)
          .then(data => {
            setLoadingState({ gettingUserDetails: true })
            LoginService.getUserDetails(user.email, data.data.token)
              .then(user => {
                setGlobalUser(user.data)
                toast.success(`${t('login.welcome to rendevoz')}!`)
              })
              .catch(e => toast.error(`${t('login.failed to get user details')}!`))
              .finally(() => {
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
  const handleLoginWithGoogle = () => {
    const auth = getAuth()
    signInWithPopup(auth, provider)
      .then(result => {
        setGlobalUser(result.user as IUser)
        toast.success('Welcome Back!')
      })
      .catch(e => {
        toast.error('Failed to log in!')
      })
  }
  return (
    <Content fullHeight fullWidth flex alignItems="center" justifyContent="center" style={{ fontFamily: 'Muli' }}>
      <div style={{ position: 'absolute', right: 30, bottom: 30 }}>
        <IconWithPopover
          name="park-translate"
          padding={10}
          content={
            <WithBorder style={{ padding: 10 }}>
              <div
                onClick={() => {
                  setSetting(
                    produce(setting, draft => {
                      draft.general.language = 'en-US'
                    })
                  )
                }}
                className={ClassName.flatButton()}
              >
                English
              </div>
              <div
                onClick={() => {
                  setSetting(
                    produce(setting, draft => {
                      draft.general.language = 'zh-CN'
                    })
                  )
                }}
                className={ClassName.flatButton()}
              >
                简体中文
              </div>
            </WithBorder>
          }
          placement={['top']}
        ></IconWithPopover>
      </div>

      <Content flex column gap={20} style={{ width: 400 }}>
        <div className={loginTextClassName}>{t('login.login')}</div>
        <div>
          <div className={indicatorClassName}>{t('general.email address')}</div>
          <input
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
                placeholder={t('login.please input your password')}
                onChange={e => setUser({ ...user, password: e.target.value })}
              ></input>
              <Icon
                onClick={togglePreviewPassword}
                name={previewPassword ? 'park-preview-close' : 'park-preview-open'}
                className={css([{ position: 'absolute', right: 0, bottom: 2 }, ClassName.circleButton()])}
              />
            </div>
            <Content
              flex
              alignItems="center"
              gap={10}
              justifyContent="center"
              className={ClassName.flatButton()}
              style={{ border: '1px solid rgba(31,34,39,0.1)', textTransform: 'capitalize' }}
              onClick={handleLogin}
            >
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
                style={{ border: '1px solid rgba(31,34,39,0.1)', textTransform: 'capitalize' }}
                className={ClassName.flatButton()}
                onClick={handleCheckEmailExist}
                justifyContent="center"
              >
                {loadingState?.validatingEmail ? (
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
                  style={{ border: '1px solid rgba(31,34,39,0.1)' }}
                  className={ClassName.flatButton()}
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
