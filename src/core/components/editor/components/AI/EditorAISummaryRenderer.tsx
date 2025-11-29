import { memo } from 'react'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import classnames from 'classnames'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'

export default memo(({ active }: { active: boolean }) => {
  const [mediaState] = useMediaState()
  const instance = useMediaInstance()
  const { aiSummary } = mediaState
  if (aiSummary) {
    return (
      <div className={classnames('p-6 pt-0 max-h-full overflow-y-auto', !active && 'hidden')}>
        <div>{aiSummary.summary.summary}</div>
        <div className={'transparent-font font-size-12 mt-3 mb-1'}>Keywords</div>
        <div className={'flex flex-wrap gap-x-2'}>
          {aiSummary.summary.keywords.map(i => (
            <div key={i}>{i}</div>
          ))}
        </div>
        <div className={'transparent-font font-size-12 mt-3 mb-1'}>Takeaways</div>
        <ol className={'flex flex-col gap-1'}>
          {aiSummary.summary.takeaways.map(i => (
            <li className={'cursor-pointer'} onClick={() => instance.actionOps?.jumpTo(i.time)} key={i.description}>
              {i.description}
            </li>
          ))}
        </ol>
      </div>
    )
  }
})
