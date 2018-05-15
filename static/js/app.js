let usernameNavbar = document.querySelector('.brand-logo');
const usernameInput = document.querySelector('#usernameInput'); 
const chatInput = document.querySelector('#chatInput');
const msgForm = document.querySelector('#msgForm');

// When DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // init username modal
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        onOpenEnd: () => {
            usernameInput.value = usernameNavbar.textContent;
            usernameInput.focus();
        }
    };
    
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // if username not in localStorage
    if (!localStorage.getItem('username'))
        uModal.open();
    else
        usernameNavbar.innerHTML = localStorage.getItem('username');

    // set input keyup events
    document.querySelector('#usernameInput').onkeyup = changeUsername;
    // action when hit save btn in modal
    document.querySelector('#saveUsername').onclick = changeUsername;


    // TODO: setup currentChat var in localStorage

    // init sidenav
    const sideNav = document.querySelector('.sidenav');
    const sideN = M.Sidenav.init(sideNav);

    // Connect to websocket
    var socket = io.connect(`${location.protocol}//${document.domain}:${location.port}`);

    // When connected, configure message input
    socket.on('connect', () => {

        // submiting form () should emit "send msg" event
        msgForm.onsubmit = () => {
            let text = chatInput.value;
            
            // TODO: pull info for msg from LocalStorage
            let msg = {
                'chatroom': 'Testing',
                'author': 'Jakub',
                'text': text,
                'date': Date.now()
            }
            
            socket.emit('send msg', msg)
            // clear chat input
            chatInput.value = "";
            // prevent form from default behavior
            return false;
        }
    })

    // When a new message is announced, add to the conversation if opened this chatroom
    socket.on('announce msg', data => {
        // check with localStorage current chatroom
        if (data.chatroom === 'Testing') {
            const div = document.createElement('div');
            div.innerHTML = data.text;
            div.classList.add('card-panel');
            div.classList.add('chat-bubble');
            document.querySelector('.chat-messages').append(div);
        }
    })

    
  });




const changeUsername = (e) => {
    let source = e.originalTarget || e.srcElement ;

    if (e.key === 'Enter' || source.id === "saveUsername") {
        // target username input
        if (usernameInput.value.length > 0) {
            // change username on page
            usernameNavbar.innerHTML = usernameInput.value;
            // save username in localStorage
            localStorage.setItem('username', usernameInput.value);
            // clear input field
            usernameInput.value = '';
            // close modal
            M.Modal.getInstance(usernameModal).close();

        } else {
            alert('Provide an username')
        }
    }
}

