import { useTheme } from '@/hooks'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { css } from '@emotion/css'
import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'
import { MetaObject } from '~/typings/data'
import { Content, Icon, Image } from '../base'
import { Button } from '../base/button'
import useFileUpload from '../base/useFileUpload'
import AutosizeTextarea from '../custom/input/autosizeTextarea'

const EditMetaObjectForm = ({
  metaObject,
  onUpdate,
  title
}: {
  metaObject?: MetaObject
  onUpdate: (newMeta: MetaObject) => void
  title: string
}) => {
  const innerMeta = useRef(metaObject || {})
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const forceRender = useUpdate()
  useEffect(() => {
    innerMeta.current = metaObject || {}
  }, [metaObject])
  const { renderUploader, upload, removeFile } = useFileUpload(file => {
    saveImageLocally(Id.getStrId(), file).then(data => {
      innerMeta.current.coverImgSrc = data.data
      forceRender()
    })
  })
  return (
    <>
      {renderUploader()}
      <Content flex column gap={16}>
        <div
          className={css({
            fontSize: 14,
            fontWeight: 600,
            padding: '0px 0px 8px',
            borderBottom: '1px solid rgba(31,34,37,0.06)'
          })}
        >
          {title}
        </div>
        <input
          placeholder="Name"
          style={{ height: '40px' }}
          onChange={e => {
            innerMeta.current.name = e.target.value
          }}
          defaultValue={metaObject?.name}
          className={ClassName.input()}
        ></input>
        <AutosizeTextarea
          placeholder="Discription..."
          minRows={2}
          style={{ resize: 'none', overflow: 'hidden' }}
          className={ClassName.input()}
          defaultValue={metaObject?.description}
          onChange={e => {
            innerMeta.current.description = e.target.value
          }}
        />
        <Content
          flex
          column
          className={css({
            color: defaultFontColorGrey,
            padding: 4,
            borderRadius: 4,
            background: 'rgba(31,34,37,0.03)',
            boxShadow: 'rgba(31,34,37,0.06) 0px 0px 0px 1px inset'
          })}
        >
          <Content flex justifyContent="space-between" onClick={upload} className={ClassName.flatButton()}>
            <span>Change cover</span>
            <Icon name="park-right" />
          </Content>
          {innerMeta.current.coverImgSrc && (
            <div style={{ position: 'relative' }}>
              <Image
                className={css({
                  width: '100% !important',
                  height: 150,
                  overflow: 'hidden',
                  borderRadius: 8,
                  marginTop: 4,
                  paddingTop: 4,
                  borderTop: '1px solid rgba(34,35,57,0.07)'
                })}
                src={innerMeta.current.coverImgSrc}
              />
              <Icon
                containerClassName={css({
                  position: 'absolute !important',
                  top: 14,
                  right: 5
                })}
                name="park-close"
                onClick={() => {
                  innerMeta.current.coverImgSrc = undefined
                  forceRender()
                  removeFile()
                }}
                className={ClassName.circleButton()}
              />
            </div>
          )}
        </Content>
        <Button
          className={css({
            padding: 6
          })}
          onClick={() => {
            onUpdate(innerMeta.current)
          }}
        >
          Confirm
        </Button>
      </Content>
    </>
  )
}

export default EditMetaObjectForm
