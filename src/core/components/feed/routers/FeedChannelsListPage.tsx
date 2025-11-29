import { memo } from 'react'
import channels from '../news/FeedChannels.json'
import { TabPane, Tabs } from '@/components'
import useFeedInstance from '../hooks/useFeedInstance'
export default memo(() => {
  const instance = useFeedInstance()
  return (
    <div className='p-8 flex gap-8 flex-wrap w-full'>
      <Tabs container={false}>
        {Object.entries(channels).map(i => (
          <TabPane tab={i[0]} key={i[0]}>
            <div
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
              }}
              className='grid gap-6'
            >
              {i[1].map(o => (
                <Item
                  onClick={() => {
                    instance.feedOps
                      ?.importRssAsCollection(o.feed, undefined, {
                        image: `/icons/${o.name}.png`,
                        name: o.name,
                        hidden: true
                      })
                      .then(i => {
                        instance.feedOps?.navigate('/feed/collection/' + i.id)
                      })
                  }}
                  {...o}
                  key={o.name}
                  image={`/icons/${o.name}.png`}
                />
              ))}
            </div>
          </TabPane>
        ))}
      </Tabs>
    </div>
  )
})

const Item = ({
  url,
  name,
  description,
  image,
  onClick
}: {
  url: string
  name: string
  description: string
  image: string
  onClick: VoidFunction
}) => {
  return (
    <div onClick={onClick} className='bg-secondary p-4 light-hover cursor-pointer transition-colors gap-6 flex rounded-xl'>
      <img src={image} className='size-12 rounded-md' />
      <div>
        <div className='text-lg font-bold'>{name}</div>
        <div className='transparent-font font-size-13 my-0.5'>{url}</div>
        <div>{description}</div>
      </div>
    </div>
  )
}
