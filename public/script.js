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
    
    // Get the editor id, using Url.js
    // The queryString method returns the value of the id querystring parameter
    // We default to "_", for users which do not use a custom id.
    var editorId = ROOM_ID;
    
    // This is the local storage field name where we store the user theme
    // We set the theme per user, in the browser's local storage
    var LS_THEME_KEY = "editor-theme";
    var LS_FSIZE_KEY = "editor-font-size";

    // This function will return the user theme or the Monokai theme (which
    // is the default)
    function getTheme() {
        return localStorage.getItem(LS_THEME_KEY) || "ace/theme/monokai";
    }
    
    function getFontSize() {
        return localStorage.getItem(LS_FSIZE_KEY) || "15pt";
    }

    // Select the desired theme of the editor
    $("#select-theme").change(function () {
        // Set the theme in the editor
        editor.setTheme(this.value);
        
        // Update the theme in the localStorage
        // We wrap this operation in a try-catch because some browsers don't
        // support localStorage (e.g. Safari in private mode)
        try {
            localStorage.setItem(LS_THEME_KEY, this.value);
        } catch (e) {}
    }).val(getTheme());

    $("#select-fontsize").change(function () {
        // Set the size in the editor
        editor.setOptions({
            fontSize: this.value
        });
        
        // Update the font size in the localStorage
        // We wrap this operation in a try-catch because some browsers don't
        // support localStorage (e.g. Safari in private mode)
        try {
            localStorage.setItem(LS_FSIZE_KEY, this.value);
        } catch (e) {}
    }).val(getFontSize());
    
    // Select the desired programming language you want to code in 
    var $selectLang = $("#select-lang").change(function () {
        // Set the language in the Firebase object
        // This is a preference per editor
        currentEditorValue.update({
            lang: this.value
        });
        // Set the editor language
        editor.getSession().setMode("ace/mode/" + this.value);
    });

    var textFile = null,
    makeTextFile = function (text) {
        var data = new Blob([text], {type: 'text/plain'});
    
        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
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

    // Generate a pseudo user id
    // This will be used to know if it's me the one who updated
    // the code or not
    var uid = Math.random().toString();
    var editor = null;
    // Make a reference to the database
    var db = firebase.database();
    
    // Write the entries in the database 
    var editorValues = db.ref("editor_values");
    
    // Get the current editor reference
    var currentEditorValue = editorValues.child(editorId);
    
    // Store the current timestamp (when we opened the page)
    // It's quite useful to know that since we will
    // apply the changes in the future only
    var openPageTimestamp = Date.now();

    // Take the editor value on start and set it in the editor
    currentEditorValue.child("content").once("value", function (contentRef) {

        // Somebody changed the lang. Hey, we have to update it in our editor too!
        currentEditorValue.child("lang").on("value", function (r) {
            var value = r.val();
            // Set the language
            var cLang = $selectLang.val();
            if (cLang !== value) {
                $selectLang.val(value).change();
            }
        });

        // Hide the spinner
        // $("#loader").fadeOut();
        $("#editor").fadeIn();

        // Initialize the ACE editor
        editor = ace.edit("editor");
        editor.setTheme(getTheme());
        editor.$blockScrolling = Infinity;

        editor.setOptions({
            fontSize: getFontSize()
        });

        // Get the queue reference
        var queueRef = currentEditorValue.child("queue");
        
        // This boolean is going to be true only when the value is being set programmatically
        // We don't want to end with an infinite cycle, since ACE editor triggers the
        // `change` event on programmatic changes (which, in fact, is a good thing)
        var applyingDeltas = false;

        // When we change something in the editor, update the value in Firebase
        editor.on("change", function(e) {
                    
            // In case the change is emitted by us, don't do anything
            // (see below, this boolean becomes `true` when we receive data from Firebase)
            if (applyingDeltas) {
                return;
            }

            // Set the content in the editor object
            // This is being used for new users, not for already-joined users.
            currentEditorValue.update({
                content: editor.getValue()
            });

            // Generate an id for the event in this format:
            //  <timestamp>:<random>
            // We use a random thingy just in case somebody is saving something EXACTLY
            // in the same moment
            queueRef.child(Date.now().toString() + ":" + Math.random().toString().slice(2)).set({
                event: e,
                by: uid
            }).catch(function(e) {
                console.error(e);
            });
        });

        // Get the editor document object 
        var doc = editor.getSession().getDocument();

        // Listen for updates in the queue
        queueRef.on("child_added", function (ref) {
        
            // Get the timestamp
            var timestamp = ref.key.split(":")[0];
        
            // Do not apply changes from the past
            if (openPageTimestamp > timestamp) {
                return;
            }
        
            // Get the snapshot value
            var value = ref.val();
            
            // In case it's me who changed the value, I am
            // not interested to see twice what I'm writing.
            // So, if the update is made by me, it doesn't
            // make sense to apply the update
            if (value.by === uid) { return; }
        
            // We're going to apply the changes by somebody else in our editor
            //  1. We turn applyingDeltas on
            applyingDeltas = true;
            //  2. Update the editor value with the event data
            doc.applyDeltas([value.event]);
            //  3. Turn off the applyingDeltas
            applyingDeltas = false;
        });

        // Get the current content
        var val = contentRef.val();
        
        // If the editor doesn't exist already....
        if (val === null) {
            // ...we will initialize a new one. 
            // ...with this content:
            val = "/* Welcome to Collaborative! */";

            // Here's where we set the initial content of the editor
            editorValues.child(editorId).set({
                lang: "javascript",
                queue: {},
                content: val
            });
        }

        // We're going to update the content, so let's turn on applyingDeltas 
        applyingDeltas = true;
        
        // ...then set the value
        // -1 will move the cursor at the begining of the editor, preventing
        // selecting all the code in the editor (which is happening by default)
        editor.setValue(val, -1);
        
        // ...then set applyingDeltas to false
        applyingDeltas = false;
        
        // And finally, focus the editor!
        editor.focus();
    });
});

// (function () {
//     var textFile = null,
//     makeTextFile = function (text) {
//         var data = new Blob([text], {type: 'text/plain'});
    
//         // If we are replacing a previously generated file we need to
//         // manually revoke the object URL to avoid memory leaks.
//         if (textFile !== null) {
//         window.URL.revokeObjectURL(textFile);
//         }
    
//         textFile = window.URL.createObjectURL(data);
    
//         return textFile;
//     };
    
    
//     var create = document.getElementById('create');
//     var editor=ace.edit();
    
//     create.addEventListener('click', function () {
//         var link = document.createElement('a');
//         link.href = makeTextFile(editor.getValue());
//         console.log(editor.getValue());
//         link.download = 'code.txt';
//         // link.click();
//     }, false);
// })();