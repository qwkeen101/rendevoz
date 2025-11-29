import { CSSProperties } from 'react'
import { Button, Toolbar } from '@/components'
import { IGeneralSource } from '~/typings'
import classnames from 'classnames'
import UserService from '@/api/services/user.service'
import { GlobalInstance } from '@/hooks'

export type ExplainInput = { source?: IGeneralSource; text: string }
export default ({
  className,
  style,
  onGetExplain,
  toolbarMode
}: {
  className?: string
  style?: CSSProperties
  toolbarMode?: boolean
  onGetExplain?: () => ExplainInput | undefined
}) => {
  const isPro = UserService.useIsUserPro(true)
  if (!isPro) return null
  if (toolbarMode) {
    return (
      <Toolbar.Item
        onClick={e => {
          const explainer = onGetExplain?.()
          if (explainer) {
            GlobalInstance.commonOps?.explain?.({
              ...explainer,
              e
            })
          }
        }}
        style={{
          borderRight: '1px solid var(--border-background)',
          padding: '0px 12px 0 10px',
          height: '100%',
          borderRadius: 0,
          ...style
        }}
      >
        <Button.IconButton
          style={{
            background: 'unset',
            padding: '0px',
            borderRadius: 0
          }}
          icon={'park-translate'}
          text={'Explain'}
        />
      </Toolbar.Item>
    )
  }
  return (
    <Button.IconButton
      className={classnames(className)}
      style={style}
      onClick={e => {
        const explainer = onGetExplain?.()
        if (explainer) {
          GlobalInstance.commonOps?.explain?.({
            ...explainer,
            e
          })
        }
      }}
      text={'Explain'}
    />
  )
}
