import { memo, useEffect, useRef, useState } from 'react'
import { BetterInput, Icon } from '@/components'
import { Icons, Trans } from '@/consts'
import { useDebounceFn } from '@/hooks'
import classnames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
export default memo(
  ({
    query,
    debounce,
    onChange,
    className,
    size = 14,
    width = 140
  }: {
    query?: string
    onChange?: (query: string | undefined) => void
    debounce?: number
    className?: string
    size?: number
    width?: number
  }) => {
    const debounceFunc = useDebounceFn(
      (v: string) => {
        onChange?.(v)
      },
      { wait: debounce ?? 1000 }
    )
    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => {
      const ele = ref.current
      if (ele) {
        ele.value = query ?? ''
      }
    }, [query])
    const { t } = useTranslation()

    const [searchVisible, setSearchVisible] = useState(query ? true : false)
    return (
      <AnimatePresence initial={false} mode={'wait'}>
        {searchVisible ? (
          <motion.div
            initial={{ width: 30, opacity: 0 }}
            animate={{ width: width ?? 200, opacity: 1 }}
            exit={{ width: 30, opacity: 0 }}
            key={1}
            className={'flex overflow-hidden items-center bg-input gap-2 rounded-lg px-2 py-1.5'}
          >
            <Icon name={Icons.Search} size={18} className={'transparent-font'} />
            <BetterInput
              onBlur={() => {
                if (!query) {
                  setSearchVisible(false)
                }
              }}
              autoFocus
              ref={ref}
              placeholder={t(Trans.Search)}
              defaultValue={query}
              style={{
                width: 0
              }}
              className='flex-1 overflow-hidden'
              onChange={e => {
                debounceFunc.run(e.target.value)
              }}
            />
            {query && (
              <Icon
                strokeWidth={6}
                name={'park-close'}
                className={'shrink-0 transparent-font cursor-pointer'}
                size={13}
                onClick={() => {
                  setSearchVisible(false)
                  onChange?.(undefined)
                }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div transition={{ duration: 0.1 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={2}>
            <Icon onClick={() => setSearchVisible(true)} name={Icons.Search} size={size} className={className} />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }
)
