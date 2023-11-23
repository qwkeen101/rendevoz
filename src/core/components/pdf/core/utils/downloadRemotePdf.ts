import { ErrorMaker } from '@/consts'
import { request } from '@/utils/request'
import fetchProcess, { DownloadProgress } from '@/utils/fetchProcess'
import FileSystem from '@/api/fileSystem'

const downloadRemotePdf = async (remotePdfUrl: string, onProgress?: (progress: DownloadProgress) => void) => {
  if (remotePdfUrl.startsWith('baidudisk')) {
    const fsid = Number(remotePdfUrl.replace('baidudisk/', ''))
    const access = localStorage.getItem('bda')
    if (!access) {
      throw new Error(ErrorMaker.createError('BAIDU_AUTH_ERROR'))
    }
    try {
      const result = await request('https://pan.baidu.com/rest/2.0/xpan/multimedia', {
        method: 'get',
        params: {
          method: 'filemetas',
          access_token: access,
          fsids: `[${fsid}]`,
          dlink: 1
        }
      })
      const fileMetas = result.data?.list?.[0]
      if (fileMetas.dlink) {
        const downloadResult = await fetch(`${fileMetas.dlink}&access_token=${access}`, {
          method: 'get'
        }).then(
          fetchProcess({
            onProgress: p => onProgress?.(p)
          })
        )
        if (downloadResult.status > 400) {
          throw new Error(ErrorMaker.createError('WEB_REQUEST_ERROR'))
        }
        const buf = await downloadResult.blob()
        if (buf) {
          const filepath = await FileSystem.fs.writeFile(buf, `/files/${fileMetas.filename}`, 'binary')
          if (filepath) {
            return filepath
          }
        }
      }
    } catch (e) {
      throw new Error(ErrorMaker.createError('WEB_REQUEST_ERROR'))
    }
  }
}

export default downloadRemotePdf
