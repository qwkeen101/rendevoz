import { Children, ReactNode } from "react";
import { useMeasure } from "react-use";

const Masonry = ({
  breakPoints,
  gap,
  children,
}: {
  breakPoints: Record<number, number>;
  gap: number;
  children: ReactNode;
}) => {
  const [ref, { width }] = useMeasure();
  const columns =
    Object.entries(breakPoints).find((i) => Number(i[0]) > width)?.[1] || 1;
  const arrChildren = Children.toArray(children);
  const chunks = createChunks(arrChildren, columns);
  const dataColumns = createDataColumns(chunks, columns);
  return (
    <div
      ref={ref}
      style={{
        display: "grid",
        alignItems: "start",
        columnGap: gap,
        gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
      }}
    >
      {dataColumns.map((column, idx) => (
        <MasonryRow gap={gap} key={idx}>
          {column.map((item) => item)}
        </MasonryRow>
      ))}
    </div>
  );
};
export function MasonryRow({
  children,
  gap,
}: {
  children: React.ReactNode;
  gap: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        rowGap: gap,
        gridTemplateColumns: "minmax(0, 1fr)",
      }}
    >
      {children}
    </div>
  );
}
export function createChunks<T>(data: T[] = [], columns = 3) {
  const result = [];

  for (let idx = 0; idx < data.length; idx += columns) {
    const slice = data.slice(idx, idx + columns);
    result.push(slice);
  }

  return result;
}

export function createDataColumns<T>(data: T[][] = [], columns = 3) {
  const result = Array.from<T[], T[]>({ length: columns }, () => []);

  for (let idx = 0; idx < columns; idx++) {
    for (let jdx = 0; jdx < data.length; jdx += 1) {
      if (data[jdx][idx]) {
        result[idx].push(data[jdx][idx]);
      }
    }
  }

  return result;
}
export default Masonry;
