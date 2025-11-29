import { memo, ReactNode, RefObject } from 'react'
import classnames from 'classnames'
import './layout.less'
export default memo(
  ({
    children,
    header,
    sidebar,
    right,
    bottom,
    bodyRef,
    scrollElementRef
  }: {
    children: ReactNode
    header: ReactNode
    sidebar: ReactNode
    bottom?: ReactNode
    right?: ReactNode
    bodyRef?: RefObject<HTMLDivElement>
    scrollElementRef: RefObject<HTMLDivElement>
  }) => {
    return (
      <div className={'flex-col flex w-full h-full page-layout'}>
        {header}
        <div ref={bodyRef} className={'flex flex-1 overflow-hidden w-full'}>
          {sidebar}
          <div className='p-3 pt-0 overflow-hidden flex-1 h-full'>
            <div
              ref={scrollElementRef}
              style={{
                background: 'var(--background-base)'
              }}
              className={classnames('relative rounded-lg bg-secondary h-full overflow-x-hidden overflow-y-auto w-full')}
            >
              {children}
            </div>
          </div>
          {right}
        </div>
        {bottom}
      </div>
    )
  }
)
