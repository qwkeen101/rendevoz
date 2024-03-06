import { request } from '@/utils/request'
import { toast } from 'react-hot-toast'
import loginBaidudisk from '@/components/fileImporter/baidudisk/loginBaidudisk'

const requestBaiduVideo = async (path: string, quality: 480 | 720 | 1080 = 720) => {
  const bda = localStorage.getItem('bda')
  if (!bda) {
    loginBaidudisk()
  }
  if (bda) {
    const encodedPath = encodeURIComponent(path)
    const url = `https://pan.baidu.com/rest/2.0/xpan/file?method=streaming&access_token=${bda}&path=${encodedPath}&type=M3U8_AUTO_${quality}`

    const result = await request(url, {
      method: 'get',
      headers: {
        'User-Agent': 'pan.baidu.com'
      }
    }).catch(e => {
      switch (e.response.data.error_code) {
        case 31341:
          toast.error('视频正在转码中，请稍后再试！')
          return
        case 31346:
          toast.error('视频转码失败，请确认此视频可以正常播放！')
          return
        case 31301:
          toast.error('非音视频文件！')
          return
        case 31304:
          toast.error('当前视频格式不支持播放！')
          return
        case 31338:
          toast.error('视频码率过高，请下载后播放！')
          return
        case 31347:
          toast.error('视频太长，不支持在线播放！')
          return
        case 31066:
          toast.error('文件不存在！')
          return
        case 6:
          loginBaidudisk()
          toast.error('请重新登录！')
          return
      }
    })

    if (result.data.adToken) {
      if (result.data.ltime) {
        return new Promise(res => {
          setTimeout(
            () => {
              const newUrl = `https://pan.baidu.com/rest/2.0/xpan/file?method=streaming&access_token=${bda}&path=${encodedPath}&type=M3U8_AUTO_${quality}&adToken=${encodeURIComponent(
                result.data.adToken
              )}`
              request(newUrl, {
                method: 'get',
                headers: {
                  'User-Agent': 'pan.baidu.com'
                }
              }).then(r => {
                res(r)
              })
            },
            result.data.ltime * 1000 + 1000
          )
        })
      }
    } else if (result.headers['content-type'] === 'application/x-mpegURL') {
      return result
    } else {
      toast.error('获取视频出现未知错误')
    }
  }
}

export default requestBaiduVideo
