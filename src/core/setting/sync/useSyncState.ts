import { useState } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default () => {
  const s3Config = KeyvalueStore.useValue('S3Config')
  const [syncFileState, setSyncFileState] = useState<
    {
      dirName: string
      dirSize: number
      files: {
        name: string
        size: number
        ctime: number
      }[]
    }[]
  >([])
}
