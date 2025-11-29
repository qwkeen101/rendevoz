import { Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { CSSProperties, memo } from 'react'
import classnames from 'classnames'

export default memo(({ style, className }: { style?: CSSProperties; className?: string }) => {
  const { t } = useTranslation()
  return (
    <div
      className={classnames('transparent-font h-full flex-1 gap-4 flex items-center justify-center flex-col', className)}
      style={{
        opacity: 0.8,
        ...style
      }}
    >
      <div
        style={{
          WebkitTextFillColor: 'transparent',
          fontVariationSettings: '"FILL" 0,"wght" 300,"GRAD" 0,"opsz" 16!important',
          WebkitBackgroundClip: 'text',
          color: 'white',
          fontSize: 40,
          animation: 'hue 6s linear infinite',
          backgroundImage: 'linear-gradient(135deg, #75FF83 0%, #E5B384 52.6%, #DD16A5 100%)'
        }}
        className='border mgc_box_3_line rounded-lg p-6'
      ></div>
      <div className='text-base'>{t('general.No data')}</div>
    </div>
  )
})
