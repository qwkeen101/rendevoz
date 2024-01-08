// for whiteboard
import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon, Tooltip } from '@/components'
import { CSSProperties, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ILabel } from '~/typings'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { ClassName } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

export default memo(({ metaId, style, showImage }: { metaId: number; style?: CSSProperties; showImage?: boolean}) => {
  const metaObject = MetaStore.useValue(metaId)
  const { t } = useTranslation()
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
  useLayoutEffect(() => {
    if (inputRef.current && metaObject) {
      const v = inputRef.current.value
      if (v !== metaObject.name) {
        inputRef.current.value = metaObject.name || ''
      }
    }
  }, [metaObject?.name])
  return (
    <Content
      contentEditable={false}
      onPointerLeave={() => setShowToolbar(false)}
      onPointerEnter={() => {
        setShowToolbar(true)
      }}
      style={style}
      fullWidth
      onPointerMove={() => !showToolbar && setShowToolbar(true)}
    >
      {metaObject?.coverImgSrc && showImage !== false && <img src={metaObject.coverImgSrc} width={'100%'} />}
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
                size={12}
                onClick={() => {
                  Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
                }}
                className={ClassName.flatButton(4, '2px')}
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
            borderLeft: `2px solid ${Colors.getAdaptColor(label.color) || 'var(--emphasis)'}`,
            marginTop: 8,
            background: Colors.Background.ButtonHover
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
        placeholder={t('general.Add note')}
        className={ClassName.noStyleInput}
      />
    </Content>
  )
})
