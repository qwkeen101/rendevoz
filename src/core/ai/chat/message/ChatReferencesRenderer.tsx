import { IAIMessage } from '~/typings'
import { memo } from 'react'

export default memo(({ references }: { references: Required<IAIMessage>['references'] }) => {
  return (
    <>
      {references.map(i => (
        <div
          onClick={() => {
            Global.utils.openSpecificURL(i.url)
          }}
          key={i.url}
          style={{ width: '130px' }}
          className={'bg-third shrink-0 p-2 em:mt-0.5 em:mb-1 hover-after-bg-hover cursor-pointer flex flex-col rounded-md'}
        >
          <div
            style={{
              fontSize: '0.86em',
              marginBottom: '0.5em'
            }}
            className={'break-all line-clamp-2 shrink-0'}
          >
            {i.title}
          </div>
          <div
            style={{
              gap: '0.5em',
              fontSize: '0.8em'
            }}
            className={'flex items-center shrink-0 mt-auto transparent-font'}
          >
            <img src={`https://www.google.com/s2/favicons?domain=${i.url}`} className={'em:size-5'} />
            {/*<span className={'line-clamp-1 break-all'}>{i.site_name}</span>*/}
          </div>
        </div>
      ))}
    </>
  )
})
