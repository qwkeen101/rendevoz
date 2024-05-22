import parser from 'ua-parser-js'
export default async () => {
  const ipInfo = await fetch('https://api.incolumitas.com/').then(i => i.json())
  if (ipInfo) {
    const parsed = parser(navigator.userAgent)
    const res = {
      os: parsed.os.name,
      city: ipInfo.location.city,
      region: ipInfo.location.state,
      country: ipInfo.location.country,
      ip: ipInfo.ip,
      time: Date.now()
    }
    return res
  }
}
