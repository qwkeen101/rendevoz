import { MetaStore } from "@/stores";
import { Position } from "@/types";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MetaLink, MetaObject } from "~/typings/data";
import ObjectForm from "@/components/form/ObjectForm";
import { useEventHandler } from "@/events";
import { useShortcut, useToggle } from "@/hooks";
import { Modal } from "@/components";
import { useCreateObject } from "../object";
import Id from "@/utils/id";
import { Rendevoz } from "../rendevoz";

const GlobalCreateObjectInstance: Partial<{
  create: (preObject?: Partial<MetaObject>) => Promise<MetaObject>;
}> = {};
const GlobalCreateObject = () => {
  const [innerMeta, setInnerMeta] = useState<Partial<MetaObject>>();
  const [pendingLinks, setPendingLinks] = useState<MetaLink[]>();
  const [panelState, setPanelState] = useState<
    Partial<{
      visible: boolean;
      position: Position;
      size: { width: number | string; height: number | string };
    }>
  >({
    visible: false,
    size: {
      width: "auto",
      height: "auto",
    },
    position: {
      left: 300,
      top: 300,
    },
  });
  const [modalVisible, toggleModalVisible] = useToggle(false);
  const globalEventEmitter = Rendevoz.Events.Emit.GlobalEventEmitter;
  const { portal, openAtCenter } = useCreateObject({ positions: ["top"] });
  const handler = useEventHandler("global");
  const currentModeRef = useRef<"add" | "edit">();
  handler.on("globalNeedAddMetaObject", (data, res, rej) => {
    promiseRef.current = {
      res: res || promiseRef.current?.res,
      rej: rej || promiseRef.current?.rej,
    };
    if (data) {
      const { fromMetas, currentObject } = data;
      const shouldAddObject = { id: Id.getId(), ...currentObject };
      MetaStore.addMetaObject(shouldAddObject, true);
      setInnerMeta(shouldAddObject);
      if (fromMetas) {
        const links = fromMetas.map(
          (i) =>
            ({
              id: Id.getId(),
              sourceId: i.id,
              targetId: shouldAddObject.id,
            } as MetaLink)
        );
        console.log(links);
        links.forEach((i) => MetaStore.addMetaLink(i, true));
        setPendingLinks(links);
      }
    }

    toggleModalVisible(true);
    currentModeRef.current = "add";
  });
  handler.on("globalNeedEditMetaObject", async ({ metaObjectId }, res, rej) => {
    promiseRef.current = {
      res: res || promiseRef.current?.res,
      rej: rej || promiseRef.current?.rej,
    };
    const metaObject = await MetaStore.getMetaObjectById(metaObjectId);
    if (metaObject) {
      setInnerMeta({ ...metaObject });
      toggleModalVisible(true);
      currentModeRef.current = "edit";
    }
  });
  const promiseRef = useRef<{
    res?: (v: any) => void;
    rej?: (v: any) => void;
  }>();

  Object.assign(GlobalCreateObjectInstance, {
    create: (obj) => {
      return new Promise((res, rej) => {
        setInnerMeta(obj);
        promiseRef.current = {
          res,
          rej,
        };
        setPanelState((s) => ({ ...s, visible: true }));
      });
    },
  } as typeof GlobalCreateObjectInstance);

  useEffect(() => {
    globalEventEmitter.addListener("global", handler);
    return () => {
      globalEventEmitter.removeListener("global", handler);
    };
  }, []);
  useShortcut("quickCreateObject", () => {
    openAtCenter();
  });
  useEffect(() => {
    if (modalVisible === false) {
      setInnerMeta(undefined);
    }
  }, [modalVisible]);

  const handleCancelCreate = () => {
    toggleModalVisible(false);
    promiseRef.current?.rej?.(null);
    promiseRef.current = undefined;
    if (currentModeRef.current === "add") {
      innerMeta?.id && MetaStore.deleteMetaObject(innerMeta?.id, true, true);
      pendingLinks?.forEach((i) => {
        if (i.id) {
          MetaStore.deleteMetaLink(i.id, true, true);
        }
      });
    }
    setPendingLinks(undefined);
  };
  return createPortal(
    <>
      <Modal
        noStyle
        visible={modalVisible}
        onClose={() => {
          toggleModalVisible(false);
          handleCancelCreate();
        }}
      >
        <ObjectForm
          shouldPreviewGraph={!!pendingLinks?.length}
          initialObject={innerMeta}
          onBack={handleCancelCreate}
          onSubmit={(obj) => {
            setPendingLinks(undefined);
            if (currentModeRef.current === "add") {
              if (innerMeta?.id) {
                MetaStore.updateMetaObject(obj).then((obj) => {
                  console.log("res1");
                  promiseRef.current?.res?.(obj);
                  promiseRef.current = undefined;
                });
              } else {
                MetaStore.addMetaObject(obj).then((obj) => {
                  console.log("res2");
                  promiseRef.current?.res?.(obj);
                  promiseRef.current = undefined;
                });
              }
            }
            if (currentModeRef.current === "edit") {
              MetaStore.updateMetaObject({ ...obj }).then((obj) => {
                promiseRef.current?.res?.(obj);
                promiseRef.current = undefined;
              });
            }
            setPendingLinks(undefined);
            toggleModalVisible(false);
          }}
        />
      </Modal>
      {portal}
    </>,
    document.body,
    "global-create-object-form"
  );
};

export default GlobalCreateObject;
