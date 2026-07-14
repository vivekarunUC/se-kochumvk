// =============================================================================
// EECE/CS 3093C Software Engineering — Lab 1
// server.js — code skeleton provided by Phu Phung
// complete implementation by Vivek Arun
// =============================================================================
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const messengerdb = require('./messengerdb');
app.use((req, res, next) => {
  res.setHeader(
  'Content-Security-Policy',
  "default-src 'self'; " +
  "script-src 'self' https://cdnjs.cloudflare.com https://code.jquery.com https://cdn.jsdelivr.net; " +
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
  "connect-src 'self' ws: wss: https://cdnjs.cloudflare.com"
  );
  next();
});
app.use(express.static(path.join(__dirname, 'ui')));

const PORT = process.env.PORT || 8080;
(async () => {
try {
await messengerdb.connect();
server.listen(PORT, () =>
console.log('Server running on port ' + PORT));
} catch (err) {
console.log('Error>server.js: failed to start — database connection error', err);
process.exit(1); // fail fast — don't run a server that can't authenticate anyone
}
})();

// In-memory store: socketId → username
const userlist = new Map();
// =============================================================
// Use-Case-03: Join Chat — credential store (internal to Use-Case-03, not part of Use-Case-04)
// Temporary: hard-coded JSON array — Lab 2 only
// TODO (Sprint 2): replace with MongoDB Atlas + bcrypt hashing
// =============================================================
/* const users = [
  { username: 'abc',   password: 'Pass1234' },
  { username: 'xyz',     password: 'Pass5678' },
  { username: 'test', password: 'Pass9012' }
];  
*/
// =============================================================
// Use-Case-04: Authorize User
// returns true if this connection was authenticated by Use-Case-03
// =============================================================
function authorizeUser(socket) {
  if (!socket || !socket.authenticated) 
    console.log('Connection has not been authenticated');
  return socket.authenticated === true;  
}
// =============================================================
// Helper: send an event only to authenticated connections
// Used by Use-Case-01 (Send Message) and Use-Case-03 (Join Chat)
// =============================================================
function sendToAuthenticatedClients(event, data) {
  userlist.forEach((_, sid) => {
    const s = io.sockets.sockets.get(sid);
    if (s && authorizeUser(s)) s.emit(event, data);
  });
}
io.on('connection', (socket) => {

  // Auto-assign a unique username from the socket ID
  //const username = 'User_' + socket.id.slice(-5);
  //userlist.set(socket.id, username);
  //console.log('New client connected - socket ID: ' + socket.id )
  socket.authenticated = false;
  console.log('New client connected - socket ID: ' + socket.id )

  // Handle Join Chat (Use-Case-03)
  socket.on('join', async (credentials) => {
    const { username, password } = credentials;
    
    // Find user in the hard-coded store
    const user = await messengerdb.find(username,password);

    if (user) {
      // Success logic
      socket.authenticated = true;
      userlist.set(socket.id, username);
      
      socket.emit('join-success', username);
      
      // Notify others and update user lists
      io.emit('status', username + ' joined the chat. Total users: ' + userlist.size);
      io.emit('user-list', Array.from(userlist.values()));
      
      console.log(`Debug> User "${username}" authenticated successfully.`);
    } else {
      // Failure logic
      socket.emit('join-error', 'Invalid username or password.');
      console.log(`Debug> Authentication failed for user: ${username}`);
    }
  });

  // Handle Register (Use-Case-05)
  socket.on('register', async function({ username, password }) {
    if (!username || typeof username !== 'string' ||
        !password || typeof password !== 'string' ||
        username.trim().length === 0 || password.length === 0) { // AC-05.3
      socket.emit('register-error', 'Invalid request.'); // AC-05.8
      return;
    }
    username = username.trim();
    // AC-05.3: server independently re-validates format — client can be bypassed
    const usernamePattern = /^\w{3,20}$/;
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!usernamePattern.test(username)) {
      socket.emit('register-error', 'Username must be 3-20 characters (letters, numbers, underscore).');
      return; // AC-05.8
    }
    if (!passwordPattern.test(password)) {
      socket.emit('register-error', 'Password must be at least 6 characters with letters and numbers.');
      return; // AC-05.8
    }

    // Part I code
    let result;
    try {
      result = await messengerdb.register(username, password);
    } catch (err) {
      socket.emit('register-error', 'Server error. Please try again.'); // AC-05.8
      return;
    }
    if (!result.success) {
      socket.emit('register-error', result.message); // AC-05.8
      return;
    }
    socket.emit('register-success', username); // AC-05.7: send the 'register-success' event to the client
  });

  // Handle Leave Chat
  socket.on('leave', () => {
    const username = userlist.get(socket.id);
    if (username) {
      userlist.delete(socket.id);
      socket.authenticated = false;
      console.log(`Debug> User "${username}" left the chat.`);

      // Notify others and update user lists
      io.emit('status', username + ' left the chat. Total users: ' + userlist.size);
      io.emit('user-list', Array.from(userlist.values()));

      socket.emit('leave-success');
    }
  });

  // ---------------------------------------------------------------------------
  // Use-Case-01: Send message
  //
  // AC-01.1: a username is always assigned on connection — every sender
  //          is identified before any message can be sent
  // AC-01.2: empty or non-string messages are ignored — no broadcast is sent
  // AC-01.3: the message is broadcast to ALL connected clients
  // AC-01.4: the broadcast payload includes the sender's username and the text
  // AC-01.5: input is cleared after sending (enforced client-side)
  // ---------------------------------------------------------------------------
  //Todo: code to implement the above use case and AC items
  socket.on('message', (data) => {
    console.log(`Debug> received a chat message: ${data}`); //new debug for Lab 2 security check
    // AC-04: Authorize User before broadcasting
    if (!authorizeUser(socket)) {
      socket.emit('not-authorized');
      return;
    }

    // AC-01.2: ignore empty messages
    if (!data || data.trim() === '') return;
    // AC-01.3 + AC-01.4: revised: broadcast to all authenticated clients with sender username
    const sender = userlist.get(socket.id);
    console.log(`Debug> "${sender}" sent: ${data}`);
    //io.emit('message', sender + ' says: ' + data.trim()); //old code in Lab 1 sent to all connected clients
    sendToAuthenticatedClients('message', sender + ' says: ' + data.trim()); // new code for Lab 2
  });

  // ---------------------------------------------------------------------------
  // Use-Case-02: Receive message — disconnect notification
  //
  // AC-02.2: all connected clients are notified when a user leaves
  // ---------------------------------------------------------------------------
  socket.on('disconnect', () => {
    const username = userlist.get(socket.id);
    if (username) {
      userlist.delete(socket.id);
      console.log('Client disconnected - socket ID: ' + socket.id);
      // Notify others and update user lists
      io.emit('status', username + ' left the chat. Total users: ' + userlist.size);
      io.emit('user-list', Array.from(userlist.values()));
    }
  });

  socket.on('typing', () => {
    const username = userlist.get(socket.id);
    console.log(`${username} is typing`);
    socket.broadcast.emit('typing', `${username} is typing...`);
  });
  
});
