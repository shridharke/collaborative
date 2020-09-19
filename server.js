const express = require('express');
const app= express();
const server=require('http').Server(app);
const { v4: uuidv4} = require('uuid');
// const peerServer =require('peer');
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug:true
});

let rooms = { }

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true}));

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
    res.render('home');
});

app.post('/joinroom', (req,res) => {
    var joinRoomId = req.body.room;
    if(rooms[joinRoomId] == null){
        return res.redirect('/');
    }
    res.redirect(`/${joinRoomId}`);
})

app.post('/createroom', (req,res) => {
    const roomUID = uuidv4().substring(0,5);
    rooms[roomUID] = {};
    res.redirect(`${roomUID}`);
})

app.post('/leavemeet', (req,res) => {
    res.redirect('/');
})

app.use('/peerjs', peerServer);

app.get('/:room', (req,res) => {
    res.render('room', { roomId: req.params.room});
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, username) => {
        socket.join(roomId);
        rooms[roomId][userId] = username;
        socket.to(roomId).broadcast.emit('user-connected', userId);
        socket.on('message', message => {
            socket.to(roomId).broadcast.emit('createMessage', {message: message, name: rooms[roomId][userId]});
        })
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
            delete rooms[roomId][userId];
        })
    })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3030;
}

server.listen(port);