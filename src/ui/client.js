/* =============================================================================
 * EECE/CS 3093C Software Engineering — Lab 1
 * client.js — code skeleton provided by Dr. Phu Phung
 * Code complete implementation by Vivek Arun
 * ===============================================================================
 */
const socket = io(); //connect to the Socket.io Server
socket.on("connect", () => { //connected to the server
  console.log(`Connected to Socket.io server: 
    ${socket.io.opts.hostname}, port: ${socket.io.opts.port}`);
});

// UI DOM references
const sendBtnElm = document.getElementById('send-button');
const chatMessageInput = document.getElementById('chat-message');
const typingIndicator = document.querySelector(".ticontainer");
const typingText = document.getElementById('typing');
const responsesElm = document.getElementById('responses');
const statusElm = document.getElementById('status');

if (sendBtnElm) {
    sendBtnElm.addEventListener('click', sendMessage);
} else {
    console.log("Error in getting 'send-button' button");
}

if (chatMessageInput) {
    chatMessageInput.addEventListener('keypress', function(e) {
        socket.emit('typing');
        if (e.key === 'Enter') sendMessage();
    });
} else {
    console.log('Error in getting "chat-message" input');
}

// =============================================================================
// Use-Case-01: Send Message
// =============================================================================

function sendMessage() {
    const message = chatMessageInput.value.trim();
    if (!message) return;   // AC-02.2: empty messages are ignored
    console.log(`Debug>Chat message: ${message}`); //for UI testing only
    socket.emit('message', message);
    // other AC will be implemented
    chatMessageInput.value = ''; // AC-01.5: clear input after sending
    chatMessageInput.focus();

    // Hide indicator locally when sending
    if (typingIndicator) typingIndicator.style.display = 'none';
}

// =============================================================================
// Use-Case-02: Receive message 
// =============================================================================

//TODO: code to implement AC-02.1: display incoming chat messages without page refresh
socket.on('message', displayMessage);

function displayMessage(data) {
    const d = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    // Ensure DOMPurify is available (common source of runtime errors if not loaded)
    const cleanData = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data) : data;
    d.innerHTML = `<span style="color: #2431e5">[${timestamp}]</span> ${cleanData}`;
    
    if (responsesElm) {
        responsesElm.appendChild(d);
    }
    // AC-02.3 (UI): auto-scroll to the latest message
    window.scrollTo(0, document.body.scrollHeight);

    // Hide indicator when a message is received
    if (typingIndicator) typingIndicator.style.display = 'none';
    if (typingText) typingText.innerText = '';
}
socket.on('status', displayStatus);

function displayStatus(data) {
    if (!statusElm) return;
    // AC-02.2: shows timestamp for each message
    const timestamp = new Date().toLocaleTimeString();
    const cleanData = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data) : data;
    statusElm.innerHTML += `<br><span style="color: #2ee524">[${timestamp}]</span> ${cleanData}`;
    // AC-02.3 (UI): auto-scroll to the latest message
    statusElm.scrollTop = statusElm.scrollHeight;
}

const joinBtn = document.getElementById('joinBtn');
if (joinBtn) joinBtn.addEventListener('click', joinChat);

const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') joinChat();
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.reload(); // Simplest way to logout and reset socket state
    });
}

function joinChat() {
    const usernameElm = document.getElementById('username');
    const username = usernameElm ? usernameElm.value : '';
    const pattern = /^\w{3,20}$/;
    if (!username || !pattern.test(username)) {
        document.getElementById('login-error').textContent = "Username cannot be empty and must be between 3–20 characters!";
        return;
    }

    const passwordElm = document.getElementById('password');
    const password = passwordElm ? passwordElm.value : '';
    const passwordpattern = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

    if (!password || !passwordpattern.test(password)) {
        document.getElementById('login-error').textContent = "Password must be at least 6 characters long and contain both letters and numbers.";
        return;
    }
    document.getElementById('login-error').textContent = "";

    // AC-03.1: send credentials (as JSON object) to server (UC-03)
    const logincredentials = { username: username, password: password };
    socket.emit('join', logincredentials);
    console.log("Debug>sent login credentials to server: " + JSON.stringify(logincredentials));
}

socket.on('join-success', function(username) {
    const loginUI = document.getElementById('loginUI');
    const chatUI = document.getElementById('chatUI');
    const displayName = document.getElementById('display-name');

    if (loginUI) loginUI.style.display = 'none';
    if (chatUI) chatUI.style.display = 'block';
    if (displayName) displayName.textContent = username;
});

socket.on('join-error', function(message) {
    const errorElm = document.getElementById('login-error');
    if (errorElm) errorElm.textContent = message;
});

socket.on('not-authorized', function() {
    console.log("Debug>this client has not been authenticated!");
    const loginUI = document.getElementById('loginUI');
    const chatUI = document.getElementById('chatUI');
    if (loginUI) loginUI.style.display = 'block';
    if (chatUI) chatUI.style.display = 'none';
    const errorElm = document.getElementById('login-error');
    if (errorElm) errorElm.textContent = "Session invalid. Please log in.";
});

socket.on('user-list', (users) => {
    console.log("Debug>got user-list= " + JSON.stringify(users));
    const userListElm = document.getElementById('user-list');
    if (userListElm) userListElm.textContent = JSON.stringify(users);
});

let typingTimer;
socket.on('typing', function(data){
    if (typingIndicator) {
        typingIndicator.style.display = 'block';
        if (typingText) typingText.innerText = data || "Someone is typing...";

        clearTimeout(typingTimer);
        typingTimer = setTimeout(function() {
            typingIndicator.style.display = 'none';
            if (typingText) typingText.innerText = '';
        }, 3000);
    }
});