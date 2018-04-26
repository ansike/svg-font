#!/usr/bin/env node

const fontCarrier = require('font-carrier')
const path = require('path')
const fs = require('fs')
const TemplateEngine = require('./TemplateEngine.js')

const schooinBmpHead = 0xEE00 // U+EOOO ... U+F8FF, BMP, Private Use Area
const scriptsDir = __dirname
const projectDir = path.resolve(scriptsDir, '../')
const target = process.argv[2] ? process.argv[2] : 'target'


const fromDir = function(startPath, filter, callback) {

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var hit = 0;
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {

        var filePath = path.join(startPath,files[i]);
        var stat = fs.lstatSync(filePath);
        if (stat.isDirectory()){
            fromDir(filePath, filter, callback); //recurse
        }
        else if (filter.test(filePath)) {
            callback(filePath, hit);
            hit++;
        }
    };

    return hit;
};

const mkdirpSync = function (dirPath) {

      const parts = dirPath.split(path.sep)

      // For every part of our path, call our wrapped mkdirSync()
      // on the full path until and including that part
      for (var i = 1; i <= parts.length; i++) {

          var d = path.join.apply(null, parts.slice(0, i)) 
          if (!fs.existsSync(d)) {

              fs.mkdirSync(d)
          }
      }
}


// create an empty font
var font = fontCarrier.create()
font.setFontface({
    fontFamilly: 'font'
})

// loop through svgs directory and add svg file to the font
console.log('adding svgs...')
var svgs = []
var count = fromDir(path.resolve(projectDir, './svgs'),
    /\.svg$/,
    (filePath, index) => {
        svgs.push(path.basename(filePath, '.svg'))
        var key = String.fromCodePoint(schooinBmpHead + index)
        var value = fs.readFileSync(filePath).toString()
        font.setSvg(key, value)
    });

// output font to a file
console.log('outputting font...')
mkdirpSync(target);
font.output({
    path: path.resolve(target, 'font')
})

// generate demo html
console.log('outputting demo...')
var template = fs.readFileSync(path.resolve(scriptsDir, './demo_unicode.html.template')).toString()
var content = TemplateEngine(template, {
    count: count,
    svgs: svgs
})
fs.writeFile(path.resolve(target, 'demo_unicode.html'), content, function(err) {
    if(err) {
        return console.log(err);
    }
})
// css file
fs.createReadStream(path.resolve(scriptsDir, './font.css'))
    .pipe(fs.createWriteStream(path.resolve(target, 'font.css')));
// img file
fs.createReadStream(path.resolve(scriptsDir, './icon-01.png'))
    .pipe(fs.createWriteStream(path.resolve(target, 'icon-01.png')));
    
console.log('done')
