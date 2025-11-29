import { memo } from 'react'
import Initializer from './Initializer'
import LoadingPage from './LoadingPage'
import Notification from './Notification'
import ThemeSwitcher from './ThemeSwitcher'
import FolderEditor from '@/core/global/components/FolderEditor'
import InstancesAssigner from '@/core/global/components/InstancesAssigner'
export default memo(() => {
  return (
    <>
      <Initializer />
      <LoadingPage />
      <Notification />
      <ThemeSwitcher />
      <FolderEditor />
      <InstancesAssigner />
    </>
  )
})
