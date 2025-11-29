import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import MediaToolbar from '@/core/components/media/components/MediaToolbar'
import classnames from 'classnames'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default () => {
  const { layout, mode, description, name } = useSelectMediaState(s => ({
    layout: s.layout,
    mode: s.mode,
    description: s.description,
    name: s.name
  }))
  const audioMode = mode === 'audio'
  const showDetails = !audioMode
  const { t } = useTranslation()
  return (
    <>
      {showDetails && (
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.4
          }}
          className={classnames('font-bold w-full -mb-1', !name && 'super-transparent-font')}
        >
          {name || t(trans.Unnamed)}
        </div>
      )}
      <div className={'w-full @container'}>
        <MediaToolbar
          className={audioMode ? classnames('justify-center @4xl:justify-start', !layout?.episodeMode && '-mt-4 @4xl:mt-0') : undefined}
        />
      </div>
      {description && (
        <div className={'whitespace-pre-wrap break-all pb-20'}>
          {description.split('\n').map((i, idx) => (
            <p key={idx}>{i}</p>
          ))}
        </div>
      )}
    </>
  )
}
