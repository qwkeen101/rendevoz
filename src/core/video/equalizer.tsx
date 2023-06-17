const Equalizer = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{
        background: 'transparent'
      }}
      width="18px"
      height="18px"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <g transform="rotate(180 50 50)">
        <rect x="17.5" y="26.375" width="15" height="40" fill="currentColor">
          <animate
            attributeName="height"
            calcMode="spline"
            values="31.5;47.25;6.3;31.5"
            keyTimes="0;0.33;0.66;1"
            dur="1.5s"
            keySplines="0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1"
            repeatCount="indefinite"
            begin="0s"
          ></animate>
        </rect>
        <rect x="36.5" y="26.375" width="15" height="40" fill="currentColor">
          <animate
            attributeName="height"
            calcMode="spline"
            values="31.5;47.25;6.3;31.5"
            keyTimes="0;0.33;0.66;1"
            dur="1.5s"
            keySplines="0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1"
            repeatCount="indefinite"
            begin="-0.6666666666666666s"
          ></animate>
        </rect>
        <rect x="61.5" y="26.375" width="15" height="40" fill="currentColor">
          <animate
            attributeName="height"
            calcMode="spline"
            values="31.5;47.25;6.3;31.5"
            keyTimes="0;0.33;0.66;1"
            dur="1.5s"
            keySplines="0.5 0 0.5 1;0.5 0 0.5 1;0.5 0 0.5 1"
            repeatCount="indefinite"
            begin="-1.3333333333333333s"
          ></animate>
        </rect>
      </g>
    </svg>
  )
}

export default Equalizer
