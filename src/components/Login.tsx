import { useEffect, useRef, useState } from 'react'
import { Content, Icon } from './base'
import { toast } from 'react-hot-toast'
import { useMemoizedFn, useToggle } from '@/hooks'
import LoginService from '@/api/services/login.service'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import UserService from '@/api/services/user.service'
import trans from '@/consts/trans'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import { OFFICIAL_BACKEND_ENABLED } from '@/config/backend'
import LocalLogin from './LocalLogin'

const loginInputClassName = classnames('focus-input rounded px-2.5 py-1.5 bg-input border-box-shadow w-full')
const loginTextClassName = classnames('text-xl md:text-3xl mb-8 font-bold')
const indicatorClassName = classnames('font-medium text-sm mb-2 transparent-font')
const buttonClass = 'select-button !py-2 font-medium !rounded-md !h-auto px-2 flex items-center justify-center gap-2'
const validateEmail = (email?: string) => {
  const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
  if (email?.match(validRegex)) {
    return true
  } else {
    return false
  }
}

const LoadingIcon = () => <Icon name={Icons.Loading} size={16} spin />
const Login = () => {
  const [verifyCodeToken, setVerifyCodeToken] = useState<string>()
  const [user, setUser] = useState<{
    email: string
    password?: string
  }>({
    email: localStorage.getItem('email') || '',
    password: undefined
  })
  const [state, setState] = useState<{
    currentLoading?: 'sendingVerificationCode' | 'validatingEmail' | 'verifingCode' | 'logining' | 'sendingResetCode'
    currentStep?:
      | 'validateEmail'
      | 'resetPassword'
      | 'sendVerifyCode'
      | 'verifyCode'
      | 'sendResetCode'
      | 'verifyResetCode'
      | 'signup'
      | 'login'
  }>({
    currentStep: 'validateEmail'
  })
  // verify code, reset code
  const [code, setCode] = useState<string>()
  const { t } = useTranslation()
  const { currentLoading } = state
  const handleLogin = () => {
    if (currentLoading === 'logining') return
    if (!(user.email && validateEmail(user.email))) {
      toast.error(t(trans.Errors.InvalidEmail))
      return
    }
    if (user.password) {
      if (user.password.length < 6) {
        toast.error(`${t('login.password length must be greater than 6 digits')}!`)
      } else {
        setState(s => ({ ...s, currentLoading: 'logining' }))
        LoginService.login(user.email, user.password, verifyCodeToken)
          .then(() => {
            localStorage.setItem('email', user.email)
            UserService.getUserDetails().catch(() => {
              setState(s => ({ ...s, currentLoading: undefined }))
            })
          })
          .catch(e => {
            setState(s => ({ ...s, currentLoading: undefined }))
          })
      }
    } else {
      toast.error(`${t('login.please input your password')}!`)
    }
  }
  const handleCheckEmailExist = () => {
    if (currentLoading === 'validatingEmail' || currentLoading === 'sendingVerificationCode') return
    if (!(user.email && validateEmail(user.email))) {
      toast.error(t(trans.Errors.InvalidEmail))
      return
    }
    setState(s => ({ ...s, currentLoading: 'validatingEmail', currentStep: 'validateEmail' }))
    LoginService.checkEmailExist(user.email)
      .then(data => {
        if (data.data.result.exist) {
          setState({ currentStep: 'login' })
        } else {
          setState({ currentStep: 'sendVerifyCode' })
          setTimeout(() => handleSendCode())
        }
      })
      .catch(() => {
        setState(s => ({ ...s, currentLoading: undefined, currentStep: 'validateEmail' }))
      })
  }
  const handleVerifyCode = () => {
    if (!(user.email && validateEmail(user.email))) {
      toast.error(t(trans.Errors.InvalidEmail))
      return
    }
    if (code && code.length === 6) {
      if (state.currentStep === 'verifyResetCode') {
        if (currentLoading === 'verifingCode') return
        setState({ currentStep: 'verifyResetCode', currentLoading: 'verifingCode' })
        LoginService.verifyResetCode(user.email, code)
          .then(data => {
            setState({ currentStep: 'resetPassword' })
            setVerifyCodeToken(data)
          })
          .catch(() => {
            setState({ currentStep: 'verifyResetCode' })
          })
      }
      if (state.currentStep === 'verifyCode') {
        if (currentLoading === 'verifingCode') return
        setState({ currentStep: 'verifyCode', currentLoading: 'verifingCode' })
        LoginService.verifyCode(Number(code), user.email)
          .then(data => {
            setState({ currentStep: 'signup' })
            setVerifyCodeToken(data)
          })
          .catch(() => {
            setState({ currentStep: 'verifyCode' })
          })
      }
    } else {
      toast.error(t(trans.Errors.InvalidCode))
    }
  }
  const handleLoginWithNewPassword = () => {
    if (!verifyCodeToken) {
      toast.error(t(trans.Errors.InvalidArgs))
      return
    }
    if (currentLoading === 'logining') return
    if (!(user.email && validateEmail(user.email))) {
      toast.error(t(trans.Errors.InvalidEmail))
      return
    }
    if (user.password) {
      if (user.password.length < 6) {
        toast.error(`${t('login.password length must be greater than 6 digits')}!`)
      } else {
        setState(s => ({ ...s, currentLoading: 'logining' }))
        LoginService.resetPassword(user.email, user.password, verifyCodeToken)
          .then(() => {
            localStorage.setItem('email', user.email)
            UserService.getUserDetails().catch(() => {
              setState(s => ({ ...s, currentLoading: undefined }))
            })
          })
          .catch(e => {
            setState(s => ({ ...s, currentLoading: undefined }))
          })
      }
    } else {
      toast.error(`${t('login.please input your password')}!`)
    }
  }

  const handleSendCode = useMemoizedFn(() => {
    if (state.currentStep === 'sendVerifyCode') {
      if (currentLoading === 'sendingVerificationCode') return
      setState({ currentStep: 'sendVerifyCode', currentLoading: 'sendingVerificationCode' })
      LoginService.sendVerifyEmail(user.email)
        .then(() => {
          setState({ currentStep: 'verifyCode', currentLoading: undefined })
          toast.success(t('login.verification code has been sent to your account, please check it'))
        })
        .catch(e => {
          setState({ currentStep: 'sendVerifyCode' })
        })
    }
    if (state.currentStep === 'sendResetCode') {
      if (currentLoading === 'sendingResetCode') return
      setState({ currentStep: 'sendResetCode', currentLoading: 'sendingResetCode' })
      LoginService.sendResetEmail(user.email)
        .then(() => {
          setState({ currentStep: 'verifyResetCode', currentLoading: undefined })
          toast.success(t('login.verification code has been sent to your account, please check it'))
        })
        .catch(e => {
          setState({ currentStep: 'sendResetCode' })
        })
    }
  })
  const renderStep = () => {
    const { currentStep, currentLoading } = state
    if (!currentStep) return null
    switch (currentStep) {
      case 'signup':
      case 'login': {
        return (
          <>
            <div className={indicatorClassName}>{t(trans.Password)}</div>
            <input
              autoFocus
              type={'password'}
              className={loginInputClassName}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  handleLogin()
                }
              }}
              placeholder={t('login.please input your password')}
              onChange={e => setUser({ ...user, password: e.target.value })}
            ></input>
            {currentStep === 'login' && (
              <div
                onClick={() => {
                  setState({ currentStep: 'sendResetCode' })
                  emailRef.current?.focus()
                }}
                style={{
                  transition: 'color 0.1s ease'
                }}
                className={'font-size-12 mt-2 hover:!text-red-500 w-fit -mb-2 cursor-pointer font-semibold select-color-font'}
              >
                {t('login.Forget my password')}
              </div>
            )}
            <div className={classnames(buttonClass, 'mt-6')} onClick={handleLogin}>
              {currentLoading === 'logining' && <LoadingIcon />}
              {currentStep === 'signup' ? t('login.sign up') : t('login.login')}
            </div>
          </>
        )
      }
      case 'resetPassword': {
        return (
          <>
            <div className={'mb-6'}>
              <div className={indicatorClassName}>{t(trans.Password)}</div>
              <input
                autoFocus
                className={loginInputClassName}
                placeholder={t('login.Enter your new password')}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e)) {
                    handleLoginWithNewPassword()
                  }
                }}
                onChange={e => setUser(s => ({ ...s, password: e.target.value }))}
              ></input>
            </div>
            <div className={buttonClass} onClick={handleLoginWithNewPassword}>
              {currentLoading === 'logining' && <LoadingIcon />}
              {t('login.Login with new password')}
            </div>
          </>
        )
      }
      case 'verifyCode':
      case 'verifyResetCode': {
        return (
          <>
            <div className={indicatorClassName}>{t('login.verification code')}</div>
            <input
              autoFocus
              className={loginInputClassName}
              placeholder={t('login.Enter code')}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  handleVerifyCode()
                }
              }}
            ></input>
            <div className={classnames(buttonClass, 'mt-6')} onClick={handleVerifyCode}>
              {state.currentLoading === 'verifingCode' ? (
                <>
                  <LoadingIcon />
                  {t('login.verifing code')}
                </>
              ) : (
                <>{t('login.verify code')}</>
              )}
            </div>
          </>
        )
      }
      case 'sendVerifyCode': {
        return (
          <div className={buttonClass} onClick={handleSendCode}>
            <>
              {currentLoading === 'sendingVerificationCode' && <LoadingIcon />}
              {currentLoading === 'sendingVerificationCode' ? t('login.Sending verification code') : t('login.Send verification code')}
            </>
          </div>
        )
      }
      case 'sendResetCode': {
        return (
          <div className={buttonClass} onClick={handleSendCode}>
            <>
              {currentLoading === 'sendingResetCode' && <LoadingIcon />}
              {t('login.Send reset code')}
            </>
          </div>
        )
      }
      case 'validateEmail': {
        return (
          <div className={buttonClass} onClick={handleCheckEmailExist}>
            {currentLoading === 'validatingEmail' ? (
              <>
                <LoadingIcon />
                {t('login.validating email')}...
              </>
            ) : (
              <>{t('login.continue with email')}</>
            )}
          </div>
        )
      }
    }
  }

  const emailRef = useRef<HTMLInputElement>(null)
  return (
    <div className={'h-full w-full flex items-center justify-center'}>
      <div className={'flex flex-col gap-6 w-full max-w-lg'}>
        <div className={loginTextClassName}>{t('login.login')}</div>
        <div>
          <div className={indicatorClassName}>{t(trans.Email)}</div>
          <input
            ref={emailRef}
            autoFocus
            value={user.email}
            className={loginInputClassName}
            onKeyDown={e => {
              if (isHotkey(KEY.Enter, e)) {
                if (state.currentStep === 'validateEmail') {
                  handleCheckEmailExist()
                }
                if (state.currentStep === 'sendResetCode' || state.currentStep === 'sendVerifyCode') {
                  handleSendCode()
                }
              }
            }}
            placeholder={t('login.please input your email address')}
            onChange={e => setUser({ ...user, email: e.target.value })}
          ></input>
        </div>
        <div key={state.currentStep}>{renderStep()}</div>
      </div>
    </div>
  )
}

// Without the account server, sign-in uses local accounts instead.
export default OFFICIAL_BACKEND_ENABLED ? Login : LocalLogin
