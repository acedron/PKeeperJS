const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');

var maindir;

if (process.platform === 'win32') {
  maindir = `${process.env.APPDATA}/pkeeperjs`;
} else {
  maindir = `${process.env.HOME}/.pkeeperjs`;
}
fs.mkdirSync(maindir, { recursive: true });

var uname = '';

document.addEventListener('DOMContentLoaded', event => {
  ipcRenderer.send('getVar', 'currentUser');
  ipcRenderer.on('var-reply', (e, value) => {
    document.getElementById('logg').innerHTML = `Logged in as ${value}. <button onclick="logout()" id="logoutbutton">Logout</button>`;
    uname = value;
    fs.readFile(`${maindir}/passwords/${uname}.xml`, 'utf8', (err, data) => {
      try {
        var jsonout = parser.xml2json(data);
        var categories = jsonout["xml"]["category"];
        if (categories.length == undefined) {
          document.getElementById('categories').innerHTML = `<input type="button" value="${categories.name}" class="categorybutton" id="${categories.name}" onclick="category(this.id)">`;
        } else {
          document.getElementById('categories').innerHTML = '';
          var categorytag = '';
          for (var i = 0; i < categories.length; i++) categorytag += `<input type="button" value="${categories[i].name}" class="categorybutton" id="${categories[i].name}" onclick="category(this.id)">`;
          document.getElementById('categories').innerHTML = categorytag;
        }
      } catch(err) {
        document.getElementById('categories').innerHTML = '<p style="color: #f3f3f3;"> No category found!</p>';
      }
    });
  });
});

const createCategory = () => {
  ipcRenderer.send('resizeWindow', 400, 145);
  ipcRenderer.send('changeHtml', `${__dirname}/createcategory.html`);
};

const category = categoryn => {
  ipcRenderer.send('setVar', 'currentCategory', categoryn);
  ipcRenderer.send('resizeWindow', 400, 500);
  ipcRenderer.send('changeHtml', `${__dirname}/passwords.html`);
};

const logout = () => {
  ipcRenderer.send('setVar', 'currentUser', '');
  ipcRenderer.send('resizeWindow', 435, 90);
  ipcRenderer.send('changeHtml', `${__dirname}/splash.html`);
};
