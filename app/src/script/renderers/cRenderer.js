const customTitlebar = require('custom-electron-titlebar');

document.addEventListener('DOMContentLoaded', event => {
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#28353b'),
    icon: `${__dirname}/../../assets/img/icon.png`,
    menu: null,
    maximizable: false
  });
});
