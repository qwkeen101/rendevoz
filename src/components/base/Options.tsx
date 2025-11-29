import { memo } from 'react'
import classnames from 'classnames'

export default memo(
  ({
    onChange,
    bg,
    options,
    selected
  }: {
    options: { key: string | number; name: string }[]
    onChange: (k: string | number) => void
    selected?: string | number
    bg?: 'secondary' | 'third'
  }) => {
    const selectedKey = selected ?? options[0]?.key
    return (
      <div style={{ padding: 3 }} className={`flex bg-${bg} w-fit font-medium rounded-lg`}>
        {options.map(o => (
          <div
            className={classnames(
              'px-3 cursor-pointer py-1',
              o.key === selectedKey
                ? 'rounded-lg bg-global dark:bg-transparent dark:text-green-600'
                : 'opacity-40 hover:opacity-100 transition-opacity'
            )}
            onClick={() => {
              onChange(o.key)
            }}
            key={o.key}
          >
            {o.name}
          </div>
        ))}
      </div>
    )
  }
)
