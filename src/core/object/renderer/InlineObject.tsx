import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import classnames from 'classnames'
import React, { CSSProperties } from 'react'
import ContextMenu from '@/components/contextMenu'
import { ObjectActionMenu } from '@/core'
import { WithBorder } from '@/components'

export default ({ id, onClick, style }: { id: number; onClick?: React.MouseEventHandler; style?: CSSProperties }) => {
  const meta = MetaStore.useValue(id)
  const { t } = useTranslation()
  if (!meta) return null
  const name = Global.metaOps.getMetaName(meta)
  return (
    <ContextMenu
      content={setV => (
        <WithBorder>
          <ObjectActionMenu metaObjectId={id} onClose={() => setV(false)} />
        </WithBorder>
      )}
    >
      <div style={style} className={'flex items-center gap-2.5'}>
        <div
          onClick={
            onClick ??
            (() => {
              Global.layoutOps?.openObject(id)
            })
          }
          className={classnames('line-clamp-1 break-all hover:underline cursor-pointer font-size-13', !name && 'super-transparent-font')}
        >
          {name || t(trans.Unnamed)}
        </div>
        <div
          className={'transparent-font rounded bg-third shrink-0 font-size-11 px-1'}
          style={{
            height: 18,
            lineHeight: '18px'
          }}
        >
          {Global.utils.getTypeName(meta.type)}
        </div>
      </div>
    </ContextMenu>
  )
}
