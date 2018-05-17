
// When DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    let usernameNavbar = document.querySelector('.brand-logo');
    const usernameInput = document.querySelector('#usernameInput'); 
    const chatInput = document.querySelector('#chatInput');
    const msgForm = document.querySelector('#msgForm');
    
    // init username modal
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        onOpenEnd: () => {
            usernameInput.value = usernameNavbar.textContent;
            usernameInput.focus();
        }
    };
    
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // init chatrooms sidenav
    const sideNav = document.querySelector('.sidenav');
    const sideN = M.Sidenav.init(sideNav);


    // ------ SET USERNAME -------
    // if username not in localStorage
    if (!localStorage.getItem('username'))
        uModal.open();
    else
        usernameNavbar.innerHTML = localStorage.getItem('username');

    // -------FUNCTIONS---------

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


    const pullConversation = (chatroom) => {
        // config AJAX request to get data
        
        // clear chat box
        document.querySelector('.chat-messages').innerHTML = "";

        // init new request
        const request = new XMLHttpRequest();
        request.open('POST', '/api/conversation');
        // Callback func when request copletes
        request.onload = () => {

            // Extract JSON data from request
            const data = JSON.parse(request.responseText);

            if (data.success) {
                // make each div msg and attach to the page
                data.conversation.forEach(msg => {
                    // create div for each msg
                    const div = document.createElement('div');
                    
                    div.classList.add('card-panel', 'chat-bubble', 'cyan', 'lighten-4');
                    // append author span
                    const span = `<span class='chat-bubble-author'>~${msg.author}</span>`;
                    div.innerHTML = msg.text + span;

                    document.querySelector('.chat-messages').append(div);
                })                
            }
            else {
                // show error msg 
            }
        }

        // set chatroom navbar name
        if (localStorage.getItem('chatroom')) {
            document.querySelector('#nav-chatroom').innerHTML = localStorage.getItem('chatroom');
            // saved chatroom should appear active on sideNav
            document.querySelectorAll('#slide-out li a').forEach(item => {
                if (item.textContent === localStorage.getItem('chatroom')) {
                    item.classList.add('cyan', 'darken-3');
                }
            })
        }
        else {
            document.querySelector('#nav-chatroom').innerHTML = "Chatrooms";
        }
        

        const data = new FormData();
        data.append('chatroom', chatroom);
        // send request
        request.send(data);

    }

    
    // -------END FUNCTIONS---------

    // ------ PULL conversation from API if saves chatroom ------
    if (localStorage.getItem('chatroom')){
        // AJAX request for pulling all messages for that chatroom - function
        pullConversation(localStorage.getItem('chatroom'));
    }



    // set input keyup events
    document.querySelector('#usernameInput').onkeyup = changeUsername;
    // action when hit save btn in modal
    document.querySelector('#saveUsername').onclick = changeUsername;
    // attach click event to list of chatrooms
    document.querySelectorAll('.chatroom').forEach(chatroom => {
        
        chatroom.onclick = (e) => {
            // target chatroom list
            // remove from all list elements darker background            
            document.querySelectorAll('#slide-out li a').forEach(item => {
                item.classList.remove('cyan', 'darken-3');
            })
            // make the selection darker
            e.target.classList.add('cyan', 'darken-3');

            let roomName = e.target.textContent;
            // save selected chatroom into LocalStorage
            localStorage.setItem('chatroom', roomName);

            // fetch Conversation from API
            pullConversation(roomName);

            // set navbar chatroom name
            document.querySelector('#nav-chatroom').innerHTML = e.target.textContent;
            
            // close Sidebar
            sideN.close();
        }
    })

    

    // Connect to websocket
    var socket = io.connect(`${location.protocol}//${document.domain}:${location.port}`);

    // When connected, configure message input
    socket.on('connect', () => {

        // submiting form () should emit "send msg" event
        msgForm.onsubmit = () => {
            let text = chatInput.value;
            
            let msg = {
                'chatroom': localStorage.getItem('chatroom'),
                'author': localStorage.getItem('username'),
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
        if (data.chatroom === localStorage.getItem('chatroom')) {
            const div = document.createElement('div');
            
            div.classList.add('card-panel', 'chat-bubble', 'cyan', 'lighten-4');
            // append author span
            const span = `<span class='chat-bubble-author'>~${data.author}</span>`;
            div.innerHTML = data.text + span;

            document.querySelector('.chat-messages').append(div);
        }
    })
  });






