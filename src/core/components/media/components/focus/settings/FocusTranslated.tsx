import classNames from 'classnames'
import FocusSettingsConsts from './FocusSettingsConsts'
import useFocusSettings from '../useFocusSettings'

export default () => {
  const CLASS = 'p-3 gap-3 flex items-center cursor-pointer'
  const langFlags = FocusSettingsConsts.LangFlags
  const [settings, setSettings] = useFocusSettings()
  return (
    <div className='p-5 overflow-y-auto flex-1'>
      <div className='border rounded-lg'>
        {Object.entries(FocusSettingsConsts.TranslatedLangs).map((i, idx, arr) => (
          <div
            onClick={() => setSettings(s => ({ ...s, targetTranslate: i[0] }))}
            key={i[0]}
            className={classNames(CLASS, idx !== arr.length - 1 && 'border-bottom')}
          >
            {i[0] && langFlags[i[0]] ? <span style={{ fontSize: '1.6em', lineHeight: 1 }}>{langFlags[i[0]]}</span> : null}
            {i[1]}
            {FocusSettingsConsts.renderSelect(i[0] === settings.targetTranslate)}
          </div>
        ))}
      </div>
    </div>
  )
}
