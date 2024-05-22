import parser from 'ua-parser-js'
export default async () => {
  const ipInfo = await fetch('https://freeipapi.com/api/json').then(i => i.json())
  if (ipInfo) {
    const parsed = parser(navigator.userAgent)
    const res = {
      os: parsed.os.name,
      city: ipInfo.cityName,
      region: ipInfo.regionName,
      country: ipInfo.countryName,
      ip: ipInfo.ipAddress,
      time: Date.now()
    }
    return res
  }
}
