import { useRef, useState } from 'react'
import { MetaStore } from '@/stores'
import { AnimatePopover, Button, Content, ContentEditor, IconWithPopover, Image, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { GlobalGraphInstance, TypeToTypeName, useRenderObject } from '@/core'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { DateFormat } from '@/utils'
import { toast } from 'react-hot-toast'
import { RENDEVOZ_DEFAULT_TABS } from '@/lifycycle/startup/registerTabs'

const flatButton = css([
  ClassName.flatButton(999, '3px 10px '),
  {
    backgroundColor: Colors.Background.ButtonHover,
    fontWeight: 600,
    borderRadius: '999px !important',
    fontSize: 13,
    gap: 4,
    alignItems: 'center',
    ':hover': {
      backgroundColor: `${Colors.Background.ButtonActive} !important`
    }
  }
])

const MetaMainDetails = ({
  metaId,
  onOpenTag,
  onViewLinks,
  onViewAtt,
  onPreview
}: {
  onViewAtt: VoidFunction
  onPreview: VoidFunction
  metaId: number
  onOpenTag: VoidFunction
  onViewLinks: VoidFunction
}) => {
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
  const { renderTags, renderFrom, renderOriginalText } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  if (!object) return null
  const { editName, editDesciption } = mainState
  return (
    <Content flex column fullHeight>
      <Content flex gap={12}>
        {object?.coverImgSrc && (
          <Image
            preview={true}
            src={object.coverImgSrc}
            width={96}
            height={96}
            containerStyle={{
              borderRadius: 8
            }}
            style={{ objectFit: 'cover' }}
          />
        )}
        <Content flex column auto gap={5} justifyContent={'center'}>
          {renderTags({})}
          {editName ? (
            <ContentEditor
              style={{
                maxHeight: 240,
                overflowY: 'auto',
                width: '100%'
              }}
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
              style={{ fontWeight: 500, cursor: 'pointer', fontSize: 14 }}
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
              style={{
                maxHeight: 240,
                width: '100%',
                overflowY: 'auto'
              }}
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
                style={{ fontWeight: 400, color: Colors.Font.Transparent, fontSize: 13, cursor: 'pointer', whiteSpace: 'pre-wrap' }}
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
          {renderOriginalText()}
          {renderFrom({})}
        </Content>
      </Content>
      {/*<Content*/}
      {/*  flex*/}
      {/*  alignItems={'center'}*/}
      {/*  gap={10}*/}
      {/*  style={{*/}
      {/*    fontSize: 12,*/}
      {/*    color: Colors.Font.Transparent,*/}
      {/*    marginTop: 6*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <div>{DateFormat.formatDistanceToNowStrict(object.createdAt, true)} </div>*/}
      {/*  {object.viewAt && <div>Last viewed: {DateFormat.formatDistanceToNowStrict(object.viewAt, true)}</div>}*/}
      {/*</Content>*/}
      <Content style={{ paddingTop: 12, flexWrap: 'wrap' }} flex gap={8}>
        <Button.IconButton
          text={t('general.Open')}
          icon={'park-share'}
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
          }}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            MetaStore.updateMetaObject({ id: metaId, pinned: !object.pinned }, true)
          }}
          theme={object.pinned ? 'filled' : undefined}
          style={{
            color: object.pinned ? Colors.Common.Red : undefined
          }}
          text={object.pinned ? t('general.unpin') : t('general.pin')}
          icon={'park-like'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton onClick={onViewLinks} text={t('general.Links')} icon={'park-link'} className={flatButton}></Button.IconButton>
        <Button.IconButton onClick={onOpenTag} text={t('general.Tags')} icon={'park-tag-one'} className={flatButton}></Button.IconButton>

        <Button.IconButton
          onClick={() => {
            GlobalGraphInstance.open?.({ id: metaId }, true)
          }}
          text={t('general.graph')}
          icon={'park-share-one'}
          className={flatButton}
        ></Button.IconButton>
        <IconWithPopover
          closeOnContentClick={true}
          content={
            <WithBorder padding={6} style={{ fontSize: 14 }} width={180}>
              <Button.IconButton
                text={'Generate link'}
                onClick={() => {
                  const link = `rendevoz://object/${metaId}`
                  navigator.clipboard.writeText(link)
                  toast.success(
                    <Content className={ClassName.description()}>
                      <div style={{ textTransform: 'none' }}>{t('general.link is generated for this object')}!</div>
                      <div style={{ userSelect: 'all', textTransform: 'none' }}>{link}</div>
                    </Content>
                  )
                }}
                icon={'park-link'}
              />
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
              <Button.IconButton
                onClick={() => {
                  onViewAtt()
                }}
                text={'View attachments'}
                icon={'park-link-one'}
              ></Button.IconButton>
              <Button.IconButton
                text={'Delete object'}
                icon={'park-delete'}
                dangerous={true}
                onClick={() => {
                  MetaStore.deleteMetaObject(metaId, true)
                }}
              ></Button.IconButton>
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
