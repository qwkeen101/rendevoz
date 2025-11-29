import { request } from '@/utils/request'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const searchFiles = async (search: string, category?: number) => {
  if (KeyvalueStore.getOne('baiduAccessToken')) {
    const access = KeyvalueStore.getOne('baiduAccessToken')!
    const result = await fetch(
      `https://pan.baidu.com/rest/2.0/xpan/file?${new URLSearchParams({
        access_token: access,
        key: search,
        method: 'search',
        // category,
        web: '1',
        recursion: 'true'
      })}`,
      {
        method: 'get'
      }
    ).then(i => i.json())
    return result
  }
}

export default searchFiles
