let io;

const initSocket = (socketIo) => {
  io = socketIo;
  console.log('Socket.io instance initialized in socket utility');
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized! Call initSocket first.');
  }
  return io;
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitToAll,
  emitToRoom,
  emitToUser
};