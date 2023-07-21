import { Content } from "@/components";
import { Database } from "@/core";
import TabTitle from "@/components/layout/TabTitle";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const DatabasePage = () => {
  const { t } = useTranslation();
  return (
    <Content fullHeight fullWidth role="data-container">
      <TabTitle title={t("general.database")} icon="park-data" />
      <Database />
    </Content>
  );
};

export default memo(DatabasePage);
