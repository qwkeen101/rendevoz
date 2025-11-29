import classNames from 'classnames'
import useMediaState from '../../../hooks/useMediaState'
import FocusSettingsConsts from './FocusSettingsConsts'
import { EmptyList } from '@/core/components/common'

export default () => {
  const CLASS = 'p-3 gap-3 flex items-center cursor-pointer'
  const [state, setState] = useMediaState()
  const langFlags = FocusSettingsConsts.LangFlags
  if (!state.subtitleList?.length)
    return (
      <div className='p-5 flex-1 flex-col flex'>
        <EmptyList />
      </div>
    )
  return (
    <div className='p-5 overflow-y-auto flex-1'>
      <div className='border rounded-lg'>
        {state.subtitleList?.map((i, idx, arr) => (
          <div
            onClick={() => {
              setState(s => ({ ...s, subtitleLang: i.lang }))
            }}
            key={i.lang}
            className={classNames(CLASS, idx !== arr.length - 1 && 'border-bottom')}
          >
            {i.code && langFlags[i.code] ? <span style={{ fontSize: '1.6em', lineHeight: 1 }}>{langFlags[i.code]}</span> : null}
            {i.lang}
            {FocusSettingsConsts.renderSelect(i.lang === state.subtitleLang)}
          </div>
        ))}
      </div>
    </div>
  )
}
