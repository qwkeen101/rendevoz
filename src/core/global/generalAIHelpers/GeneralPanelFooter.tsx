import { Button, Icon } from '@/components'
import { Icons } from '@/consts'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

const GeneralPanelFooter = memo(
  ({
    on,
    hasLabel,
    showLabel = true
  }: {
    on?: (type: 'copy' | 'addAsObject' | 'tag' | 'moveTo' | 'chat') => void
    hasLabel?: boolean
    showLabel?: boolean
  }) => {
    const { t } = useTranslation()
    return (
      <div className={'flex gap-3 font-size-13 justify-between flex-wrap items-center'} style={{ padding: '0px 12px' }}>
        <Button.IconButton
          onClick={() => on?.('chat')}
          icon={'custom-stars'}
          text={t(trans.AI.ContinueWithChat)}
          className={'border-round-icon-button'}
        />
        <div className={'flex gap-3 items-center'}>
          <Icon onClick={() => on?.('copy')} name={Icons.Copy} tooltip={t(trans.Copy)} className={'border-rounded-button !p-2'} />
          {showLabel && (
            <Icon
              onClick={() => on?.('addAsObject')}
              name={hasLabel ? 'custom-info' : 'park-label'}
              tooltip={t(hasLabel ? trans.Meta.ViewDetails : 'general.Save as highlight')}
              className={'border-rounded-button !p-2'}
            />
          )}
        </div>
      </div>
    )
  }
)

export default GeneralPanelFooter
