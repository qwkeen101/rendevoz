// for whiteboard
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import TimeRenderer from '@/core/object/renderer/object/TimeRenderer'
import OriginalTextRenderer from '@/core/object/renderer/object/OriginalTextRenderer'
import { ILabel } from '~/typings'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'

export default memo(({ metaId }: { metaId: number }) => {
  const metaObject = MetaStore.useValue(metaId)
  const label = ObjectStore(metaObject?.type).useValue(metaObject?.objectId) as ILabel | undefined
  const from = useMemo(() => {
    if (metaObject?.fromObject) {
      return {
        name: MetaStore.getMetaObjectsMap().get(metaObject.fromObject.metaId)?.name,
        icon: Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.fromObject.type)
      }
    }
  }, [metaObject?.fromObject])
  const normalizedTime = useMemo(() => {
    if (label?.time !== undefined) {
      return normalizeSecondsToTime(label.time)
    }
  }, [label?.time])
  const inputRef = useRef<HTMLInputElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  useEffect(() => {
    if (inputRef.current && metaObject) {
      const v = inputRef.current.value
      if (v !== metaObject.name) {
        inputRef.current.value = metaObject.name || ''
      }
    }
  }, [metaObject?.name])
  return (
    <Content
      onPointerLeave={() => setShowToolbar(false)}
      onPointerEnter={() => {
        setShowToolbar(true)
      }}
      onPointerMove={() => !showToolbar && setShowToolbar(true)}
    >
      {metaObject?.coverImgSrc && <img src={metaObject.coverImgSrc} width={'100%'} />}
      <Content>
        <Content
          flex
          alignItems={'center'}
          justifyContent={'space-between'}
          style={{
            padding: '8px 12px 0px'
          }}
          gap={6}
        >
          {from && (
            <Content
              flex
              gap={8}
              style={{
                fontSize: 14,
                flex: 1
              }}
            >
              <Icon size={16} name={from.icon} />
              <div className={ClassName.ellipsisFont(1)}>{from.name}</div>
              {normalizedTime && <div style={{ flexShrink: 0 }}> - {normalizedTime}</div>}
            </Content>
          )}
          {showToolbar && (
            <Content flex gap={4}>
              <Tooltip content={'View source'}>
                <Icon
                  onClick={() => {
                    Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
                  }}
                  className={ClassName.flatButton(4, '3px')}
                  name={'park-share'}
                />
              </Tooltip>
            </Content>
          )}
        </Content>
        {label?.selectedText && metaObject && (
          <div
            style={{
              padding: '4px 10px 4px 10px',
              borderLeft: '2px solid var(--select-color)',
              marginTop: 8,
              background: label.color || Colors.Background.ButtonHover
            }}
          >
            {label.selectedText}
          </div>
        )}
        <AutosizeTextarea
          ref={inputRef}
          onBlur={e => {
            metaObject && MetaStore.updateMetaObject({ id: metaObject.id, name: e.target.value })
          }}
          style={{
            resize: 'none',
            width: '100%',
            padding: '8px 12px'
          }}
          defaultValue={metaObject?.name}
          placeholder={'Add note...'}
          className={ClassName.noStyleInput}
        />
      </Content>
    </Content>
  )
})
