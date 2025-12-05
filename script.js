const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/energosphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Импорт маршрутов
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/game');
const guildRoutes = require('./src/routes/guild');
const marketRoutes = require('./src/routes/market');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/guild', guildRoutes);
app.use('/api/market', marketRoutes);

// WebSocket обработчики
require('./src/sockets/gameSockets')(io);
require('./src/sockets/chatSockets')(io);

// Запуск игровых событий
const eventManager = require('./src/events/eventManager');
eventManager.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
