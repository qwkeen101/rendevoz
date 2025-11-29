import classnames from 'classnames'

export default ({ className, size, onClick }: { className?: string; size?: number; onClick?: VoidFunction }) => (
  <svg
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg"
    width={size ?? '1em'}
    height={size ?? '1em'}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      appRegion: 'no-drag'
    }}
    className={className}
  >
    <path d="M4 11a9 9 0 0 1 9 9"></path>
    <path d="M4 4a16 16 0 0 1 16 16"></path>
    <circle cx="5" cy="19" r="1"></circle>
  </svg>
)
