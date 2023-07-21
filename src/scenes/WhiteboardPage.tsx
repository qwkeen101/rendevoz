import TabTitle from "@/components/layout/TabTitle";
import { Whiteboard } from "@/core";
import { Rendevoz } from "@/core/rendevoz";
import { memo, useState } from "react";

const WhiteboardPage = ({ whiteboardId }: { whiteboardId: number }) => {
  const [title, setTitle] = useState("Unnamed Whiteboard");
  return (
    <>
      <TabTitle
        title={title}
        icon={Rendevoz.Utils.Object.getMetaObjectIcon("whiteboard")}
      />
      <Whiteboard
        whiteboardId={whiteboardId}
        onTabTitleChange={(s) => s && setTitle(s)}
      />
    </>
  );
};

export default memo(WhiteboardPage);
