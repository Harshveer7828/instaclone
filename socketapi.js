const io = require("socket.io")();
const userModel = require('./routes/users.js');
const messageModel = require('./routes/message.js');
const socketapi = {
    io: io
};

// Add your socket.io logic here!
io.on("connection", function (socket) {
    console.log("A user connected");

    // Handle 'join-server' event
    socket.on('join-server', async (username) => {
        try {
            // Update socketId in userModel for the connected user
            await userModel.findOneAndUpdate(
                { username: username },
                { socketId: socket.id }
            );
        } catch (error) {
            console.log("Error updating socketId:", error.message);
        }
    });

    // Handle 'sent-private-message' event
    socket.on('sent-private-message', async (data) => {
        try {
            // Save the message in messageModel
            const message = await messageModel.create({
                sender: data.sender,
                message: data.message,
                receiver: data.receiver
            });

            // Emit 'recieve-private-message' event to the receiver's socketId
            io.to(data.receiver).emit('recieve-private-message', { message: data.message });
        } catch (error) {
            console.log("Error sending private message:", error.message);
        }
    });



});
// end of socket.io logic

module.exports = socketapi;