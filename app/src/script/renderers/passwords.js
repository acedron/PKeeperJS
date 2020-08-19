const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const jsonxml = require('jsontoxml');
const customTitlebar = require('custom-electron-titlebar');

var maindir = ((process.platform === 'win32') ? `${process.env.APPDATA}/pkeeperjs` : `${process.env.HOME}/.pkeeperjs`);
fs.mkdirSync(maindir, { recursive: true });

var cate = '';
var uname = '';

document.addEventListener('DOMContentLoaded', event => {
  ipcRenderer.send('getVars', 'currentUser', 'currentCategory');
  ipcRenderer.on('var-reply', (e, getvarval) => {
    uname = getvarval[0];
    cate = getvarval[1];
    window.document.title = `PKeeperJS - ${uname}/${cate}`;
    new customTitlebar.Titlebar({
      backgroundColor: customTitlebar.Color.fromHex('#28353b'),
      icon: `${__dirname}/../../assets/img/icon.png`,
      menu: null,
      maximizable: false
    });
    fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
      var jsonout = parser.xml2json(data);
      var categories = jsonout['xml']['category'];
      var passwords = [];
      if (categories.length == undefined) {
        try {
          var p = categories['password'];
          if (p.length == undefined) passwords.push(p.name);
          else {
            for (var i = 0; i < p.length; i++) passwords.push(p[i].name);
          }
        } catch (err) {}
      } else {
        for (var i = 0; i < categories.length; i++) {
          if (categories[i].name == cate) {
            try {
              var p = categories[i]['password'];
              if (p.length == undefined) passwords.push(p.name);
              else {
                for (var j = 0; j < p.length; j++) passwords.push(p[j].name);
              }
            } catch (err) {}
          }
        }
      }
      var t = '';
      if (passwords.length <= 0) t += '<p style="color: #f3f3f3;"> No password found!</p>';
      else {
        for (var i = 0; i < passwords.length; i++) t += `<input type="button" value="${passwords[i]}" class="categorybutton" id="${passwords[i]}" onclick="password(this.id)">`;
      }
      document.getElementById('passwords').innerHTML = t;
    });
  });
});

const password = id => {
  ipcRenderer.send('setVar', 'currentPassword', id);
  ipcRenderer.send('resizeWindow', 400, 175);
  ipcRenderer.send('changeHtml', `${__dirname}/password.html`);
};

const createPassword = () => {
  ipcRenderer.send('resizeWindow', 400, 175);
  ipcRenderer.send('changeHtml', `${__dirname}/createpassword.html`);
};

const deleteCategory = () => {
  ipcRenderer.send('info', `Deleting category "${cate}"`, Error().stack);
  fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
    var jsonout = parser.xml2json(data);
    var categories = jsonout['xml']['category'];
    if (categories.length == undefined) fs.writeFile(`${maindir}/passwords/${uname}.xml`, jsonxml({
      xml: []
    }), err => {
      ipcRenderer.send('setVar', 'currentCategory', '');
      ipcRenderer.send('resizeWindow', 400, 500);
      ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
    });
    else {
      var ncate = [];
      for (var i = 0; i < categories.length; i++) {
        if (categories[i].name != cate) {
          try {
            var passes = categories[i]["password"];
            var passarr = [];
            if (passes.length == undefined) passarr.push({
              name: "password", attrs: { name: passes.name, pass: passes.pass }
            });
            else {
              for (var j = 0; j < passes.length; j++) passarr.push({
                name: "password", attrs: { name: passes[j].name, pass: passes[j].pass }
              });
            }
            ncate.push({
              name: "category", attrs: { name: categories[i].name }, children: passarr
            });
          } catch (err) {
            ncate.push({
              name: "category", attrs: categories[i]
            });
          }
        }
      }
      var towrite = ncate;
      if (ncate.length == undefined) towrite = [ncate];
      fs.writeFile(`${maindir}/passwords/${uname}.xml`, jsonxml({
        xml: towrite
      }), err => {
        ipcRenderer.send('setVar', 'currentCategory', '');
        ipcRenderer.send('resizeWindow', 400, 500);
        ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
      });
    }
  });
};

const back = () => {
  ipcRenderer.send('setVar', 'currentCategory', '');
  ipcRenderer.send('resizeWindow', 400, 500);
  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
};
