document.addEventListener('DOMContentLoaded', () => {
    // Handlers
    const usernameInput = document.querySelector('#usernameInput');
    const usernameNavbar = document.querySelector('.brand-logo');
    const membersList = document.querySelector('#members');
    const chatbox = document.querySelector('.chat-messages');
    const msgForm = document.querySelector('#msgForm');
    const chatroomInput = document.querySelector('#chatroomInput');
    const chatroomList = document.querySelector('#slide-out div');
    
    const notificationSound = document.querySelector('#notificationSound');

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
                        chatroom = `<li class='chatroom'><a class="waves-effect cyan lighten-1" >${room}</a></li>`;
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
                // change username if assigned to a room
                if (localStorage.getItem('username') && localStorage.getItem('chatroom')) {
                    let data = {
                        'chatroom': localStorage.getItem('chatroom'),
                        'old': localStorage.getItem('username'),
                        'new': usernameInput.value
                    }
                    // emit change
                    socket.emit('change username', data);
                }
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
        // When connected attach listener to messaging form
        msgForm.onsubmit = () => {
            // prevent sending empty msg
            if (document.querySelector('#chatInput').value.length > 0) {

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
            }
            
            // prevent form from submitting
            return false;
        }
    });

    socket.on('on_chatroom_change', data => {
        
        // fetch whole conversation, add if chatbox is empty
        if (data.messages) {
            data.messages.forEach(msg => {
                let customStyle = msg.user === localStorage.getItem('username') ? 'cyan lighten-2 msg-user' : 'cyan lighten-4' ;

                let bubble = `<div 
                                class='tooltipped card-panel chat-bubble ${customStyle}'
                                data-position="top" 
                                data-tooltip="${msg.date}"
                                >
                                ${msg.text}
                                <span class='chat-bubble-author'>~${msg.user}</span>
                            </div>`
                
                chatbox.innerHTML += bubble;
            })

            // place chatroom name on the navbar
            document.querySelector('#nav-chatroom').innerHTML = data.room;
            // save it into localStorage
            localStorage.setItem('chatroom', data.room);

            // scroll div to the bottom
            chatbox.scrollTop = chatbox.scrollHeight;
        }

        // append info about user action
        let notify = `<div>${data.msg}</div>`;
        chatbox.innerHTML += notify;
        
        // clear list of members
        membersList.innerHTML = "";
        // update members
        data.members.forEach(member => {
            let item = `<li class="collection-item">
                            ${member.name}
                        </li>`

            membersList.innerHTML += item;
        })

        var tip = document.querySelectorAll('.tooltipped');
        var tooltip = M.Tooltip.init(tip);
    });

    // Broadcast msg to all connected clients
    socket.on('json', msg => {
        // remove tooltip funcionality, adding after new msg appended (boxes were not disappearing)
        document.querySelectorAll('.tooltipped').forEach(tool => {
            M.Tooltip.getInstance(tool).destroy();
        })

        let customStyle = msg.user === localStorage.getItem('username') ? 'cyan lighten-2 msg-user' : 'cyan lighten-4' ;
        
        let bubble = `<div 
                        class='tooltipped card-panel chat-bubble ${customStyle}'
                        data-position="top" 
                        data-tooltip="${msg.date}"
                        >
                            ${msg.text}
                            <span class='chat-bubble-author'>~${msg.user}</span>
                        </div>`

        chatbox.innerHTML += bubble;
        // scroll div to the bottom
        chatbox.scrollTop = chatbox.scrollHeight;

        let tip = document.querySelectorAll('.tooltipped');
        let tooltip = M.Tooltip.init(tip);
        
        // audio notification for others
        if (msg.user !== localStorage.getItem('username')) notificationSound.play();

    })
    

    // add new chatroom to the list
    socket.on('add room', data => {
        let chatroom = `<li class='chatroom'><a class="waves-effect">${data.room}</a></li>`
        // add to the list
        chatroomList.innerHTML += chatroom;
    })

    // change username of user
    socket.on('change username', data => {
        // clear list of members
        membersList.innerHTML = "";
        // refresh members
        data.members.forEach(member => {
            let item = `<li class="collection-item">
                            ${member.name}
                        </li>`

            membersList.innerHTML += item;
        })
    })

    // username already exists
    socket.on('username exists', () => {
        console.log('This Username already exists ! change username and refresh the site');

        // hide possibility to change room
        document.querySelector('#nav-mobile').style.display = 'none';

        // show information about existing username: change username + refresh site
        document.querySelector('main').innerHTML = 
                                        `<div class="row">
                                            <div class="col s6 m6" style="margin:auto">
                                                <div class="card red darken-4">
                                                    <div class="card-content white-text">
                                                        <span class="card-title">An Error Occured</span>
                                                        <p>
                                                            Whether:
                                                            <ul>
                                                                <li>-Username already exists. Please change username and refresh the site</li>
                                                                <li>-Application is already opened in another tab</li>
                                                            </ul>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        `
                                        
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

