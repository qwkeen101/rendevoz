export default {
  LocalCommon: 'http://localhost:9001',
  LocalAI: 'http://localhost:9000',
  Remote: 'https://api.rendevoz.com',
  RemoteGrey: 'https://api.rendevoz.com/grey',
  Translate: function (api: 'common' | 'text') {
    switch (api) {
      case 'text':
        return this.Remote + '/translate/text'
      case 'common':
        return this.Remote + '/translate'
    }
  },
  OCR: function () {
    return this.Remote + '/image/ocr'
  },
  Upgrade: function () {
    return this.Remote + '/pay'
  },
  User: function () {
    return this.Remote + '/user'
  },
  AI: function (api: 'addCredit' | 'buyCredit' | 'clearCredit') {
    switch (api) {
      case 'addCredit':
        return this.Remote + '/ai/credit/add'
      case 'buyCredit':
        return this.Remote + '/ai/pay'
      case 'clearCredit':
        return ''
    }
  }
}
