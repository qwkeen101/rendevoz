import { Canvas } from "@/components";

const ScreenShotCanvas = ({ innerRef, style, erase }) => {
  return (
    <Canvas
      width={window.innerWidth * window.devicePixelRatio}
      height={window.innerHeight * window.devicePixelRatio}
      //   ref={mergedRef}
      erase={erase}
      innerRef={innerRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        pointerEvents: "auto",
        zIndex: 3,
        height: "100%",
        ...style,
      }}
    />
  );
};

export default ScreenShotCanvas;
