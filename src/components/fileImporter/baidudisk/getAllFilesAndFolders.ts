import { request } from '@/utils/request'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'

const getAllFilesAndFolders = async (currentPath = '/', category?: number) => {
  if (localStorage.getItem('bda')) {
    const access = localStorage.getItem('bda')!
    let method
    if (category === undefined) {
      method = 'list'
    }
    if (category === 1) {
      method = 'videolist'
    }
    if (category === 4) {
      method = 'imagelist'
    }
    const result = await request(`https://pan.baidu.com/rest/2.0/xpan/file`, {
      method: 'get',
      headers: {
        Referer: '',
        'User-Agent': 'pan.baidu.com'
      },
      params: {
        method,
        access_token: access,
        dir: currentPath === '' ? '/' : currentPath,
        web: 1,
        order: 'time'
      }
    }).catch(e => {
      switch (e.response.data.error_code) {
        case 6:
          loginBaidudisk()
      }
    })
    return result.data
  } else {
    loginBaidudisk()
  }
}

export default getAllFilesAndFolders
