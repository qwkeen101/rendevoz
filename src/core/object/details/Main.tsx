import { MetaStore } from '@/api/stores'
import { AnimatePopover, Button, Content, Icon, IconWithPopover, Image, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import { AttachmentWrapper, GlobalGraphInstance, useRenderObject } from '@/core'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'
import { RelatedPanel } from '@/core/object/details/Related'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import Tag from '@/core/object/ObjectTag'
import LabelDetailsRenderer from '@/core/object/renderer/LabelDetailsRenderer'
import MetaPropDisplayer from '@/core/object/renderer/properties/MetaPropDisplayer'
import ParentItems from '@/core/object/details/ParentItems'
import Backlinks from '@/core/object/details/Backlinks'

const flatButton = css([
  ClassName.flatButton(4, '3px 10px'),
  {
    // backgroundColor: Colors.Background.ButtonHover,
    // fontWeight: 600,
    borderRadius: '4px !important',
    fontSize: 13,
    gap: 4,
    alignItems: 'center',
    ':hover': {
      backgroundColor: `${Colors.Background.ButtonActive} !important`
    }
  }
])

const MetaMainDetails = ({ metaId, visible }: { metaId: number; visible?: boolean }) => {
  const object = MetaStore.useValue(metaId)
  const { renderWhole, metaObject } = useRenderObject({ metaObjectId: metaId })
  const { t } = useTranslation()
  if (!object) return null

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
          {metaObject?.type?.includes('Label') ? (
            <LabelDetailsRenderer
              showImage={false}
              showVideo={false}
              showAudio={false}
              metaId={metaId}
              style={{
                border: '1px solid var(--border-background)',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          ) : (
            renderWhole({
              columnGap: 3,
              titleOptions: {
                style: {
                  maxWidth: 'calc(100% - 16px)',
                  zIndex: 30
                }
              },
              renderOptions: {
                renderTags: false,
                renderImage: false
              }
            })
          )}
        </Content>
      </Content>
      <Content className={'border-box-shadow'} style={{ marginTop: 12, flexWrap: 'wrap', padding: 6, borderRadius: 8 }} flex gap={4}>
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
            Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaId)
          }}
          text={t('general.edit')}
          icon={'park-edit'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            MetaStore.updateMetaObject({ id: metaId, pinned: !object.pinned })
          }}
          theme={object.pinned ? 'filled' : undefined}
          iconColor={object.pinned ? Colors.Common.Pink : undefined}
          text={object.pinned ? t('general.unpin') : t('general.pin')}
          icon={'park-like'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          onClick={() => {
            GlobalInstance.metaOps?.openGraph(metaId)
          }}
          text={t('general.graph')}
          icon={'park-share-one'}
          className={flatButton}
        ></Button.IconButton>
        <Button.IconButton
          text={t('general.Copy link')}
          onClick={() => {
            GlobalInstance.metaOps?.copyLink(metaId)
          }}
          icon={'park-link'}
          className={flatButton}
        />
        <Button.IconButton
          text={t('general.delete')}
          icon={'park-delete'}
          dangerous={true}
          style={{ borderRadius: 999, padding: '3px 10px', fontSize: 13 }}
          onClick={() => {
            GlobalInstance.metaOps?.closeDetails()
            MetaStore.deleteMetaObject(metaId)
          }}
        ></Button.IconButton>
      </Content>
      <Backlinks metaId={metaId} visible={visible} />
      <Content
        flex
        alignItems={'center'}
        gap={12}
        style={{
          fontWeight: 500,
          fontSize: 14,
          margin: '16px 0 12px'
        }}
      >
        <Icon
          name={'park-tag-one'}
          size={16}
          containerStyle={{
            background: 'linear-gradient(rgb(255 133 109) 0%, rgb(221 50 126) 140%)',
            color: 'white',
            borderRadius: 6,
            padding: 4
          }}
        />
        {t('general.Tags')}
      </Content>
      <AnimatePopover
        positions={['bottom', 'top']}
        reposition
        align={'start'}
        withClickCover
        content={
          <WithBorder width={360}>
            <MetaTagPicker
              style={{
                flexShrink: 0,
                borderRadius: 8
              }}
              alreadyTags={object?.tags || []}
              onChange={tags => {
                MetaStore.updateMetaObject({ id: metaId, tags })
              }}
            />
          </WithBorder>
        }
      >
        <Content
          flex
          gap={6}
          style={{
            flexWrap: 'wrap',
            cursor: 'pointer',
            border: '1px solid var(--border-background)',
            borderRadius: 8,
            padding: '8px',
            width: '100%'
          }}
        >
          {object.tags?.length ? (
            object.tags?.map(i => <Tag square hideDelete hideSize tag={i} key={i} />)
          ) : (
            <div
              style={{
                fontSize: 12,
                padding: 6,
                color: Colors.Font.SuperTransparent
              }}
            >
              {t('general.Add tags')}...
            </div>
          )}
        </Content>
      </AnimatePopover>
      <Content
        flex
        alignItems={'center'}
        gap={12}
        style={{
          fontWeight: 500,
          fontSize: 14,
          margin: '16px 0 12px'
        }}
      >
        <Icon
          name={'custom-property'}
          size={16}
          containerStyle={{
            background: 'linear-gradient(rgb(213 112 171) 0%, rgb(227 42 124) 140%)',
            color: 'white',
            borderRadius: 6,
            padding: 4
          }}
        />
        {t('general.Properties')}
      </Content>
      <Content
        style={{
          padding: 8,
          width: '100%',
          borderRadius: 8,
          border: Colors.Consts.Border
        }}
      >
        <MetaPropDisplayer metaId={metaId} showAddPropPlaceholder={true} />
      </Content>
      <Content
        flex
        alignItems={'center'}
        gap={12}
        style={{
          fontWeight: 500,
          fontSize: 14,
          margin: '12px 0'
        }}
      >
        <Icon
          name={'park-share-one'}
          size={16}
          containerStyle={{
            background: 'linear-gradient(rgb(117 166 219) 0%, rgb(122 0 255) 140%)',
            color: 'white',
            borderRadius: 6,
            padding: 4
          }}
        />
        {t('general.Linked objects')}
      </Content>
      <RelatedPanel
        style={{
          minHeight: 140,
          borderRadius: 8,
          maxHeight: 400,
          overflowY: 'auto',
          padding: '6px',
          border: '1px solid var(--border-background)'
        }}
        metaId={metaId}
      />
      <ParentItems metaId={metaId} />
      <Content
        flex
        alignItems={'center'}
        gap={12}
        style={{
          fontWeight: 500,
          fontSize: 14,
          margin: '12px 0 16px'
        }}
      >
        <Icon
          name={'park-link-three'}
          size={16}
          containerStyle={{
            background: 'linear-gradient(rgb(84 193 170) 0%, rgb(28 150 153) 140%)',
            color: 'white',
            borderRadius: 6,
            padding: 4
          }}
        />
        {t('general.Attachments')}
      </Content>
      <AttachmentWrapper
        innerContainerStyle={{
          justifyContent: 'space-between',
          height: '100%',
          overflowY: 'auto'
        }}
        visible={true}
        maxVisibleAttachments={10}
        metaId={metaId}
      />
    </Content>
  )
}

export default MetaMainDetails
