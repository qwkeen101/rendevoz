const SvgNodeBackground = () => {
  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <pattern id="node-pattern" x="9.47">
        <circle cx="0.42" cy="0.42" r="0.42" fill="#aaa" />
      </pattern>
    </svg>
  )
}
