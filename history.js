const $ = require('jquery');
const fs = require('fs');
const util = require('util');
const { ipcRenderer,remote } = require('electron');


function getPlaylistName(){
    console.log(getDirectories('./download/'));
    var playlists = getDirectories('./download/');
    playlists.forEach((folderName) => {
    console.log(folderName);
    if(fs.existsSync('./download/'+folderName+'/'+folderName+'.json')){
        console.log('Reading File');

        const readFile = util.promisify(fs.readFile);
        readFile('./download/'+folderName+'/'+folderName+'.json').then((file) => {
            var obj1 = JSON.parse(file);   
            $('#showplaylist').append(`<tr onclick="playSong('${obj1[0].playlist}')"><td>${obj1[0].name}</td></tr>`);
        })

    }else{
        console.log('File Does Not Exists', folderName);
    }
    })
}

$(document).ready( function() {
getPlaylistName();
});

// Get all Directories
  function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
      return fs.statSync(path+'/'+file).isDirectory();
    });
  }

  
  function playSong(playSong){
      var u = `https://www.youtube.com/playlist?list=${playSong}`;
    ipcRenderer.send('playlist', u);
    remote.getCurrentWindow().close();
  }