import { MarkerColor } from "@/consts";

function getMarkerId(direction: "end" | "start", color: string) {
  return `${direction}-arrow-${color}`;
}

const SvgMarker = () => {
  return (
    <defs>
      {(Object.values(MarkerColor) as string[]).map((color) => (
        <marker
          refX={0}
          refY={0}
          markerUnits="strokeWidth"
          viewBox="-10,-10,20,20"
          orient="auto"
          key={color}
          id={getMarkerId("end", color)}
          markerWidth={12.5}
          markerHeight={12.5}
        >
          <polyline
            stroke={color}
            fill={color}
            strokeWidth={1}
            points="-5,-4 0,0 -5,4 -5,-4"
            strokeLinejoin="round"
            strokeLinecap="round"
          ></polyline>
        </marker>
      ))}
    </defs>
  );
};

export default SvgMarker;
