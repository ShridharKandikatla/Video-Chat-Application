const { Server } = require('socket.io');
const cors = require('cors');
const io = new Server(5000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on('connection', (socket) => {
  socket.on('room:join', (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(data.email, socket.id);
    socketIdToEmailMap.set(socket.id, data.email);
    io.to(data.room).emit('user:joined', { email, id: socket.id });
    socket.join(data.room);
    io.to(socket.id).emit('room:join', data);
  });

  socket.on('user:call', ({ to, offer }) => {
    io.to(to).emit('incoming:call', { from: socket.id, offer });
  });

  socket.on('call:accepted', ({ to, ans }) => {
    io.to(to).emit('call:accepted', { from: socket.id, ans });
  });

  socket.on('peer:nego:needed', ({ to, offer }) => {
    io.to(to).emit('peer:nego:needed', { from: socket.id, offer });
  });
  
  socket.on('peer:nego:done', ({ to, ans }) => {
    
    io.to(to).emit('peer:nego:final', { from: socket.id, ans });
  })
});
