import { request } from '@/utils/request'

const searchFiles = async (search: string, category?: number) => {
  if (localStorage.getItem('bda')) {
    const access = localStorage.getItem('bda')!
    const result = await request(`https://pan.baidu.com/rest/2.0/xpan/file`, {
      method: 'get',
      params: {
        access_token: access,
        key: search,
        method: 'search',
        // category,
        web: 1,
        recursion: true
      }
    })
    return result.data
  }
}

export default searchFiles
