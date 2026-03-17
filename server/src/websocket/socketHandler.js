const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a market room for targeted updates
    socket.on('join-market', (marketId) => {
      socket.join(`market-${marketId}`);
      console.log(`${socket.id} joined market-${marketId}`);
    });

    socket.on('leave-market', (marketId) => {
      socket.leave(`market-${marketId}`);
    });

    // Join a user room for private updates (e.g., balance)
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`${socket.id} joined user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;
