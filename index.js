var sanitize = require('sanitize-filename');
const util = require('util');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const $ = require('jquery');
var path = require('path');
var ytdl = require('ytdl-core');
const getYotubePlaylistId = require('get-youtube-playlist-id');
const fs = require('fs');
const ytScraper = require("yt-scraper");
const PlaylistSummary = require('youtube-playlist-summary');
const { sandboxed } = require('process');
const { ipcRenderer } = require('electron');
const config = {
  GOOGLE_API_KEY: 'AIzaSyCG0U6iWqloqJr7hcCurpsuGLIKvKAJKmg', // require
  PLAYLIST_ITEM_KEY: ['title', 'videoId', 'videoUrl'], // option
}
const readFile = util.promisify(fs.readFile);

// Init Variables
const ps = new PlaylistSummary(config)
var playlistCount = 0;
var progress = 0;
var pid;





// Get URL
//url = "https://www.youtube.com/playlist?list=PLZPt05xwUw6VUAEQoARldfMWqJ2g3J6--";
//url = "https://www.youtube.com/playlist?list=PLZPt05xwUw6WQLTouKL0PBSNJBJIBFivC";
function getUrl(){

    var formData = document.getElementById('uurrll').value;
    document.getElementById('err').style.display = "none";
    if(formData.length < 70){
        document.getElementById('err').innerHTML = '<b style="color:red">Invalid URL</b>, URL must be <b>https://www.youtube.com/playlist?list=PLZPt05xwUw6WQLTouKL0PBSNJBJIxxxx</b>'
        document.getElementById('err').style.display = "block";
    }else{
        showProgress('plus', 'Checking URL');
        sanitizeUrl(formData);
    }

}

// Slice ID
function sanitizeUrl(url){

pid = getYotubePlaylistId(url)
if (pid !== false) {
    showProgress('plus', 'Getting Playlist ID');
    checkFolder(pid);
} else {
    showProgress('end', 'Invalid Url');
    console.log('Invalid URL');
}
}

// Check JSON for entry
function checkFolder(folderName){
if (fs.existsSync('./download/'+folderName)) {
    showProgress('plus', 'Folder Exists');
    if(fs.existsSync('./download/'+folderName+'/'+folderName+'.json')){
        showProgress('plus', 'DB File Created');
        checkFiles();
    }else{
        showProgress('plus', 'Getting Playlist');
        getPlaylist();
    }

}else{
    createFolder(folderName);
}


}


// IF not Create folder
function createFolder(dir){
if (!fs.existsSync('./download/'+dir)){
    fs.mkdirSync('./download/'+dir);
    showProgress('plus', 'Folder Created');
    getPlaylist();
}

}


// Populate Json for New playlist
function getPlaylist(){
    if(checkInternet()){
    showProgress('plus', 'Getting Latest Playlist Content');
    ps.getPlaylistItems(pid)
    .then((result) => {
        var playListTitle = result.playlistTitle;
        document.getElementById('playlistName').innerHTML = playListTitle;
        let items = result.items;
        playlistCount = items.length;
        getVideoInfo(items,playListTitle);   
    }).catch((error) => {console.error(error)});
    }else{
        showOffline();        
    }
}


function getVideoInfo(allData,playlistTitle1){
    var jsonDatatoWrite = [];
    var content;
    var processItems = 0;
    playlistCount = allData.length;
    jsonDatatoWrite.push({"playlist" : pid, "name" : playlistTitle1});
    allData.forEach((video) => {
        ytScraper.videoInfo(video.videoId, options = { detailedChannelData: true }).then((dataInfo) => {
            //console.log(dataInfo.title);
            content = `{"vid" : "${dataInfo.id}", "title" : "${sanitize(dataInfo.title)}","time" : "${secondsToTime(dataInfo.length)}","download" : 0}`;
            jsonDatatoWrite.push(JSON.parse(content));
            processItems++;
                if(processItems === allData.length) {
                    console.log('End', processItems);
                    console.log(jsonDatatoWrite);
                    showProgress('plus', 'Online Playlist Data Collected');
                    writeToFile(jsonDatatoWrite);
                }
            // if(!arr[index + 1]) {console.log('End'); console.log(index);  writeToFile(jsonDatatoWrite)}
            });
    })
}



     // Write to File
     function writeToFile(jsonDatatoWrite){
        showProgress('plus', 'Updating Local Data');
        if(fs.existsSync('./download/'+pid+'/'+pid+'.json')){
            fs.unlinkSync('./download/'+pid+'/'+pid+'.json')
            var json = JSON.stringify(jsonDatatoWrite);
            fs.writeFile( './download/'+pid+'/'+pid+'.json', json, 'utf8', (err) => { 
                if(err){ 
                        showProgress('end', 'Updating Local File');
                        console.log(err);
                    }else{
                        showProgress('plus', 'Check Data');
                        checkFiles();
                    }
                })

        }else{
            var json = JSON.stringify(jsonDatatoWrite);
            fs.writeFile( './download/'+pid+'/'+pid+'.json', json, 'utf8', (err) => { 
                if(err){ 
                        showProgress('end', 'Updating Local File');
                        console.log(err);
                    }else{
                        showProgress('plus', 'Check Data');
                        checkFiles();
                    }
                })
        }




     } 

     function checkFiles(){
        if(checkInternet()){
        ps.getPlaylistItems(pid)
        .then((result) => {
            playlistCount = result.items.length;
            fs.readFile('./download/'+pid+'/'+pid+'.json','utf8', (err,data) => {
                var obj = JSON.parse(data);
                console.log(obj.length, playlistCount);
                if((obj.length - 1) == playlistCount){
                    showProgress('plus', 'Everything Up-to-Date');
                    console.log('All Updated',obj.length, playlistCount);
                    console.log('File Up to Date');
                    showPlaylist();
                }else{
                    showProgress('plus', 'Update Required');
                    console.log('Updates Required',obj.length, playlistCount);
                    console.log('Updates Required');
                    getPlaylist();
                }
            })
        }).catch((error) => {console.error(error)});
        }else{
            showOffline();
        }
    }



// If all files match play Music
function showPlaylist(){
    $('#playlistData').empty();
    fs.readFile('./download/'+pid+'/'+pid+'.json','utf8', (err,data) => {
        var itemsPro = 0;
        var obj1 = JSON.parse(data);
        showProgress('complete', 'Showing Playlist');
        console.log(obj1.length);
        document.getElementById('playlistName').innerHTML = obj1[0].name;
        var plylistContent;
        obj1.forEach((vidInfo,index) => {
            itemsPro++;
            if(index > 0){
                plylistContent = `<tr ondblclick="playMusic('${vidInfo.vid}')">
                                                <td>${(vidInfo.title).substring(0, 30)}</td>
                                                <td>${vidInfo.time}</td>
                                            </tr>`;
                $("#playlistData").append(plylistContent);
            }
            if(itemsPro == obj1.length){
              
                console.log('Playlist Updated');
            }
        })


    });
    console.log('Showing Playlist');
    
}

// If new, start downloading
function playMusic(vidID){
    fs.readFile('./download/'+pid+'/'+pid+'.json','utf8', (err,data) => {
        var obj1 = JSON.parse(data);
        showProgress('plus', 'Checking Local Storage for Song');
        var vidTitle = "";
        obj1.forEach((vidInfo,index) => {
                if(vidInfo.vid === vidID){
                    vidTitle = vidInfo.title;
                    if (fs.existsSync('./download/'+pid+'/'+vidID+'.mp3')){
                        console.log('File Exists');
                        playSong(`./download/${pid}/${vidID}.mp3`);
                    }else{
                        if(checkInternet()){
                        console.log('File Doesnt Exist, Downloading');
                    let stream = ytdl(vidID, {filter: 'audioonly'});   
                    ffmpeg(stream)
                                .audioBitrate(320)
                                .save(`./download/${pid}/${vidID}.mp3`)
                                .on('end', () => {
                                    console.log('Download Completed');
                                    console.log(`./download/${pid}/${vidID}.mp3`);
                                    playSong(`./download/${pid}/${vidID}.mp3`);

                                });
                            }else{
                                showOffline();
                            }
                    }
                }
        })
    });    
}
        // https://www.youtube.com/playlist?list=PLZPt05xwUw6WQLTouKL0PBSNJBJIBFivC

function playSong(songPath){
    var audio = document.getElementById('audio');
    var source = document.getElementById('mp3Source');
    source.src = songPath;
    audio.load();
    audio.play();
}





// ytpl("PLZPt05xwUw6VUAEQoARldfMWqJ2g3J6--", (err, pl) => {
//     if(err) throw err;

//     for (const i of pl.items) {
//         let stream = ytdl(i.id, {
//             filter: 'audioonly'
//         });

//         ffmpeg(stream)
//             .audioBitrate(320)
//             .save(`${output_dir}/${sanitize(i.title + " (by " + i.author.name + ")")}.mp3`)
//             .on('end', () => {
//                 console.log("Done! Downloaded \""+i.title + " (by " + i.author.name + ")"+"\"");
//             });
//     }
// });



  // Seconds to Min:Sec Format
  function secondsToTime(t){
    return padZero(parseInt((t/(60)) % 60)) + ":" + padZero(parseInt((t) % 60));
    function padZero(v){
        return (v < 10) ? "0" + v : v;
    }
}

var internetStatus = 0;
// Check Online Status
const alertOnlineStatus = () => {
    if(navigator.onLine){
        document.getElementById("online-offline").innerHTML = 'Online';
        //console.log('Online');
        internetStatus = 1;
    }else{
        document.getElementById("online-offline").innerHTML = 'Offline';
        //console.log('Offline');
        internetStatus = 0;
    }
  }
  window.addEventListener('online',  alertOnlineStatus)
  window.addEventListener('offline',  alertOnlineStatus)
  alertOnlineStatus();
  
  function checkInternet(){
    alertOnlineStatus();
    if(internetStatus == 0){
        return false;
    }else{
        return true;
    }
  }

  // Show Progress bar
  function showProgress(minplus, statusProg){
      if(minplus == 'plus'){
        progress++;
        document.getElementById('prog').innerHTML = statusProg + '<br>' + progress + ' / 5';
      }else if(minplus == 'end'){
        progress = 0;
        document.getElementById('prog').innerHTML = statusProg + '<br>' + 'End';        
      }else if(minplus == 'complete'){
        document.getElementById('prog').innerHTML = 'All Done';   
        console.log('On All Done : ',progress);     
      }else{
        progress--;
        document.getElementById('prog').innerHTML = statusProg + '<br>' + progress + ' / 5';
      }
  }

  function newWin(winName){
    if(winName == 'Playlist'){

          const remote = require('electron').remote;
          const BrowserWindow = remote.BrowserWindow;
          const win = new BrowserWindow({
            height: 400,
            width: 300,
            webPreferences : {
                nodeIntegration : true,
                enableRemoteModule: true
            }
          });
          win.loadFile('history.html');
    }
  }


  ipcRenderer.on('playlist', (event, data) => {
    sanitizeUrl(data);
  });

  function showOffline(){
    //console.log(getDirectories('./download/'));
    var playlists = getDirectories('./download/');
    var offlineSongs = [];
    var offlineSong;
    if(playlists.length === 0){
        document.getElementById('playlistName').innerHTML = "No Offline Songs";
    }else{
        var processedOfflinePlaylist = 0;
    playlists.forEach((folderName, indexplaylist) => {
        processedOfflinePlaylist++;
        var processedOfflineSongs = 0;
    if(fs.existsSync('./download/'+folderName+'/'+folderName+'.json')){
        console.log('Reading File');
        readFile('./download/'+folderName+'/'+folderName+'.json').then((fileData) => {
            var obj2 = JSON.parse(fileData);
            obj2.forEach((song, index) => {
                processedOfflineSongs++;
                if(index > 0){
                    if (fs.existsSync('./download/'+folderName+'/'+song.vid+'.mp3')){
                        var pathOfSong = `./download/${folderName}/${song.vid}.mp3`;
                        console.log(pathOfSong);
                        offlineSong = `{ "vid" : "${song.vid}" , "title" : "${song.title}", "duration" : "${song.time}", "src" : "${pathOfSong}" }`;    
                        offlineSongs.push(JSON.parse(offlineSong));
                    } 
                    if(processedOfflinePlaylist == playlists.length){
                        console.log(processedOfflinePlaylist, playlists.length);
                    if(processedOfflineSongs == obj2.length){
                        console.log(processedOfflineSongs, obj2.length);
                        showFinalOfflineSongs(offlineSongs);
                        }
                    }
                }
            })
        })
    }else{
        console.log('File Does Not Exists', folderName);
    }
    })
    }
  }


function showFinalOfflineSongs(songsOffline){
    $('#playlistData').empty();
    console.log(songsOffline);
    var plylistContentOffline;
    songsOffline.forEach((vidOff) => {
            plylistContentOffline = `<tr ondblclick="playSong('${vidOff.src}')">
                                        <td>${(vidOff.title).substring(0, 30)}</td>
                                        <td>${vidOff.duration}</td>
                                    </tr>`;
                                    $("#playlistData").append(plylistContentOffline);
                                   
                                })
}





  // Get all Directories
  function getDirectories() {
      var path = './download/';
    return fs.readdirSync(path).filter(function (file) {
      return fs.statSync(path+'/'+file).isDirectory();
    });
  }


  function offlineSong(){
    showOffline();
  }