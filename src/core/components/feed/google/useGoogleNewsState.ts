import { atom, useAtom } from 'jotai'
import { globalStore } from '@/api/stores'
import topics from './googleNewsTopicToId.json'
import { IGoogleNews } from '@/core/components/feed/types'

type IGoogleNewsState = {
  topicToNews: Record<string, IGoogleNews[]>
  activeTopic: string
}
const GoogleNewsScraperStateAtom = atom<IGoogleNewsState>({
  topicToNews: {},
  activeTopic: 'topStories'
})

const update = (updater: (curr: IGoogleNewsState) => IGoogleNewsState) => {
  const curr = globalStore.get(GoogleNewsScraperStateAtom)
  globalStore.set(GoogleNewsScraperStateAtom, updater(curr))
}

const fetchGoogleNewsByTopicId = async (topic: string) => {
  const url = `https://news.google.com/topics/${topics[topic]}`
  const res = await fetch(url).then(i => i.text())
  const doc = new DOMParser().parseFromString(res, 'text/html')
  const nodes = Array.from(doc.querySelectorAll('article'))
  const normalized = nodes.map(n => ({
    favicon: n.querySelector('img.y3G2Ed')?.src ?? '',
    source: n.querySelector('div.vr1PYe')?.textContent ?? '',
    image: n.querySelector('figure img')?.src ?? '',
    title: n.querySelector('a[tabindex="0"]')?.textContent ?? '',
    time: n.querySelector('time')?.dateTime,
    url: n.querySelector('a[tabindex="0"]')?.href ?? ''
  }))
  console.log(normalized)
  update(c => ({ ...c, topicToNews: { ...c.topicToNews, [topic]: normalized } }))
}
const useGoogleNews = () => useAtom(GoogleNewsScraperStateAtom)

useGoogleNews.fetchGoogleNewsByTopicId = fetchGoogleNewsByTopicId
useGoogleNews.update = update
export default useGoogleNews as typeof useGoogleNews & {
  fetchGoogleNewsByTopicId: typeof fetchGoogleNewsByTopicId
  update: typeof update
}
