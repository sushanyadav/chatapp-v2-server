const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersRoom } = require('./users.js');
const router = require('./router')

const PORT = process.env.PORT || 5000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(router)
app.use(cors())
// let rooms = []

io.on('connection', (socket) => {
    //console.log('we have a new connection !!!');

    //*USER JOIN

    socket.on('join', ({ name, room }, callback) => {


        const { error, user } = addUser({ id: socket.id, name, room })
        if (error) {
            return callback(error)
        }

        socket.emit('message', { user: 'admin', text: `${user.name}, Welcome to the room ${user.room}` }) //to the specific user
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined.` }) //to all the user in room expect the joined User
        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersRoom(user.room) }) //sending the current rooms when joins
        // rooms.push(room)
        // console.log([...new Set(rooms)]);
        socket.on('typing', ({ name }) => {
            socket.broadcast.to(user.room).emit('display', name)
        })

        socket.on('not-typing', () => {
            socket.broadcast.to(user.room).emit('display', '')
        })

        callback() //callback with no argument to do something to front-end

    })



    //*SEND MESSAGE BY USER

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', { user: user.name, text: message }) //to all the user in the room including the current user 
        callback()
    })


    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        //console.log('a user left !!!');
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersRoom(user.room) }) //sending the current rooms when somebody leaves

        }
    })

})



server.listen(PORT, () => {
    console.log(`Server is up in running on port ${PORT}`);

})