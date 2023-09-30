import { FC } from 'react'
import Layout from '../../layout'
import { Sidebar } from '../../layout/sidebar'

interface Props {
  children?: React.ReactNode
}
const AuthenticatedLayout: FC<Props> = () => {
  return <Layout />
}

export default AuthenticatedLayout
