import { getSetting } from '@/core'
import { changeFilePath } from '@/utils'

export default async () => {
  const setting = getSetting()
  await changeFilePath(setting.general.userFilePath)
}
