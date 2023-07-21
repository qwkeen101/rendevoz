import { FC, memo } from "react";
import { MetaDatabaseCardProps } from "./types";
import { Rendevoz } from "@/core/rendevoz";

const MetaKnowledgeCard: FC<MetaDatabaseCardProps> = memo(
  ({ metaObject, renderTitleAndDescription }) => {
    return renderTitleAndDescription({
      title: metaObject.name,
      description: metaObject.description,
      onTitleClick: () =>
        Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id),
    });
  }
);

export default MetaKnowledgeCard;
