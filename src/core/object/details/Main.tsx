import { useRef, useState } from 'react'
import { MetaStore } from '@/stores'
import { AnimatePopover, Button, Content, ContentEditor, IconWithPopover, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { GlobalGraphInstance, TypeToTypeName, useRenderObject } from '@/core'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'

const flatButton = css([
  ClassName.flatButton(999, '3px 10px'),
  {
    backgroundColor: Colors.Background.ButtonHover,
    fontWeight: 600,
    borderRadius: '999px !important',
    fontSize: 13,
    ':hover': {
      backgroundColor: Colors.Background.ButtonActive
    }
  }
])
const MetaMainDetails = ({ metaId, onOpenTag, onViewLinks }: { metaId: number; onOpenTag: VoidFunction; onViewLinks: VoidFunction }) => {
  const object = MetaStore.useValue(metaId)
  const [mainState, setMainState] = useState<{
    editName: boolean
    editImage: boolean
    editDesciption: boolean
  }>({
    editImage: false,
    editDesciption: false,
    editName: false
  })
  const { renderTags } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  const parentContainerRef = useRef(null)
  if (!object) return null
  const { editImage, editName, editDesciption } = mainState
  return (
    <Content flex column>
      <Content flex gap={12}>
        {object?.coverImgSrc && <img src={object.coverImgSrc} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 8 }} />}
        <Content flex column>
          {renderTags({})}
          {editName ? (
            <ContentEditor
              onChange={v => {
                setMainState(s => ({ ...s, editName: false }))
                if (v) {
                  MetaStore.updateMetaObject({ id: metaId, name: v }, true)
                }
              }}
              value={object.name}
            />
          ) : (
            <div
              style={{ fontWeight: 500, cursor: 'pointer' }}
              onClick={() => {
                if (!window.getSelection()?.toString()) {
                  setMainState(s => ({ ...s, editName: true }))
                }
              }}
            >
              {object.name}
            </div>
          )}
          {editDesciption ? (
            <ContentEditor
              onChange={v => {
                setMainState(s => ({ ...s, editDesciption: false }))
                if (v) {
                  MetaStore.updateMetaObject({ id: metaId, description: v }, true)
                }
              }}
              value={object.description}
            />
          ) : (
            object.description && (
              <div
                style={{ fontWeight: 400, color: Colors.Font.Transparent, fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  if (!window.getSelection()?.toString()) {
                    setMainState(s => ({ ...s, editDesciption: true }))
                  }
                }}
              >
                {object.description}
              </div>
            )
          )}
        </Content>
      </Content>
      <Content style={{ marginTop: 12 }} flex gap={8}>
        <Button.IconButton
          text={'Open'}
          icon={'park-preview-open'}
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
          }}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton onClick={onViewLinks} text={'Links'} icon={'park-tag-one'} className={flatButton}></Button.IconButton>
        <Button.IconButton onClick={onOpenTag} text={'Tags'} icon={'park-tag-one'} className={flatButton}></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            GlobalGraphInstance.open?.({ id: metaId }, true)
          }}
          text={'Graph'}
          icon={'park-share-one'}
          className={flatButton}
        ></Button.IconButton>
        <IconWithPopover
          content={
            <WithBorder padding={6} style={{ fontSize: 14 }}>
              {!object.coverImgSrc ? (
                <Button.IconButton
                  text={'Upload image'}
                  icon={'park-add-picture'}
                  onClick={() => {
                    Rendevoz.Actions.Utils.uploadFile({ accept: 'image/*' }).then(res => {
                      if (!Array.isArray(res)) {
                        Rendevoz.Actions.Utils.saveFile(res, res.name, undefined, 'imgs').then(pa => {
                          MetaStore.updateMetaObject({ id: metaId, coverImgSrc: pa }, true)
                        })
                      }
                    })
                  }}
                />
              ) : (
                <Button.IconButton
                  text={'Delete image'}
                  icon={'park-error-picture'}
                  onClick={() => {
                    MetaStore.updateMetaObject({ id: metaId, coverImgSrc: undefined }, true)
                  }}
                />
              )}
              {!editDesciption && !object.description && (
                <Button.IconButton
                  text={'Add description'}
                  icon={'park-edit'}
                  onClick={() => {
                    setMainState(s => ({ ...s, editDesciption: true }))
                  }}
                ></Button.IconButton>
              )}
            </WithBorder>
          }
          style={{ padding: '4px' }}
          name={'park-more'}
          className={flatButton}
        />
      </Content>
    </Content>
  )
}

export default MetaMainDetails
