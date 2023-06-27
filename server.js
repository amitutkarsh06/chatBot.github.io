
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentuser, userLeaves,
    getRoomUsers } = require('./utils/user');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botname='chatcord bot'

 //set static folder to access the frontend
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
       
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // message on user console
        socket.emit('messages', formatMessage(botname, `Hello ${user.username}, Welcome to Chat-zone!!. you are in room ${user.room}`));

        //broadcasts when a user connects.
        socket.broadcast.to(user.room).emit('messages', formatMessage(botname, `${user.username} has joined the chat `));

                //send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)

        });
    });
    
    
    socket.on('chatMessage', msg => {
        
        const user = getCurrentuser(socket.id);

        io.to(user.room).emit('messages', formatMessage(user.username, msg));
    });


    //when client disconnects
    socket.on('disconnect', () => {
        
        const user = userLeaves(socket.id); 
        
        if (user) {
            
            io.emit('messages', formatMessage(botname, `${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)

            });

        }

    });

} );
 
const port = 3000 || process.env.port;

server.listen(port, () => console.log(`server is running on port ${port}`));