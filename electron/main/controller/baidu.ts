import callback from './callback'
import fetch from 'node-fetch'

callback('loginBaidudisk', async (code: string) => {
  const url = `https://openapi.baidu.com/oauth/2.0/token?
grant_type=authorization_code&
code=${code}&
client_id=PVYWIzaqR20Cv3ukyubu9YofKMSrqmLC&
client_secret=Za8BXRX1N9ONG4drbWNeg6yhKXL7x8KF&
redirect_uri=rendevoz://baidudisk`
  const result = await (await fetch(url)).json()
  return result
})
