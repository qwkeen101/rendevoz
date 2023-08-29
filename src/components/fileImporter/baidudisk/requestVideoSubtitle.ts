import { request } from '@/utils/request'
import { toast } from 'react-hot-toast'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'

const requestBaiduVideoSubtitle = async (path: string) => {
  const bda = localStorage.getItem('bda')
  if (!bda) {
    loginBaidudisk()
  }
  if (bda) {
    const encodedPath = encodeURI(path)
    const url = `https://pan.baidu.com/rest/2.0/xpan/file?method=streaming&access_token=${bda}&path=${encodedPath}&type=M3U8_SUBTITLE_SRT`

    const result = await request(url, {
      method: 'get',
      headers: {
        'User-Agent': 'pan.baidu.com'
      }
    }).catch(e => {
      switch (e.response.data.error_code) {
        case 31304:
          toast.error('不支持的文件类型！')
          return
        case 31649:
          toast.error('字幕不存在！')
          return
        case 31024:
          toast.error('没有访问权限！')
          return
        case 31339:
          toast.error('视频非法！')
          return
        case 6:
          loginBaidudisk()
          toast.error('请重新登录！')
          return
      }
    })

    if (result.headers['content-type'] === 'application/x-mpegURL') {
      return result
    } else {
      toast.error('获取字幕出现未知错误')
    }
  }
}

export default requestBaiduVideoSubtitle
