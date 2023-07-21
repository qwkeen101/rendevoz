export default (api) => {
  api.describe({
    name: "12321312321321",
  });
  setTimeout(() => console.log(api.api.getAllTabs()), 1000);
};
