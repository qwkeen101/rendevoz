// date: 20220801
export default async (feedUrl: string, date: string) => {
  const availableResult = await fetch(`https://archive.org/wayback/available?url=${feedUrl}&timestamp=${date}`).then(res => res.json())
  if (availableResult.archived_snapshots) {
    if (availableResult.archived_snapshots.closest) {
      if (availableResult.archived_snapshots.closest.status === '200') {
        const url = availableResult.archived_snapshots.closest.url
        const result = await fetch(url).then(res => res.text())
        return result
      }
    }
  }
}
