import Id from "@/utils/id";
import { ReactNode, useMemo, useRef, useState } from "react";
import { Editor } from "../../Editor";
import { motion } from "framer-motion";
import { css } from "@emotion/css";
import { useSlate } from "../../slate-react";
import ClassName from "@/styles/classNames";
import { CustomElement } from "../../../../../typings/editor/types";
import { metaObjectsAtom } from "@/api/stores/meta/meta.store";
import { globalStore } from "@/api/stores";
import { atom } from "jotai/vanilla";
import { useAtomValue } from "jotai/react";

const EmbeddedCard = ({
  element,
  type,
  slateChildren,
}: {
  element: CustomElement;
  slateChildren?: ReactNode;
  type: "pdf" | "note";
}) => {
  const [editorId] = useState(Id.getStrId());
  const editor = useSlate();
  const [size, setSize] = useState<{
    width?: string | number;
    height?: number;
  }>({
    width: "100%",
    height: 600,
  });
  const { originId } = element;
  const metaAtom = useMemo(
    () =>
      originId ? atom((get) => get(metaObjectsAtom).get(originId)) : atom(null),
    [originId]
  );
  const metaObject = useAtomValue(metaAtom, { store: globalStore });
  const realNoteId = metaObject?.objectId || element.noteId;
  const ref = useRef<HTMLDivElement>(null);
  if (!element) return null;
  if (editor.readonly) {
    const Line = (
      <motion.div
        style={{
          borderRadius: 5,
          background: "rgba(225,225,225,0.7)",
          height: 30,
          width: "100%",
        }}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0.7 }}
        transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
      ></motion.div>
    );
    const Rect = (
      <motion.div
        style={{
          borderRadius: 5,
          background: "rgba(225,225,225,0.7)",
          height: 50,
          width: 100,
        }}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: 0.7 }}
        transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
      ></motion.div>
    );
    return (
      <div
        style={{
          width: "100%",
          height: 200,
          overflow: "hidden",
          borderRadius: 8,
          boxShadow:
            "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          // alignItems: 'center',
          justifyContent: "center",
          gap: 8,
          padding: 16,
        }}
      >
        {Rect}
        {Line}
        {Line}
        {Line}
        <div style={{ lineHeight: 1 }} className={ClassName.description()}>
          Tip: To prevent infinite loop,embedded cards will not show in readonly
          mode.
        </div>
      </div>
    );
  }
  const renderEditor = () => {
    return (
      <div
        contentEditable={false}
        ref={ref}
        style={{
          width: "100%",
          height: size.height,
          overflow: "hidden",
          borderRadius: 8,
          boxShadow:
            "rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
          position: "relative",
        }}
        className={css({
          '[role="inner-editor"]': {
            padding: "12px !important",
          },
        })}
      >
        <div
          style={{
            position: "absolute",
            userSelect: "none",
            bottom: 5,
            width: "100%",
            height: 5,
            zIndex: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <motion.div
            drag="y"
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDrag={(e, info) => {
              e.preventDefault();
              const height = ref.current?.clientHeight;
              ref.current &&
                (ref.current.style.height = `${height + info.delta.y}px`);
            }}
            onDragEnd={() => {
              const height = ref.current?.clientHeight;
              setSize({
                ...size,
                height,
              });
            }}
            style={{
              width: "20%",
              maxWidth: 150,
              height: 5,
              borderRadius: 999,
              cursor: "row-resize",
              background: "rgba(225,225,225,0.8)",
            }}
          ></motion.div>
        </div>
        {realNoteId && <Editor id={editorId} readonly noteId={realNoteId} />}
        {slateChildren}
      </div>
    );
  };

  return renderEditor();
};

export default EmbeddedCard;
