// for preview mode, like pdf mindmap
export default () => {
  return (
    <div className={'absolute bottom-3 flex items-center gap-3 font-size-12 left-1/2 -translate-x-1/2'}>
      <div className={'bg-popover rounded-full shrink-0'}>
        <Button.IconButton
          text={t(trans.Save)}
          icon={Icons.Save}
          size={14}
          className={'border-round-icon-button'}
          onClick={() => {
            if (value) {
              save(value, 'download', mindmapName)
            }
          }}
        ></Button.IconButton>
      </div>
      <div className={'bg-popover rounded-full shrink-0'}>
        <Button.IconButton
          text={t(trans.Copy)}
          icon={Icons.Copy}
          size={14}
          className={'border-round-icon-button'}
          onClick={() => {
            if (value) {
              save(value, 'copy').then(() => {
                toast.success(t(trans.Copied))
              })
            }
          }}
        ></Button.IconButton>
      </div>
      <div className={'bg-popover rounded-full shrink-0'}>
        <Icon
          size={14}
          onClick={() => {
            refMm.current?.fit()
          }}
          className={'border-round-button icon-16 !p-1.5'}
          name={'park-auto-width'}
        />
      </div>
    </div>
  )
}
