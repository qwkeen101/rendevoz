import { request } from "@/utils/request";

const localTranslateInterface = "http://localhost:9000/pay";
const remoteTranslateInterface = "https://api.rendevoz.com/pay";
const UpgradeService = {
  upgradeSub: async (method: "monthly" | "yearly", duration: number) => {
    const result = await request<string>(remoteTranslateInterface, {
      params: {
        payType: "subscription",
        duration,
      },
    });
    return result.data;
  },
};

export default UpgradeService;
