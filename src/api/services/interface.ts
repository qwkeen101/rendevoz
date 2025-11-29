export default {
  LocalCommon: 'http://localhost:9001',
  LocalAI: 'http://localhost:9000',
  RemoteGreyCommon: 'https://1252524756-ior7x3ciqn-hk.scf.tencentcs.com',
  RemoteGreyAI: 'https://1252524756-eg6i4qu64d-hk.scf.tencentcs.com',
  OCR: function () {
    return this.RemoteGreyCommon + '/image/ocr'
  },
  Upgrade: function () {
    return this.RemoteGreyCommon + '/pay'
  },
  Email: function () {
    return this.RemoteGreyCommon + '/email'
  },
  User: function () {
    return this.RemoteGreyCommon + '/user'
  },
  CheckPayOrder: function () {
    return this.RemoteGreyCommon + '/pay/order'
  },
  AI: function (api: 'addCredit' | 'buyCredit' | 'clearCredit' | 'ask' | 'askStream' | 'transcribe' | 'chatStream' | 'sts' | 'isValidAudio' | 'hasTranscript') {
    switch (api) {
      case 'hasTranscript':
        return this.RemoteGreyAI + '/hasTranscript'
      case 'chatStream':
        return this.RemoteGreyAI + '/ai/stream'
      case 'isValidAudio':
        return this.RemoteGreyAI + '/isValidAudio'
      case 'sts':
        return this.RemoteGreyAI + '/ai/sts'
      case 'askStream':
        return this.RemoteGreyAI + '/ai/askStream'
      case 'addCredit':
        return this.RemoteGreyAI + '/ai/credit/add'
      case 'buyCredit':
        return this.RemoteGreyAI + '/ai/pay'
      case 'clearCredit':
        return ''
      case 'ask':
        return this.RemoteGreyAI + '/ai/ask'
      case 'transcribe':
        return this.RemoteGreyAI + '/transcribe'
    }
  }
}
