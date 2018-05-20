document.addEventListener('DOMContentLoaded', () => {
    // Handlers
    const usernameInput = document.querySelector('#usernameInput');
    const usernameNavbar = document.querySelector('.brand-logo');
    const membersList = document.querySelector('#members');
    const chatbox = document.querySelector('.chat-messages');
    const msgForm = document.querySelector('#msgForm');
    const chatroomInput = document.querySelector('#chatroomInput');
    const chatroomList = document.querySelector('#slide-out');

    // === Initial username modal setup ===
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        dismissible: false,
        onOpenEnd: () => {
            usernameInput.value = usernameNavbar.textContent;
            usernameInput.focus();
        }
    }
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // === Init bottom modal for adding chatroom ===
    const roomModal = document.querySelector('#roomModal');
    // const modalOptions = {
    //     onOpenEnd: () => {
    //         usernameInput.value = usernameNavbar.textContent;
    //         usernameInput.focus();
    //     }
    // }
    const rModal = M.Modal.init(roomModal);

    // === Chatrooms SideNav setup ===
    const chatroomSidenav = document.querySelector('.sidenav');
    const sidenavOptions = {
        // fetch available chatrooms from API
        onOpenStart: () => {
            axios.get('/api/chatrooms')
            .then(res => {
                const chatrooms = document.querySelectorAll('.chatroom');
                // clear list of chatrooms
                chatrooms.forEach(room => {
                    chatroomList.removeChild(room);
                })

                for(let room of res.data) {
                    let chatroom = '';

                    if (localStorage.getItem('chatroom') === room)
                        chatroom = `<li class='chatroom'><a class="waves-effect cyan darken-3" >${room}</a></li>`;
                    else
                        chatroom = `<li class='chatroom'><a class="waves-effect" >${room}</a></li>`;

                    chatroomList.innerHTML += chatroom;
                }
            })
            .catch(err => console.log(err));
        }

    }
    const sideNav = M.Sidenav.init(chatroomSidenav, sidenavOptions);
    
    // =================
    // === Functions ===
    // =================

    const joinChatroom = (chatroom, user) => {
        // prepare data
        let data = {
            'chatroom': chatroom,
            'user': user
        };
        // clear chatbox window
        chatbox.innerHTML = "";
        // join the room
        socket.emit('join', data);
        // show chatroom
        document.querySelector('main').style.visibility = 'visible';
    }


    const changeChatroom = (e) => {
        // target only chatrooms
        if (e.target.id === "addRoom") {
            // open modal for adding new room
            rModal.open();
            // focus on input
            chatroomInput.focus();
        }
        if (e.target.className === "waves-effect") {
            // leave previous room
            if (localStorage.getItem('chatroom')) {
                let data = {
                        'chatroom': localStorage.getItem('chatroom'),
                        'user': localStorage.getItem('username')
                    }

                socket.emit('leave', data);
            }
            // place chatroom name on the navbar
            document.querySelector('#nav-chatroom').innerHTML = e.target.textContent;
            // store chatroom name in localStorage
            localStorage.setItem('chatroom', e.target.textContent);
            // close modal
            sideNav.close();

            joinChatroom(e.target.textContent, localStorage.getItem('username'));
        }
    }

    // setup an username by completing input in Modal
    const setUsername = (e) => {
        const source = e.originalTarget || e.srcElement;
        // target only hitting Enter and Save Button click
        if (e.key === 'Enter' || source.id === 'saveUsernameBtn') {
            
            // prevent submitting empty input
            if (usernameInput.value.length > 0) {
                // Save username in localStorage
                localStorage.setItem('username', usernameInput.value); 
                // Show username on Navbar
                usernameNavbar.innerHTML = localStorage.getItem('username');
                // close modal
                uModal.close();
            } else {
                alert('Provide an username');
            }

        }        
    }

    // Add Chatroom submitting bottom modal
    const addChatroom = () => {
        // Name shouldn't be empty
        if (chatroomInput.value.length > 0) {
            // add chatroom
            socket.emit('add room', {'room': chatroomInput.value});
            // clear input
            chatroomInput.value = '';
            // close modal
            rModal.close();
        }

        return false;
    }


    // Connect to websocket
    var socket = io.connect(`${location.protocol}//${document.domain}:${location.port}`);

    socket.on('connect', () => {
        
        msgForm.onsubmit = (e) => {
            // e.preventDefault();
            let time = new Date().toLocaleTimeString();

            let data = {
                'chatroom': localStorage.getItem('chatroom'),
                'user': localStorage.getItem('username'),
                'text': document.querySelector('#chatInput').value,
                'date': time
            }

            // send msg to server
            socket.emit('send msg', data);
            // clear chat input
            document.querySelector('#chatInput').value = '';
            // prevent form from refreshing
            return false;
        }
    });


    socket.on('on_chatroom_change', data => {
        // fetch whole conversation, add if chatbox is empty
        if (data.messages) {
            data.messages.forEach(msg => {
                let bubble = `<div class='card-panel chat-bubble cyan lighten-4'>
                                ${msg.text}
                                <span class='chat-bubble-author'>${msg.date}~${msg.user}</span>
                            </div>`
                
                chatbox.innerHTML += bubble;
            })
        }

        // append info about user action
        let notify = `<div>${data.msg}</div>`;
        chatbox.innerHTML += notify;
        
        // clear list of members
        membersList.innerHTML = "";
        // update members
        data.members.forEach(member => {
            let item = `<li class="collection-item">
                            ${member}
                        </li>`

            membersList.innerHTML += item;
        })
    });

    // Broadcast msg to all connected clients
    socket.on('json', msg => {
        let bubble = `<div class='card-panel chat-bubble cyan lighten-4'>
                                ${msg.text}
                                <span class='chat-bubble-author'>${msg.date}~${msg.user}</span>
                            </div>`
                
        chatbox.innerHTML += bubble;
    })

    // add new chatroom to the list
    socket.on('add room', data => {
        let chatroom = `<li class='chatroom'><a class="waves-effect">${data.room}</a></li>`
        // add to the list
        chatroomList.innerHTML += chatroom;
    })

    // =================
    // === Start App ===
    // =================

    // Look for username - open modal
    if (!localStorage.getItem('username')) 
        uModal.open();
    else
        usernameNavbar.innerHTML = localStorage.getItem('username');

    // lookup chatroom when app opened/refreshed
    if (localStorage.getItem('chatroom')) {
        document.querySelector('#nav-chatroom').innerHTML = localStorage.getItem('chatroom');
        // join chatroom
        joinChatroom(localStorage.getItem('chatroom'), localStorage.getItem('username'));
    }
    

    
    // === Setup Event Listeners ====

    // when pressing enter - Username Modal
    document.querySelector('#usernameInput').onkeyup = setUsername;
    // pressing save button - Username Modal
    document.querySelector('#saveUsernameBtn').onclick = setUsername;
    // attach event to list of chatrooms 
    document.querySelector('#slide-out').onclick = changeChatroom;
    // form adding new Chatroom
    document.querySelector('#chatroomForm').onclick = addChatroom;
})

