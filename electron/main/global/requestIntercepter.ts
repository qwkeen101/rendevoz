import * as electron from 'electron'

const requestIntercepter = (win: electron.BrowserWindow) => {
  const session = win.webContents.session
  const filter = {
    urls: ['*://*/*']
  }
  session.webRequest.onBeforeSendHeaders(filter, async (details, callback) => {
    // change for google news
    if (details.url.includes('google')) {
      const headers = details.requestHeaders
      headers['Accept'] =
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
      headers['Accept-Encoding'] = 'gzip'
      headers['Accept-Language'] = 'en-US,en;q=0.9,es;q=0.8'
      headers['Upgrade-Insecure-Requests'] = 1
      headers['Referer'] = 'https://www.google.com/'
      headers['Sec-Fetch-Site'] = 'same-origin'
      delete headers['Referer']
      headers['User-Agent'] =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
      // headers['Cookie'] = `CONSENT=YES+cb.${new Date().toISOString().split('T')[0].replace(/-/g,'')}-04-p0.en-GB+FX+667`
    }
    if (details.url.includes('https://pan.baidu.com/rest/2.0/xpan/file?method=streaming')) {
      details.requestHeaders['User-Agent'] = 'xpanvideo;netdisk;iPhone13;ios-iphone;15.1;ts'
    }
    if (details.url.includes('baidu') && details.url.includes('pcs')) {
      details.requestHeaders['User-Agent'] = 'pan.baidu.com'
    }
    if (details.requestHeaders['bili']) {
      const refer = details.requestHeaders['bili']
      details.requestHeaders['Referer'] = refer
    } else {
      if (details.requestHeaders['Referer'] && details.requestHeaders['Referer'].includes('localhost')) {
        delete details.requestHeaders['Referer']
      }
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })
}

export default requestIntercepter
