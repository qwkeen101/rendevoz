import { Button, WithBorder } from "@/components";
import { MetaStore, ObjectStore } from "@/stores";
import { useTranslation } from "react-i18next";
import { MetaObject } from "~/typings";
import { transformTextContentToNameAndDescription } from "../global/globalDragOverlay/utils";

export type LabelActionEvent =
  | {
      type: "addDescription";
    }
  | {
      type: "addAttachment";
    }
  | {
      type: "delete";
    }
  | {
      type: "changeName";
    };
type Props = {
  on: (action: LabelActionEvent) => void;
  objectId: number;
  type: MetaObject["type"];
};

const LabelActionMenu = ({ on, objectId, type }: Props) => {
  const { t } = useTranslation();
  const checkObjectIsMeta = async () => {
    const meta = MetaStore.getMetaObjectByObjectId(objectId);
    if (!meta) {
      const object = await ObjectStore(type).getOneById(objectId);
      if (object) {
        if ("selectedText" in object) {
          const { name, description } =
            transformTextContentToNameAndDescription(object.selectedText);
          MetaStore.addMetaObject({
            type,
            objectId,
            name: name,
            description: description,
          });
        } else {
          MetaStore.addMetaObject({
            type,
            objectId,
            name: object.name,
            description: object.description,
          });
        }
      }
    }
  };
  return (
    <WithBorder padding={6}>
      <Button.IconButton
        icon="park-edit"
        text={t("general.edit name")}
        onClick={() => on({ type: "changeName" })}
      ></Button.IconButton>
      <Button.IconButton
        icon="park-link"
        text={t("general.add attachment")}
        onClick={() => {
          on({ type: "addAttachment" });
          checkObjectIsMeta();
        }}
      ></Button.IconButton>
      <Button.IconButton
        icon="park-edit-one"
        text={t("general.edit description")}
        onClick={() => on({ type: "addDescription" })}
      ></Button.IconButton>
      <Button.IconButton
        dangerous
        icon="park-delete"
        text={t("general.delete")}
        onClick={() => on({ type: "delete" })}
      ></Button.IconButton>
    </WithBorder>
  );
};

export default LabelActionMenu;
