import { Content, DotLoading, Icon } from '@/components'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { memo } from 'react'

export default memo(
  ({
    url,
    isFailed,
    onUpload,
    onViewOriginal,
    name
  }: {
    url: string
    isFailed: boolean
    onUpload: (html: string) => void
    onViewOriginal: VoidFunction
    name: string
  }) => {
    const { t } = useTranslation()
    let decodedUrl = url ?? ''
    try {
      decodedUrl = decodeURIComponent(decodedUrl)
    } catch (e) {}
    return (
      <Content
        style={{ margin: 'auto', zIndex: 100, position: 'absolute', inset: 0 }}
        flex
        column
        alignItems={'center'}
        justifyContent={'center'}
        gap={10}
        fullWidth
      >
        {isFailed ? (
          <div className={'flex max-w-lg flex-col items-center'}>
            <Icon name={'park-error'} className={'text-red-500'} theme={'filled'} size={48} />
            <div className={'text-2xl font-bold mt-4 mb-3'}>{t(trans.Errors.LoadError)}</div>
            <div
              className={'hover:underline line-clamp-1 font-size-13 transparent-font cursor-pointer'}
              style={{
                wordBreak: 'break-all',
                textAlign: 'center'
              }}
              onClick={() => window.open(url)}
            >
              {decodedUrl}
            </div>
            <div className={'flex gap-3'}>
              <div onClick={onViewOriginal} className={'mt-4 reverse-theme-button !px-4 !py-1.5'}>
                {t(trans.ViewOriginal)}
              </div>
            </div>
          </div>
        ) : (
          <DotLoading />
        )}
      </Content>
    )
  }
)
