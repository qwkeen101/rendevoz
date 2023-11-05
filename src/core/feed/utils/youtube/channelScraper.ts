const key = 'REDACTED'
export default async (details?: { url?: string; channelId?: string }) => {
  // if (!details.channelId && !details.url) return
  let entries = []
  const loop = async (pageToken?: string) => {
    let request = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=500&playlistId=UUAuUUnT6oDeKwE6v1NGQxug&key=${key}`
    if (pageToken) {
      request += `&pageToken=${pageToken}`
    }
    const res = await fetch(request).then(res => res.json())
    entries = [...entries, ...res.items]
    if (res.nextPageToken) {
      await loop(res.nextPageToken)
    }
  }
  await loop()
  console.log(entries)
}
