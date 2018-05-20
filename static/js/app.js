
// When DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    
    let usernameNavbar = document.querySelector('.brand-logo');
    const usernameInput = document.querySelector('#usernameInput'); 
    const chatInput = document.querySelector('#chatInput');
    const msgForm = document.querySelector('#msgForm');
    
    // Function
    const handleUsername = (username, id) => {
        const request = new XMLHttpRequest();
        request.open('POST', '/api/username');
        // Callback func when request copletes
        request.onload = () => {
            // Extract JSON data from request
            const data = JSON.parse(request.responseText);

            if (data.success) {
                console.log('ID:', data.id);
                // save ID in localStorage
                localStorage.setItem('id', data.id);
                
                // change username on page
                usernameNavbar.innerHTML = usernameInput.value;
                // save username in localStorage
                localStorage.setItem('username', usernameInput.value);
                // clear input field
                usernameInput.value = '';

                // close modal
                M.Modal.getInstance(usernameModal).close();

            }
            else {
                alert('That Username already exists, choose different one');
                
            }
        }

        const data = new FormData();
        data.append('username', username);
        data.append('id', id)
        // send request
        request.send(data);
    }


    // init username modal
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        dismissible: false,
        onOpenEnd: () => {
            usernameInput.value = usernameNavbar.textContent;
            usernameInput.focus();
        },
    };
    
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // init chatrooms sidenav
    const sideNav = document.querySelector('.sidenav');
    const sideN = M.Sidenav.init(sideNav);


    // ------ SET USERNAME -------
    // show modal if there is no username
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
                let proceed = true;
                console.log(proceed)


                // create new user on server
                if (!localStorage.getItem('username')) {
                    console.log('create new user- AJAX');
                    handleUsername(usernameInput.value, 'None');
                    console.log(proceed);
                } else if (localStorage.getItem('username') != usernameInput.value) {
                    console.log('update username');
                    handleUsername(usernameInput.value, localStorage.getItem('id'));
                    console.log(proceed);
                }
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
                
                // clear members list
                document.querySelector('#members').innerHTML = "";
                // show list of joined users
                data.members.forEach(user => {
                    const li = 
                        `<li class="collection-item avatar">
                            <i class="material-icons circle">person</i>
                            <p>${user}</p>
                        </li>`;
                    
                    document.querySelector('#members').innerHTML += li;

                })

                // send to socket username of joined
                socket.send("User has joined");
            }
            else {
                alert('Something went wrong :(')
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
        data.append('userID', localStorage.getItem('id'));
        // send request
        request.send(data);

    }
    
    // -------END FUNCTIONS---------

    // ------ OPEN/REFRESH PAGE: PULL conversation from API if saved chatroom ------
    if (localStorage.getItem('chatroom')){
        // AJAX request for pulling all messages for that chatroom - function
        pullConversation(localStorage.getItem('chatroom'));
        // show `main` section of the page
        document.querySelector('main').style.visibility = "visible";

        // TODO: pull all users that are currently in this chatroom

    } else {
        document.querySelector('#nav-chatroom').innerHTML = "Choose Chatroom";
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

            // TODO: PULL USERS that joined conversation

            // set navbar chatroom name
            document.querySelector('#nav-chatroom').innerHTML = e.target.textContent;

            // show `main` section of the page
            document.querySelector('main').style.visibility = "visible";

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
            
            // prevent sending msg without selected chatroom and setting username
            if (!localStorage.getItem('chatroom') || !localStorage.getItem('username')) {
                alert('Username not set or Chatroom not choosen');
                return false;
            }

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

    
    socket.on('refresh members', data => {
        console.log('REFRESHHH');
    })

  });






