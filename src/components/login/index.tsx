import { useRef, useState } from 'react'
import { Content, Icon, Modal } from '../base'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth'
import { css } from '@emotion/css'
import googleLogo from '@/assets/google_logo.png'
import { toast } from 'react-hot-toast'
import { useToggle } from '@/hooks'
import BorderInput from '../base/BorderInput'
import LoginService, { useUser } from '@/services/login.service'
import { Button } from '../base/button'
import ClassName from '@/styles/classNames'
import { IUser } from '~/typings/data'

const provider = new GoogleAuthProvider()

const loginInputClassName = css({
  border: 'none',
  borderBottom: '1px solid rgba(33,34,39,0.1)',
  outline: 'none',
  padding: '4px 0px',
  width: '100%',
  transition: 'all 0.2s ease',
  '::placeholder': {
    color: 'rgba(0,0,0,0.3)',
    transition: 'all 0.2s ease'
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
const indicatorClassName = css({
  fontSize: 13,
  fontWeight: 500
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
  }>()
  const [previewPassword, togglePreviewPassword] = useToggle(false)
  const [code, setCode] = useState<string>()
  const [isFirstLogin, setIsFirstLogin] = useState(false)

  const [globalUser, setGlobalUser] = useUser()
  const handleLogin = () => {
    setLoadingState({ logining: true })
    if (user.password) {
      if (user.password.length < 6) {
        toast.error('Password length must be greater than 6 digits!')
        setLoadingState({})
      } else {
        LoginService.login(user.email, user.password)
          .then(data => {
            setGlobalUser(data.data)
            setLoadingState({})
            if (isFirstLogin) {
              toast.success('Welcome To Rendevoz!')
            } else {
              toast.success('Welcome Back!')
            }
          })
          .catch(e => {
            toast.error('Failed to login!')
            setLoadingState({})
          })
      }
    } else {
      toast.error('Please input password!')
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
                toast.success('Verification code has been sent to your account. Please Check it!')
                toggleCodeVisible(true)
              })
              .catch(e => {
                toast.error('Failed to send email!')
                setLoadingState({})
              })
          }
        })
        .catch(e => {
          toast.error('No Email Is In Request!')
        })
    } else {
      setLoadingState({ validatingEmail: false })
      toast.error('Invalid Email!')
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
      <Content flex column gap={20} style={{ width: 400 }}>
        <div className={loginTextClassName}>Log in</div>
        <div>
          <div className={indicatorClassName}>Email</div>
          <input
            className={loginInputClassName}
            placeholder="Please Input Your Email"
            onChange={e => setUser({ ...user, email: e.target.value })}
          ></input>
        </div>
        {emailVerified ? (
          <>
            <div style={{ position: 'relative' }}>
              <div className={indicatorClassName}>Password</div>
              <input
                type={previewPassword ? 'text' : 'password'}
                className={loginInputClassName}
                placeholder="Please Input Your Password"
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
              style={{ border: '1px solid rgba(31,34,39,0.1)' }}
              onClick={handleLogin}
            >
              {loadingState?.logining && <Icon name="park-loading-one" size={20} spin />}
              {isFirstLogin ? 'Sign up' : 'Login'}
            </Content>
          </>
        ) : (
          <>
            {!codeVisible && (
              <Content
                flex
                gap={10}
                alignItems="center"
                style={{ border: '1px solid rgba(31,34,39,0.1)' }}
                className={ClassName.flatButton()}
                onClick={handleCheckEmailExist}
                justifyContent="center"
              >
                {loadingState?.validatingEmail ? (
                  <>
                    <Icon size={20} spin name="park-loading-one" />
                    Validating Email...
                  </>
                ) : loadingState?.isSendingVerificationCode ? (
                  <>
                    <Icon size={20} spin name="park-loading-one" />
                    Sending Verification Code...
                  </>
                ) : (
                  <>
                    <Icon size={20} name="park-mail" />
                    Continue with Email
                  </>
                )}
              </Content>
            )}
            {codeVisible && (
              <>
                <div>
                  <div className={indicatorClassName}>Verification Code</div>
                  <input className={loginInputClassName} placeholder="code" onChange={e => setCode(e.target.value)}></input>
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
                      Verifing Code
                    </>
                  ) : (
                    <>
                      <Icon size={18} name="park-protect" />
                      Verify Code
                    </>
                  )}
                </Content>
              </>
            )}
          </>
        )}
        <div className={textDividerClassName}>OR</div>

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
        </Content>
      </Content>
    </Content>
  )
}

export default Login
