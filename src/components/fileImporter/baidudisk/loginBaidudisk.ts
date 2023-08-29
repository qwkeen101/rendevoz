const loginBaidudisk = () => {
  localStorage.removeItem('bda')
  window.open(
    'http://openapi.baidu.com/oauth/2.0/authorize?\n' +
      '    response_type=code&\n' +
      '    client_id=PVYWIzaqR20Cv3ukyubu9YofKMSrqmLC&\n' +
      '    redirect_uri=rendevoz://baidudisk&\n' +
      '    scope=basic,netdisk',
    '_blank'
  )
}

export default loginBaidudisk
