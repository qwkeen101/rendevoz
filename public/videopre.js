const { ipcRenderer } = require('electron')

let interval
let videoLoaded = false
let videoElement = null
let wrapperElement = null
ipcRenderer.on('videoEvent', (e, payload) => {
  if (!videoElement) return
  const v = videoElement
  switch (payload.type) {
    case 'stop': {
      v.pause()
      break
    }
    case 'play': {
      v.play()
      break
    }
    case 'jump': {
      v.currentTime = Number(payload.time)
      break
    }
    case 'captureSnapshot': {
      if (videoElement) {
        captureVideoFrame(videoElement).then(res => {
          ipcRenderer.sendToHost('event', {
            type: 'captureImage',
            url: res
          })
        })
      }
      break
    }
  }
})
const captureVideoFrame = (
  video,
  size = {
    width: 1280,
    height: 720
  }
) => {
  return new Promise(res => {
    const canvas = window.document.createElement('canvas')
    canvas.height = Number(size.height)
    canvas.width = Number(size.width)
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL()
    res(dataUrl)
  })
}

const hideAll = () => {
  window.document.body.style.display = 'none'
}
const showAll = () => {
  window.document.body.style.display = 'block'
}
let replaced = false
window.addEventListener('DOMContentLoaded', () => {
  interval = setInterval(() => {
    if (videoLoaded) {
      clearInterval(interval)
      return
    }
    const currentUrl = window.location.href
    if (!currentUrl.includes('bilibili') && !currentUrl.includes('youtube')) {
      return
    }
    let isBili = false
    if (currentUrl.includes('bilibili')) {
      isBili = true
      // const bilibiliVideoWrapper = window.document.body.querySelector('#shinonome')
      const bilibiliVideoWrapper = window.document.body.querySelector('.bpx-player-container')
      if (bilibiliVideoWrapper) {
        bilibiliVideoWrapper.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-web')?.click()
        bilibiliVideoWrapper.querySelector('.bpx-player-control-bottom').style.height = '36px'
        bilibiliVideoWrapper.querySelector('.bpx-player-control-top').style.bottom = '45px'
        bilibiliVideoWrapper.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-wide').style.display = 'none'
        bilibiliVideoWrapper.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-web').style.display = 'none'
        bilibiliVideoWrapper.querySelector('.bpx-player-ctrl-btn.bpx-player-ctrl-full').style.display = 'none'
        bilibiliVideoWrapper.querySelector('.bpx-player-control-wrap').style.height = '61px'
        bilibiliVideoWrapper.querySelector('.bpx-player-control-entity').style.height = '61px'
        videoElement = bilibiliVideoWrapper.querySelector('video')
        wrapperElement = bilibiliVideoWrapper
        if (videoElement) {
          videoLoaded = true
        }
      }
    }
    if (currentUrl.includes('youtube')) {
      const youtubeVideoWrapper = window.document.body.querySelector('#player')
      if (youtubeVideoWrapper) {
        videoElement = youtubeVideoWrapper.querySelector('video')
        wrapperElement = youtubeVideoWrapper
        if (videoElement) {
          videoLoaded = true
        }
      }
    }

    if (videoLoaded) {
      if (replaced) return
      replaced = true
      showAll()
      if (!isBili) {
        window.document.body.replaceChildren(wrapperElement)
      }
      clearInterval(interval)
      prepareVideo()
      ipcRenderer.sendToHost('videoLoaded')
    } else {
      ipcRenderer.sendToHost('videoNotLoaded')
    }
  }, 100)
})

setInterval(() => {
  if (wrapperElement) {
    const pbp = wrapperElement.querySelector('.bpx-player-pbp')
    if (pbp) {
      pbp.style.display = 'none'
    }
  }
}, 1000)
const prepareVideo = () => {
  if (videoElement) {
    wrapperElement.style.position = 'absolute'
    wrapperElement.style.left = '0px'
    wrapperElement.style.top = '0px'
    wrapperElement.style.width = '100%'
    wrapperElement.style.height = '100%'
    wrapperElement.parentElement.style.overflow = 'hidden'
    const d = videoElement.duration
    if (d) {
      ipcRenderer.sendToHost('event', {
        type: 'durationChange',
        duration: d
      })
    }
    videoElement.addEventListener('pause', () => {
      ipcRenderer.sendToHost('event', {
        type: 'pause'
      })
    })
    if (videoElement.autoplay) {
      ipcRenderer.sendToHost('event', {
        type: 'play'
      })
    }
    videoElement.addEventListener('play', () => {
      ipcRenderer.sendToHost('event', {
        type: 'play'
      })
    })
    videoElement.addEventListener('timeupdate', e => {
      const time = e.currentTarget.currentTime
      ipcRenderer.sendToHost('event', {
        type: 'timeUpdate',
        time
      })
    })
    videoElement.addEventListener('durationchange', e => {
      const duration = e.currentTarget.duration
      if (duration) {
        ipcRenderer.sendToHost('event', {
          type: 'durationChange',
          duration
        })
      }
    })
  }
}
//
// const parseBV = async (html: string, url: string) => {
//   try {
//     const videoInfo = html.match(/\<\/script\>\<script\>window\.\_\_INITIAL\_STATE\_\_\=([\s\S]*?)\;\(function\(\)/)
//     if (!videoInfo) throw new Error('parse bv error')
//     const { videoData } = JSON.parse(videoInfo[1])
//     // 获取视频下载地址
//     let acceptQuality = null
//     try {
//       let downLoadData: any = html.match(
//         /\<script\>window\.\_\_playinfo\_\_\=([\s\S]*?)\<\/script\>\<script\>window\.\_\_INITIAL\_STATE\_\_\=/
//       )
//       if (!downLoadData) throw new Error('parse bv error')
//       downLoadData = JSON.parse(downLoadData[1])
//       acceptQuality = {
//         accept_quality: downLoadData.data.accept_quality,
//         video: downLoadData.data.dash.video,
//         audio: downLoadData.data.dash.audio
//       }
//     } catch (error) {
//       acceptQuality = await getAcceptQuality(videoData.cid, videoData.bvid)
//     }
//     const obj = {
//       id: '',
//       title: videoData.title,
//       url,
//       bvid: videoData.bvid,
//       cid: videoData.cid,
//       cover: videoData.pic,
//       createdTime: -1,
//       quality: -1,
//       view: videoData.stat.view,
//       danmaku: videoData.stat.danmaku,
//       reply: videoData.stat.reply,
//       duration: formatSeconed(videoData.duration),
//       up: videoData.hasOwnProperty('staff')
//         ? videoData.staff.map((item: any) => ({ name: item.name, mid: item.mid }))
//         : [{ name: videoData.owner.name, mid: videoData.owner.mid }],
//       qualityOptions: acceptQuality.accept_quality.map((item: any) => ({ label: qualityMap[item], value: item })),
//       page: parseBVPageData(videoData, url),
//       subtitle: [],
//       video: acceptQuality.video ? acceptQuality.video.map(item => ({ id: item.id, cid: videoData.cid, url: item.baseUrl })) : [],
//       audio: acceptQuality.audio ? acceptQuality.audio.map(item => ({ id: item.id, cid: videoData.cid, url: item.baseUrl })) : [],
//       filePathList: [],
//       fileDir: '',
//       size: -1,
//       downloadUrl: { video: '', audio: '' }
//     }
//     return obj
//   } catch (error) {
//     throw new Error(error)
//   }
// }
// const getAcceptQuality = async (cid: string, bvid: string) => {
//   const SESSDATA = store.settingStore(pinia).SESSDATA
//   const bfeId = store.settingStore(pinia).bfeId
//   const config = {
//     headers: {
//       'User-Agent': `${UA}`,
//       cookie: `SESSDATA=${SESSDATA};bfe_id=${bfeId}`
//     },
//     responseType: 'json'
//   }
//   const { body: { data: { accept_quality, dash: { video, audio } } }, headers: { 'set-cookie': responseCookies } } = await window.electron.got(
//     `https://api.bilibili.com/x/player/playurl?cid=${cid}&bvid=${bvid}&qn=127&type=&otype=json&fourk=1&fnver=0&fnval=80&session=68191c1dc3c75042c6f35fba895d65b0`,
//     config
//   )
//   // 保存返回的cookies
//   saveResponseCookies(responseCookies)
//   return {
//     accept_quality,
//     video,
//     audio
//   }
// }
// const parseBVPageData = ({ bvid, title, pages }, url) => {
//   const len = pages.length
//   if (len === 1) {
//     return [
//       {
//         title,
//         url,
//         page: pages[0].page,
//         duration: formatSeconed(pages[0].duration),
//         cid: pages[0].cid,
//         bvid: bvid
//       }
//     ]
//   } else {
//     return pages.map(item => ({
//       title: item.part,
//       page: item.page,
//       duration: formatSeconed(item.duration),
//       cid: item.cid,
//       bvid: bvid,
//       url: `${url}?p=${item.page}`
//     }))
//   }
// }
// export const formatSeconed = duration => {
//   const hours = Math.floor(duration / 3600)
//   const minus = Math.floor((duration - hours * 3600) / 60)
//   const secends = Math.floor(duration - minus * 60 - hours * 3600)
//   return `${hours > 9 ? hours : '0' + hours}:${minus > 9 ? minus : '0' + minus}:${secends > 9 ? secends : '0' + secends}`
// }
