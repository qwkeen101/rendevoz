import { request } from '@/utils/request'

const searchFiles = async (search: string, category?: number) => {
  if (localStorage.getItem('bda')) {
    const access = localStorage.getItem('bda')!
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
