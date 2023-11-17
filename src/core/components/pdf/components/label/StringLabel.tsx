import { useToggle } from "@/hooks";
import ClassName from "@/styles/classNames";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";

const StringLabel = ({ content }: { content?: string }) => {
  const [isOpen, toggleOpen] = useToggle(false);
  const longContentRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(0);
  return (
    <motion.div
      onClick={() => {
        if (window.getSelection()?.isCollapsed) {
          toggleOpen();
        }
      }}
      style={{ height: "100%" }}
      className={ClassName.ellipsisFont(4)}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="long"
            ref={longContentRef}
            style={{ minHeight: 50 }}
            animate={{ opacity: 1, height: "100%" }}
            exit={{ opacity: 0, position: "absolute" }}
            initial={{ opacity: 0, height: 50 }}
            onAnimationComplete={() => {
              heightRef.current =
                longContentRef.current!.getBoundingClientRect().height;
            }}
          >
            {content}
          </motion.div>
        ) : (
          <motion.div
            key="short"
            initial={{ opacity: 0, height: heightRef.current }}
            animate={{ opacity: 1, height: 50 }}
            exit={{ opacity: 0, position: "absolute" }}
            className={ClassName.ellipsisFont(2)}
          >
            {content?.slice(0, 100)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StringLabel;
