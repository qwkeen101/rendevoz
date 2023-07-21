import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IPdfDocument } from "~/typings/data";
import { IForm } from "./types";
import useFlipForm from "./useFlipForm";

const DocumentForm = ({
  onBack,
  onSubmit,
  initialObject,
}: IForm<IPdfDocument>) => {
  const [document, setDocument] = useState({ ...initialObject });
  const { t } = useTranslation();
  const { renderForm } = useFlipForm({
    layout: [
      {
        type: "nameInput",
        value: document.name,
        onChange: (v) => setDocument({ ...document, name: v }),
      },
      {
        type: "group",
        children: [
          {
            type: "colorPicker",
            color: document.color,
            onChange: (c) => setDocument({ ...document, color: c }),
          },
          {
            type: "iconPicker",
            icon: document.icon,
            onChange: (i) => setDocument({ ...document, icon: i }),
          },
        ],
      },
    ],
    onBack,
    onSubmit: () => onSubmit?.(document),
    formTitle: t("form.update item details", { item: t("general.document") }),
    submitText: "update",
  });

  return renderForm();
};

export default DocumentForm;
