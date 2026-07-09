/* =============================================================================
 * EECE/CS 3093C Software Engineering — Lab 1
 * client.js — code skeleton provided by Dr. Phu Phung
 * Code complete implementation by Vivek Arun
 * ===============================================================================
 */
var socket = io(); //connect to the Socket.io Server
socket.on("connect", () => { //connected to the server
  console.log(`Connected to Socket.io server: 
    ${socket.io.opts.hostname}, port: ${socket.io.opts.port}`);
});

/**
 * code blocks below have been implemented in Lecture 8
 */
// UI DOM references
var sendBtnElm = document.getElementById('send-button');
if(!sendBtnElm) {
    console.log("Error in getting 'send-button' button");
}
// AC-01.2 (UI): Send button click triggers sendMessage()
sendBtnElm.addEventListener('click', sendMessage);

var chatMessageInput = document.getElementById('chat-message');
if(!chatMessageInput) {
    console.log('Error in getting "chat-message" input');
}
// AC-01.2 (UI): pressing Enter also triggers sendMessage()
chatMessageInput.addEventListener('keypress', function(e) {
    socket.emit('typing');
    if (e.key === 'Enter') sendMessage();
});

// =============================================================================
// Use-Case-01: Send Message
// =============================================================================

function sendMessage() {
    var message = chatMessageInput.value.trim();
    if (!message) return;   // AC-02.2: empty messages are ignored
    console.log(`Debug>Chat message: ${message}`); //for UI testing only
    socket.emit('message', message);
    // other AC will be implemented
    chatMessageInput.value = ''; // AC-01.5: clear input after sending
    chatMessageInput.focus();

    // Hide indicator locally when sending
    var typingIndicator = document.querySelector(".ticontainer");
    if (typingIndicator) typingIndicator.style.display = 'none';
}

// =============================================================================
// Use-Case-02: Receive message 
// =============================================================================

//TODO: code to implement AC-02.1: display incoming chat messages without page refresh
socket.on('message', displayMessage);

function displayMessage(data) {
    var d = document.createElement('div');
    var timestamp = new Date().toLocaleTimeString();
    d.innerHTML = '<span style="color: #2431e5">[' + timestamp + ']</span> ' + DOMPurify.sanitize(data);
    document.getElementById('responses').appendChild(d);
    // AC-02.3 (UI): auto-scroll to the latest message
    window.scrollTo(0, document.body.scrollHeight);

    // Hide indicator when a message is received
    var typingIndicator = document.querySelector(".ticontainer");
    var typingText = document.getElementById('typing');
    if (typingIndicator) typingIndicator.style.display = 'none';
    if (typingText) typingText.innerText = '';
}
socket.on('status', displayStatus);

function displayStatus(data) {
        var statusElm = document.getElementById('status');
    // AC-02.2: shows timestamp for each message
    var timestamp = new Date().toLocaleTimeString();
    statusElm.innerHTML = statusElm.innerHTML + '<br><span style="color: #2ee524">[' + timestamp + ']</span> '  + DOMPurify.sanitize(data);
    // AC-02.3 (UI): auto-scroll to the latest message
    statusElm.scrollTop = statusElm.scrollHeight;
}
document.getElementById('joinBtn').addEventListener('click', joinChat);
function joinChat() {
    const username = document.getElementById('username').value;
    const pattern = /^\w{3,20}$/;
    if (!username || !pattern.test(username)) {
    alert("Username cannot be empty and must be between 3–20 characters!");
    return;
    }
    //the following lines should be moved to the authentication confirmation from the server
    document.getElementById('loginUI').style.display = 'none';
    document.getElementById('chatUI').style.display = '';
}
socket.on('typing', function(data){
  console.log('typing event:' + data);
  var typingText = document.getElementById('typing');
  var typingIndicator = document.querySelector(".ticontainer");
  if (typingIndicator) {
    typingIndicator.style.display = 'block';
    if (typingText) typingText.innerText = data || "Someone is typing...";

    // Clear existing timeout and hide indicator after 3 seconds of inactivity
    clearTimeout(typingIndicator.timer);
    typingIndicator.timer = setTimeout(function() {
      typingIndicator.style.display = 'none';
      if (typingText) typingText.innerText = '';
    }, 3000);
  }
});