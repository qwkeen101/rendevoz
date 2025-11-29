import { css } from '@emotion/css'
import { Colors } from '@/consts'

const Editor = css({
  position: 'relative',
  width: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
})

const ScrollWrapperClass = css({
  flex: 1,
  width: '100%',
  minHeight: 'inherit',
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  overflowAnchor: 'none',
  alignItems: 'center',
  '::highlight(secondary-highlight)': {
    backgroundColor: 'rgba(209, 146, 56, 0.3)'
  },
  '::highlight(primary-highlight)': {
    backgroundColor: 'var(--emphasis)'
  },
  '::highlight(selection-highlight)': {
    backgroundColor: Colors.Common.SelectColorTransparent
  }
})

const DividerClass = css({
  position: 'absolute',
  top: 0,
  left: 13,
  width: 4,
  height: '100%',
  background: Colors.Background.ButtonHover,
  borderRadius: 48
})

const DividerWrapperClass = css({
  userSelect: 'none',
  position: 'relative',
  width: 30,
  flexGrow: 0,
  flexShrink: 0,
  opacity: 0,
  transition: 'opacity 0.2s ease',
  ':first-child': {
    display: 'none'
  }
})
const EditorClasses = {
  Editor,
  ScrollWrapperClass,
  DividerClass,
  DividerWrapperClass
}

export default EditorClasses
