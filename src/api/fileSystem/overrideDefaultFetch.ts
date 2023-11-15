export default () => {
  // override XMLHttpRequest
  // const open = XMLHttpRequest.prototype.open
  // XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  //   console.log(url)
  //   return open.call(this, method, url.replace('rendefile://', 'http://s45btxtpl.hn-bkt.clouddn.com'), ...rest)
  // }
  // const { fetch: originalFetch } = window
  // // override fetch
  // window.fetch = async (...args) => {
  //   let [resource, config] = args
  //   console.log(resource, config)
  //   const response = await originalFetch(resource, config)
  //   // response interceptor here
  //   return response
  // }
  // override image audio video
  // const { get, set } = Object.getOwnPropertyDescriptor(Image.prototype, 'src')!
  // Object.defineProperty(Image.prototype, 'src', {
  //   set(newVal) {
  //     if (newVal.startsWith('rendefile')) {
  //       const replaced = newVal.replace('rendefile:///imgs/', '')
  //       return set.call(this, replaced)
  //     }
  //     return set.call(this, newVal)
  //   },
  //   get() {
  //     return get.call(this)
  //   }
  // })
  //

  // hook set attr
  const originalSetAttr = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (...args) {
    if (args[0] === 'src') {
      if (args[1].startsWith('rendefile')) {
        args[1] = args[1].replace('rendefile:///files/', '')
      }
    }
    originalSetAttr.call(this, ...args)
  }
  const { get, set } = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')!
  // hook media src
  Object.defineProperty(HTMLMediaElement.prototype, 'src', {
    configurable: true,
    set(newVal) {
      console.log(newVal)
      if (newVal.startsWith('rendefile')) {
        const replaced = newVal.replace('rendefile:///files/', '')
        return set.call(this, replaced)
      }
      return set.call(this, newVal)
    },
    get() {
      return get.call(this)
    }
  })
}
