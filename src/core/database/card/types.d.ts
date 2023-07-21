import { ReactElement } from "react";
import { MetaObject } from "~/typings/data";

export interface MetaDatabaseCardProps {
  metaObject: MetaObject;
  renderTitleAndDescription: ({
    title,
    description,
    onTitleClick,
  }: {
    title?: string;
    description?: string;
    onTitleClick?: VoidFunction;
  }) => ReactElement;
}
