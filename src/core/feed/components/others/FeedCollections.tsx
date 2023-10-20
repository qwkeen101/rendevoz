import { Content } from '@/components'
import { useEffect, useState } from 'react'
import { ObjectStore } from '@/stores'

type Feed = {
  category: string
  items: {
    name: string
    link: string
    website: string
    logo?: string
  }[]
}

const fetchAllFeeds = async () => {
  const allResults = (await fetch(`https://raw.githubusercontent.com/Rendevoz/Rendevoz/main/rss/rss.json`).then(res =>
    res.json()
  )) as string[]
  const allFeeds = allResults.map(i => `https://raw.githubusercontent.com/Rendevoz/Rendevoz/main/rss/${i}.json`)
  const allEntries = await Promise.all(
    allFeeds.map(async f => {
      const res = await fetch(f).then(res => res.json())
      return {
        category: res.category,
        items: Object.values(res.items)
      }
    })
  )
  return allEntries
}

const FeedCollections = () => {
  const [currentEntry, setCurrentEntry] = useState<Feed>()
  const [allFeeds, setAllFeeds] = useState<Feed[]>()
  useEffect(() => {
    fetchAllFeeds().then(res => setAllFeeds(res))
  }, [])

  return (
    <Content>
      <div onClick={() => setCurrentEntry(undefined)}>back</div>
      {currentEntry ? (
        <>
          {currentEntry.items.map(i => (
            <div
              onClick={() => {
                ObjectStore('feedCollection').addOne({
                  feedUrl: i.link,
                  name: i.name,
                  items: []
                })
              }}
            >
              {i.logo && <img src={`https://raw.githubusercontent.com/Rendevoz/Rendevoz/main/rss/logos/${i.logo}`} height={20} />}
              {i.name}
            </div>
          ))}
        </>
      ) : (
        <>
          {allFeeds?.map(entry => (
            <Content>
              <div
                onClick={() => {
                  setCurrentEntry(entry)
                }}
              >
                {entry.category}
              </div>
            </Content>
          ))}
        </>
      )}
    </Content>
  )
}

export default FeedCollections
