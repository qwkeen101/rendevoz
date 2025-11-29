import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async () => {
  const access = KeyvalueStore.getOne('baiduAccessToken')
  if (!access) return false
  try {
    const result = await fetch(
      `https://pan.baidu.com/rest/2.0/xpan/nas?${new URLSearchParams({
        method: 'uinfo',
        access_token: access
      })}`,
      {
        method: 'get'
      }
    ).then(i => i.json())
    if ('errno' in result && result.errno === -6) {
      return false
    }
    return result.baidu_name as string
  } catch (e) {
    return false
  }
}
