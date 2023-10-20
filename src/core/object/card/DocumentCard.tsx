import { FC } from "react";
import { MetaDatabaseCardProps } from "./types";
import { Rendevoz } from "@/core/rendevoz";

const MetaDocumentCard: FC<MetaDatabaseCardProps> = ({
  metaObject,
  renderTitleAndDescription,
}) => {
  return renderTitleAndDescription({
    title: metaObject.name,
    description: metaObject.description,
    onTitleClick: () =>
      metaObject.objectId &&
      Rendevoz.Actions.Open.Pdf.openPdf(metaObject.objectId),
  });
};

export default MetaDocumentCard;
