import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'

const getAllFilesAndFolders = async (currentPath = '/', category?: number) => {
  if (localStorage.getItem('bda')) {
    const access = localStorage.getItem('bda')!
    let method = ''
    if (category === undefined) {
      method = 'list'
    }
    if (category === 1) {
      method = 'videolist'
    }
    if (category === 4) {
      method = 'imagelist'
    }
    const result = await fetch(
      `https://pan.baidu.com/rest/2.0/xpan/file?${new URLSearchParams({
        method,
        access_token: access,
        dir: currentPath === '' ? '/' : currentPath,
        web: '1',
        order: 'time'
      })}`,
      {
        method: 'get'
      }
    ).then(i => i.json())
    if (result.error_code) {
      switch (result.error_code) {
        case 6:
          loginBaidudisk()
      }
      return
    }
    return result
  } else {
    loginBaidudisk()
  }
}

export default getAllFilesAndFolders
