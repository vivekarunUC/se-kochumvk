// VI DOM references
var sendBtnElm = document.getElementById('send-button');
if(!sendBtnElm) {
    console.log("Error in getting 'send-button' button");
}

// AC-01.2 (UI): Send button click triggers sendMessage()
sendBtnElm.addEventListener('click', sendMessage);

var chatMessageInput = document.getElementById('chat-message');
if (!chatMessageInput) {
    console.log('Error in getting "chat-message" input');
}

// AC-01.2 (UI): pressing Enter also triggers sendMessage()
chatMessageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage () {
    var message = chatMessageInput.value.trim();
    if (!message) return;
    // AC-02.2: empty messages are ignored
    console.log(`Debug>Chat message: ${message}`); //for UI testing only
    // other AC will be implemented
    chatMessageInput.value = ''; // AC-01.5: clear input after sending
    chatMessageInput.focus();
}