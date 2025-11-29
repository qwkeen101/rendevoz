import { AnimatePopover, Icon, Menu, WithBorder } from '@/components'
import useFeedData from '../hooks/useFeedData'
import { memo } from 'react'

const channels = [
  'Fox News',
  'CNN',
  'The New York Times',
  'The Washington Post',
  'The Wall Street Journal',
  'Associated Press',
  'The Guardian',
  'NPR',
  'Politico',
  'Bloomberg',
  'ABC News',
  'CBS News',
  'NBC News',
  'USA Today',
  'Los Angeles Times',
  'Forbes',
  'Time',
  'Al Jazeera'
]

export default memo(() => {
  const data = useFeedData()
  const channel = data.channel ?? 'CNN'
  return (
    <AnimatePopover
      padding={6}
      positions={['bottom']}
      align='start'
      content={setV => (
        <WithBorder className='py-1 max-h-96 overflow-y-auto'>
          <Menu.NavigationMenu
            onSelect={k => {
              if (k && 'key' in k) {
                setV(false)
                useFeedData.updateData(curr => ({ ...curr, channel: k.key }))
              }
            }}
            defaultSelected={[channel]}
            layout={channels.map(i => ({
              type: 'item',
              key: i,
              text: i,
              image: `/icons/${i}.png`
            }))}
          />
        </WithBorder>
      )}
    >
      <div className='flex items-center rounded-3xl light-hover pl-3 pr-2 select-none py-2 cursor-default gap-3'>
        <img src={`/icons/${channel}.png`} className='size-6 rounded' />
        <div className='font-bold font-size-13'>{channel}</div>
        <Icon name='park-down' className='opacity-60 ml-2' strokeWidth={6} />
      </div>
    </AnimatePopover>
  )
})
