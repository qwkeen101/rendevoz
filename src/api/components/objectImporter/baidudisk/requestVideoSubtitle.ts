import { toast } from 'react-hot-toast'
import loginBaidudisk from '@/api/components/objectImporter/baidudisk/loginBaidudisk'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const requestBaiduVideoSubtitle = async (path: string, emit = true) => {
  const bda = KeyvalueStore.getOne('baiduAccessToken')
  if (!bda) {
    emit && loginBaidudisk()
  }
  if (bda) {
    const encodedPath = encodeURI(path)
    const url = `https://pan.baidu.com/rest/2.0/xpan/file?method=streaming&access_token=${bda}&path=${encodedPath}&type=M3U8_SUBTITLE_SRT`

    const result = await fetch(url, {
      method: 'get'
    })
    if (result.status !== 200) {
      switch ((await result.json()).error_code) {
        case 31304:
          emit && toast.error('不支持的文件类型！')
          return
        case 31649:
          emit && toast.error('字幕不存在！')
          return
        case 31024:
          emit && toast.error('没有访问权限！')
          return
        case 31339:
          emit && toast.error('视频非法！')
          return
        case 6:
          emit && loginBaidudisk()
          emit && toast.error('请重新登录！')
          return
      }
    }
    if (result && result.headers.get('Content-Type') === 'application/x-mpegURL') {
      return await result.text()
    } else {
      emit && toast.error('获取字幕出现未知错误')
    }
  }
}

export default requestBaiduVideoSubtitle
