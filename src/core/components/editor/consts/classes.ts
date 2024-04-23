import { css } from '@emotion/css'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'

const EditorWrapper = css({
  maxWidth: '100%',
  minWidth: 0,
  width: 'var(--editor-max-width)',
  outline: 'none',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  height: 0,
  flex: 1
})

const Editor = css({
  position: 'relative',
  width: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
})

const DefaultContentClass = css({
  'h1,h2,h3,h4,h5,h6': {
    marginTop: 0,
    marginBottom: 0
  },
  p: {
    margin: 0
  },
  h1: {
    fontSize: '1.875em'
  },
  h2: {
    fontSize: '1.5em'
  },
  h3: {
    fontSize: '1.25em'
  },
  h4: {
    fontSize: '1.15em'
  },
  'h5,h6': {
    fontSize: '1.1em'
  },
  img: {
    borderRadius: 6,
    maxWidth: '100%'
  },
  figcaption: {
    color: Colors.Font.Transparent,
    fontSize: '0.85em',
    padding: 0,
    textAlign: 'center'
  }
})

const TextBoxClass = css({
  maxWidth: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
})

const ScrollWrapperClass = css({
  height: '100%',
  width: '100%',
  minHeight: 'inherit',
  overflowX: 'hidden',
  overflowY: 'auto',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.27s ease',
  overflowAnchor: 'none',
  alignItems: 'center',
  '::highlight(secondary-highlight)': {
    backgroundColor: 'rgba(209, 146, 56, 0.7)'
  },
  '::highlight(primary-highlight)': {
    backgroundColor: 'rgba(255, 230, 148, 0.7)'
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
  EditorWrapper,
  DefaultContentClass,
  TextBoxClass,
  ScrollWrapperClass,
  DividerClass,
  DividerWrapperClass
}

export default EditorClasses
