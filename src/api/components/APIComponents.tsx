import { memo } from 'react'
import Initializer from './Initializer'
import LoadingPage from './LoadingPage'
import Notification from './Notification'
import ThemeSwitcher from './ThemeSwitcher'
export default memo(() => {
  return (
    <>
      <Initializer />
      <LoadingPage />
      <Notification />
      <ThemeSwitcher />
    </>
  )
})
