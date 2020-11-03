const socket = io('/');
const myVideo = document.createElement('video');
const videoContainer = document.getElementById('video-container');
const messageForm = document.getElementById('chat-input-div');
myVideo.muted = true;

var username

if(messageForm!=null){
    username = prompt('Enter your Name');
}

const peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
});

const peers = {};

let myVideoStream

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        })
    });

    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    })
});

socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close()
})

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id, username);
})

const connectToNewUser = (userId,stream) => {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream( video, userVideoStream);
    })
    call.on('close',() => {
        video.remove();
    })
    peers[userId] = call;
}

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoContainer.append(video);
}

let msgg = $('input');

$('html').keydown((e) => {
    if(e.which ==13 && msgg.val().length !== 0){
        socket.emit('message', msgg.val());
        $('ul').append(`<li class="mymessage">${msgg.val()}</li>`);
        msgg.val('');
    }
})

socket.on('createMessage', data => {
    $('ul').append(`<li class="message"><b>${data.name}</b><br>${data.message}</li>`);
    scrollToBottom();
});

const scrollToBottom = () => {
    var scr = $('.chat-window');
    scr.scrollTop(scr.prop("scrollHeight"));
}

const muteFunc = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled){
        setUnmuteButton();
        myVideoStream.active=false;
        myVideoStream.getAudioTracks()[0].enabled = false;
    }
    else{
        setMuteButton();
        myVideoStream.active=true;
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}

const setMuteButton = () => {
    const html=`<i class="fas fa-microphone"></i>`
    document.querySelector('.audio-mute-button').innerHTML=html;
}

const setUnmuteButton = () => {
    const html = `<i class="unmute fas fa-microphone-slash"></i>`
    document.querySelector('.audio-mute-button').innerHTML=html;
}

const playStop =() => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled){
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    }
    else{
        myVideoStream.getVideoTracks()[0].enabled = true;
        setStopVideo();
    }
}

const setPlayVideo = () => {
    const html=`<i class="unmute fas fa-video-slash"></i>`
    document.querySelector('.video-mute-button').innerHTML=html;
}

const setStopVideo = () => {
    const html=`<i class="fas fa-video"></i>`
    document.querySelector('.video-mute-button').innerHTML=html;
}

$(function() {

    // Initialize Firebase configuration
    var config = {
        apiKey: "AIzaSyA-A1ztqnagfvnjOAUcurHN1mHR1Y6s0D4",
        authDomain: "collaborative-4ad43.firebaseapp.com",
        databaseURL: "https://collaborative-4ad43.firebaseio.com",
        projectId: "collaborative-4ad43",
        storageBucket: "collaborative-4ad43.appspot.com",
        messagingSenderId: "427207457215",
        appId: "1:427207457215:web:9bc28fb31b37475903c90a",
        measurementId: "G-9FF8JKN9S6"
    };
    firebase.initializeApp(config);
    
    var editorId = ROOM_ID;
    
    var LS_THEME_KEY = "editor-theme";
    var LS_FSIZE_KEY = "editor-font-size";

    function getTheme() {
        return localStorage.getItem(LS_THEME_KEY) || "ace/theme/monokai";
    }
    
    function getFontSize() {
        return localStorage.getItem(LS_FSIZE_KEY) || "15pt";
    }

    $("#select-theme").change(function () {
        
        editor.setTheme(this.value);
        
        try {
            localStorage.setItem(LS_THEME_KEY, this.value);
        } catch (e) {}
    }).val(getTheme());

    $("#select-fontsize").change(function () {
        
        editor.setOptions({
            fontSize: this.value
        });
        
        try {
            localStorage.setItem(LS_FSIZE_KEY, this.value);
        } catch (e) {}
    }).val(getFontSize());
    
    var $selectLang = $("#select-lang").change(function () {
        
        currentEditorValue.update({
            lang: this.value
        });
        editor.getSession().setMode("ace/mode/" + this.value);
    });

    var textFile = null,
    makeTextFile = function (text) {
        var data = new Blob([text], {type: 'text/plain'});
    
        if (textFile !== null) {
        window.URL.revokeObjectURL(textFile);
        }
    
        textFile = window.URL.createObjectURL(data);
    
        return textFile;
    };
    
    var create = document.getElementById('create');
    
    create.addEventListener('click', function () {
        var link = document.createElement('a');
        link.href = makeTextFile(editor.getValue());
        link.download = 'code.txt';
        link.click();
    }, false);

    var uid = Math.random().toString();
    var editor = null;
    var db = firebase.database();
    
    var editorValues = db.ref("editor_values");
    
    var currentEditorValue = editorValues.child(editorId);
    
    var openPageTimestamp = Date.now();
    currentEditorValue.child("content").once("value", function (contentRef) {

        currentEditorValue.child("lang").on("value", function (r) {
            var value = r.val();
            var cLang = $selectLang.val();
            if (cLang !== value) {
                $selectLang.val(value).change();
            }
        });
        $("#editor").fadeIn();

        editor = ace.edit("editor");
        editor.setTheme(getTheme());
        editor.$blockScrolling = Infinity;

        editor.setOptions({
            fontSize: getFontSize()
        });
        var queueRef = currentEditorValue.child("queue");
        
        var applyingDeltas = false;

        editor.on("change", function(e) {
                    
            if (applyingDeltas) {
                return;
            }

            currentEditorValue.update({
                content: editor.getValue()
            });

            queueRef.child(Date.now().toString() + ":" + Math.random().toString().slice(2)).set({
                event: e,
                by: uid
            }).catch(function(e) {
                console.error(e);
            });
        });
 
        var doc = editor.getSession().getDocument();

        queueRef.on("child_added", function (ref) {
        
            
            var timestamp = ref.key.split(":")[0];
        
            if (openPageTimestamp > timestamp) {
                return;
            }
        
            var value = ref.val();
            
            if (value.by === uid) { return; }
        
            applyingDeltas = true;
            doc.applyDeltas([value.event]);
            applyingDeltas = false;
        });

        var val = contentRef.val();
        
        if (val === null) {
            val = "/* Welcome to Collaborative! */";

            editorValues.child(editorId).set({
                lang: "javascript",
                queue: {},
                content: val
            });
        }

        applyingDeltas = true;
        
        editor.setValue(val, -1);
        
        applyingDeltas = false;
        
        editor.focus();
    });
});
