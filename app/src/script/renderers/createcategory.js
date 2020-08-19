const { ipcRenderer } = require('electron');
const fs = require('fs');
const parser = require('xml2json-light');
const jsonxml = require('jsontoxml');

var maindir = ((process.platform === 'win32') ? `${process.env.APPDATA}/pkeeperjs` : `${process.env.HOME}/.pkeeperjs`);
fs.mkdirSync(maindir, { recursive: true });

const errcall = msg => {
  ipcRenderer.send('resizeWindow', 400, 170);
  document.getElementById('createcallback').textContent = msg;
}

const create = () => {
  var name = document.getElementById('categoryname').value;
  ipcRenderer.send('getVar', 'currentUser');
  ipcRenderer.on('var-reply', (e, value) => {
    var user = value;
    if (name.toLowerCase().replace(' ', '') == '') errcall('Missing some inputs!');
    else {
      ipcRenderer.send('info', `Creating category ${name}.`, Error().stack);
      if (fs.existsSync(`${maindir}/passwords/${user}.xml`)) fs.readFile(`${maindir}/passwords/${user}.xml`, 'utf8', (err, data) => {
        var jsonout = parser.xml2json(data);
        try {
          var categories = jsonout["xml"]["category"];
          if (categories.length == undefined) {
            if (categories.name != name) (() => {
              try {
                var passes = categories["password"];
                var passarr = [];
                if (passes.length == undefined) {
                  passarr.push({
                    name: "password", attrs: { name: passes.name, pass: passes.pass }
                  });
                } else {
                  for (var i = 0; i < passes.length; i++) {
                    passarr.push({
                      name: "password", attrs: { name: passes[i].name, pass: passes[i].pass }
                    });
                  }
                }
                var oldcat = {
                  name: "category", attrs: { name: categories.name }, children: passarr
                };
                fs.writeFile(`${maindir}/passwords/${user}.xml`, jsonxml({
                  xml: [
                    oldcat,
                    {name: "category", attrs: { name: name } }
                  ]
                }), err => {
                  if (err) errcall('Couldn\'t create category!');
                  else {
                    ipcRenderer.send('resizeWindow', 400, 500);
                    ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                  }
                });
              } catch (err) {
                fs.writeFile(`${maindir}/passwords/${user}.xml`, jsonxml({
                  xml: [
                    {name: "category", attrs: categories},
                    {name: "category", attrs: { name: name} }
                  ]
                }), err => {
                  if (err) errcall('Couldn\'t create category!');
                  else {
                    ipcRenderer.send('resizeWindow', 400, 500);
                    ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                  }
                });
              }
            })();
            else errcall('Category already exists!');
          } else {
            var valid = true;
            for (var i = 0; i < categories.length; i++) {
              if (categories[i].name == name) {
                valid = false;
                break;
              }
            }
            if (valid == true) {
              var ncate = [];
              for (var i = 0; i < categories.length; i++) (() => {
                try {
                  var passes = categories[i]["password"];
                  var passarr = [];
                  if (passes.length == undefined)passarr.push({
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
              })();
              ncate.push({name: "category", attrs: { name: name } });
              fs.writeFile(`${maindir}/passwords/${user}.xml`, jsonxml({
                xml: ncate
              }), err => {
                if (err) errcall('Couldn\'t create category!');
                else {
                  ipcRenderer.send('resizeWindow', 400, 500);
                  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
                }
              });
            } else errcall('Category already exists!');
          }
        } catch (err) {
          fs.writeFile(`${maindir}/passwords/${user}.xml`, jsonxml({
            xml: [
              {name: "category", attrs: { name: name } }
            ]
          }), err => {
            if (err) errcall('Couldn\'t create category!');
            else {
              ipcRenderer.send('resizeWindow', 400, 500);
              ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
            }
          });
        }
      });
      else errcall('Couldn\'t find user file!');
    }
  });
};

const cancel = () => {
  ipcRenderer.send('resizeWindow', 400, 500);
  ipcRenderer.send('changeHtml', `${__dirname}/categories.html`);
};
