const io = require("socket.io")();
const userModel = require('./routes/users.js');
const messageModel = require('./routes/message.js');
const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", function (socket) {
    console.log("A user connected");
    socket.on('sent-private-message', async data => {
        const messageCreate = await messageModel.create({
            sender: data.sender,
            data: data.message,
            reciever: data.reciever
        });
        // await userModel.findOne({ username: data.reciever });
        socket.broadcast.emit('recieve-private-message', data);
    });

    



});
// end of socket.io logic

module.exports = socketapi;