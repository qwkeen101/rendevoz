import { IGlobalInstance, MetaObject } from '~/typings'
import { t } from 'i18next'
import { ipcInstance } from '@/electron'
import { Readability } from '@mozilla/readability'
import deserializeHTML, { normalizeResult } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import { getFavicon, getImg } from '@/core/components/webpage/utils/previewWebUrl'
import FileSystem from '@/api/fileSystem'
import { importDocx, importHTML, importImage, importAudio, importMarkdown, importPDF, importVideo } from './fileProcessor'
import { processBBC, processGithub, processWeixin } from './webProcessor'
import importApplePodcasts from '@/api/global/webProcessor/importApplePodcasts'
import importXiaoyuzhou from '@/api/global/webProcessor/importXiaoyuzhou'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import importX from '@/api/global/webProcessor/importX'
import { getTweet } from 'react-tweet/api'
import getFileDetailsFromURL from '@/api/global/webProcessor/getFileDetailsFromURL'
import importOnlineFile from '@/api/global/webProcessor/importOnlineFile'
import fetchYoutubeDetails from '@/api/global/webProcessor/fetchYoutubeDetails'
import { Icons } from '@/consts'
const tweetRegexp = /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+$/
const domParser = new DOMParser()
const addBaseToHTML = (url: string, doc: Document) => {
  const base = doc.createElement('base')
  base.href = url
  if (!doc.head) {
    const head = doc.createElement('head')
    head.appendChild(base)
    doc.documentElement.insertBefore(head, doc.body)
  } else {
    doc.head.appendChild(base)
  }
}
export default {
  getIcon: type => {
    switch (type) {
      case 'exam':
        return 'park-editor'
      case 'examQuestion':
        return 'park-help'
      case 'tweet':
        return 'custom-twitter'
      case 'note':
        return 'park-notes'
      case 'pdf':
        return 'custom-pdf'
      case 'audio':
        return 'park-music'
      case 'webpage':
        return 'park-web-page'
      case 'question':
        return 'park-comments'
      case 'code':
        return 'park-code'
      case 'video':
        return 'park-youtube'
      case 'webpageLabel':
      case 'audioLabel':
      case 'noteBlock':
      case 'noteLabel':
      case 'pdfLabel':
      case 'videoLabel':
        return 'park-label'
      case 'whiteboard':
        return 'park-new-computer'
      case 'chat':
        return 'custom-stars'
      case 'collection':
        return Icons.Folder
      case 'image':
        return 'park-pic'
      case 'localFile':
        return 'park-log'
      case 'group':
        return 'park-form'
      case 'syncedBlock':
        return 'park-transfer-data'
      case 'message':
        return 'park-communication'
      case 'cloudFile':
        return 'park-link-cloud'
      default:
        return 'park-file-question'
    }
  },
  getTypeName: type => {
    if (!type) {
      return 'Unknown'
    }
    if (type === 'collection') {
      return t('general.Folder')
    }
    return t(`general.${type}`)
  },
  fetchDetails: async url => {
    try {
      new URL(url)
    } catch (e) {
      return Promise.reject()
    }
    const fileDetails = await getFileDetailsFromURL(url)
    if (fileDetails) {
      return {
        title: fileDetails.name,
        image: fileDetails.type === 'image' ? url : undefined,
        appIcon: Global.utils.getIcon(fileDetails.type)
      }
    }
    // is tweet
    if (tweetRegexp.test(url)) {
      const id = url.split('/').pop() as string
      const result = await getTweet(id)
      if (result) {
        let image: string | undefined = undefined
        if (result.photos?.length) {
          image = result.photos[0].url
        }
        if (result.mediaDetails?.length) {
          const img = result.mediaDetails.find(i => i.type === 'photo')
          if (img) {
            image = img.media_url_https
          }
        }
        return {
          title: result.text,
          image,
          sitename: 'X'
        }
      }
      return
    }
    const res = await fetch(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    })
    const text = await res.text()
    function isHTML(str: string) {
      const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/
      return regexForHTML.test(str)
    }
    if (!isHTML(text)) throw 'Not HTML web!'
    if (text.includes('ytInitialData')) {
      const youtubeInfo = fetchYoutubeDetails(text)
      if (!youtubeInfo) {
        throw 'Failed to get youtube info!'
      }
      return {
        ...youtubeInfo,
        sitename: 'Youtube'
      }
    }
    const parser = new DOMParser()
    const dom = parser.parseFromString(text, 'text/html')
    const head = dom.head
    const metas = Array.from(head.querySelectorAll('meta').values())
    const title = head.querySelector('title')?.textContent || metas.find(i => i.getAttribute('property') === 'og:title')?.content || ''
    const descriptionMeta = metas.find(i => i.name === 'description' || i.getAttribute('property') === 'og:description')?.content
    const imageMeta = metas.find(i => i.getAttribute('property') === 'og:image' || i.getAttribute('property') === 'twitter:image')?.content
    const author = metas.find(i => i.name === 'author')?.content
    const audio = metas.find(i => i.getAttribute('property') === 'og:audio')?.content || dom.body.querySelector('audio')?.src
    const icon = head.querySelector("link[rel~='icon']")?.getAttribute('href')
    const sitename = metas.find(i => i.name === 'application-name' || i.getAttribute('property') === 'og:site_name')?.content
    return {
      title,
      description: descriptionMeta,
      image: imageMeta,
      author,
      audio,
      icon,
      html: text,
      dom,
      sitename
    }
  },
  fetchURL: async (url, html) => {
    try {
      new URL(url)
    } catch (e) {
      return Promise.reject()
    }
    let fetched = html ?? ((await ipcInstance.send('loadWebpage', url).then(res => res.data)) as string)
    // preprocess htmls
    ;[processGithub, processWeixin, processBBC].forEach(i => {
      fetched = i(url, fetched)
    })
    return fetched
  },
  extractHTML: (url, html) => {
    const parsed = domParser.parseFromString(html.replace(/\<\?xml.+\?\>|\<\!DOCTYPE.+]\>/g, ''), 'text/html')
    const readability = new Readability(parsed).parse()
    addBaseToHTML(url, parsed)
    if (readability) {
      const afterReadDocument = domParser.parseFromString(readability.content, 'text/html')
      addBaseToHTML(url, afterReadDocument)
      return {
        original: parsed,
        extracted: afterReadDocument,
        title: readability.title,
        text: readability.textContent
      }
    }
    throw ''
  },
  parseWebpage: async (url, html) => {
    let prefetchedHTML = await Global.utils.fetchURL(url, html)
    console.log(prefetchedHTML)
    if (!prefetchedHTML) throw 'Failed to parse webpage!'
    const { extracted, original, title } = Global.utils.extractHTML(url, prefetchedHTML)
    const result = deserializeHTML(extracted.body)
    const normalized = normalizeResult(result)
    const favicon = await getFavicon(original, url)
    const image = await getImg(original, url)
    const details = await Global.utils.fetchDetails(url)
    console.log(result)
    return {
      content: normalized,
      title,
      favicon,
      image: details.image || image,
      author: details.author,
      domain: new URL(url).hostname.replace('www.', '')
    }
  },
  normalizeFile: async file => {
    if (file.name.endsWith('.md')) {
      return await importMarkdown(file)
    }
    if (file.name.endsWith('.docx')) {
      return await importDocx(file)
    }
    if (file.type === 'application/pdf') {
      return await importPDF(file)
    }
    if (file.type.startsWith('image')) {
      return await importImage(file)
    }
    if (file.type.startsWith('video')) {
      return await importVideo(file)
    }
    if (file.type === 'text/html') {
      return await importHTML(file)
    }
    if (file.type.startsWith('audio')) {
      return await importAudio(file)
    }
    return {
      object: {
        specType: 'localFile',
        url: await FileSystem.saveFile(file)
      },
      meta: {
        name: file.name,
        type: 'localFile'
      }
    }
  },
  normalizeURL: async (url, type) => {
    try {
      new URL(url)
    } catch (e) {
      return Promise.reject()
    }
    try {
      switch (true) {
        case (await getFileDetailsFromURL(url)) !== undefined: {
          return await importOnlineFile(url)
        }
        case url.includes('podcasts.apple.com'): {
          return await importApplePodcasts(url)
        }
        case url.includes('www.xiaoyuzhoufm.com/episode'): {
          return await importXiaoyuzhou(url)
        }
        case tweetRegexp.test(url): {
          return await importX(url)
        }
      }
    } catch (e) {}
    const details = await Global.utils.fetchDetails(url)
    console.log(details)
    if (type === 'audio' && details.audio) {
      url = details.audio
    }
    if (url.includes('bilibili.com') || url.includes('youtube.com')) {
      type = 'video'
    } else {
      type = 'webpage'
    }
    return {
      meta: {
        name: details.title,
        coverImgSrc: details.image || details.icon || details.appIcon,
        description: details.description,
        type
      },
      object: {
        url,
        specType: type
      }
    }
  },
  formatURL: url => {
    if (url.startsWith('baidudisk')) {
      return url.replace('baidudisk', '百度网盘')
    }
    if (url.startsWith('rendefile://')) {
      return url.replace('rendefile://', KeyvalueStore.getOne('userSetting')?.general.userFilePath || '')
    }
    return url
  },
  openSpecificURL: url => {
    if (url.startsWith('baidudisk')) {
      const name = url.replace('baidudisk', '').split('/').pop()
      window.open(`https://pan.baidu.com/disk/main#/index?category=all&search=${name}`)
      return
    }
    if (url.startsWith('rendefile://')) {
      ipcInstance.send('openLocalFile', url)
      return
    }
    window.open(url)
  },
  normalizeDragEvent: async e => {
    if (e.dataTransfer?.items.length) {
      const files = Array.from(e.dataTransfer.items).filter(i => i.kind === 'file')
      console.log(files.map(i => i.webkitGetAsEntry()))
      return {
        type: 'files',
        files: files.filter(f => f.webkitGetAsEntry()?.isFile).map(f => f.getAsFile())
      }
    }
    const htmlData = e.dataTransfer?.getData('text/html')
    if (htmlData) {
      const uriData = e.dataTransfer?.getData('text/uri-list')
      const textData = e.dataTransfer?.getData('text/plain').startsWith('http') ? undefined : e.dataTransfer?.getData('text/plain')
      let plainLinkData = e.dataTransfer?.getData('text/plain').startsWith('http') ? e.dataTransfer?.getData('text/plain') : undefined
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlData, 'text/html')
      const imgEle = doc.querySelector('img')
      const linkEle = doc.querySelector('a')
      if (imgEle && imgEle.src) {
        return {
          type: 'images',
          imgs: [
            {
              path: await FileSystem.saveImage(imgEle.src, {
                compress: false
              }),
              name: imgEle.alt || uriData
            }
          ]
        }
      }
      if (linkEle && linkEle.href && uriData) {
        return {
          type: 'link',
          url: linkEle.href
        }
      }
      if (textData) {
        return {
          type: 'text',
          text: textData
        }
      }

      if (plainLinkData) {
        return {
          type: 'link',
          url: plainLinkData
        }
      }
    }
    const text = e.dataTransfer?.getData('text/plain')
    if (text) {
      return {
        type: 'text',
        text
      }
    }
  }
} as IGlobalInstance['utils']
