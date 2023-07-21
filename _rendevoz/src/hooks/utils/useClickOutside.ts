import { MutableRefObject, useEffect } from "react";

const useClickOutside = (
  callback: (e: MouseEvent) => void,
  ref: MutableRefObject<unknown> | MutableRefObject<unknown>[],
  shouldHandle = true
) => {
  const targets = Array.isArray(ref) ? ref : [ref];
  const handleClick = (e) => {
    if (shouldHandle) {
      if (targets.some((i) => i.current && !i.current.contains(e.target))) {
        callback(e);
      }
    }
  };
  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  });
};
export default useClickOutside
