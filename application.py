import os
import eventlet

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, send
from flask_socketio import join_room, leave_room

eventlet.monkey_patch()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

COUNTER = 0
CHATROOMS = {
    "Testing": {
        "users": [],
        "messages": [{"user": "Jakub", "text": "hello,world", "date": "2018-05-13"}]
    },
    "Second": {
        "users": [],
        "messages": []
    }
}



@app.route('/')
def index():
    """Show Index Page"""
    return render_template('index.html')


@app.route('/api/chatrooms', methods=['GET'])
def chatrooms():
    """Send back list of available Chatrooms"""
    chatrooms = []

    for room in CHATROOMS.keys():
        chatrooms.append(room)

    return jsonify(chatrooms)


@socketio.on('join')
def join(data):
    """Join chatroom"""
    room = data['chatroom']
    user = data['user']
    
    # Add user to memory
    if user not in CHATROOMS[room]['users']:
        CHATROOMS[room]['users'].append(user)

    # add user to the room
    join_room(room)

    data = {
        "msg": user + ' has joined',
        "members": CHATROOMS[room]['users'],
        "messages": CHATROOMS[room]['messages']
    }
    emit('on_chatroom_change', data, room=room)


@socketio.on('leave')
def leave(data):
    room = data['chatroom']
    user = data['user']

    # Remove user from memory
    if user in CHATROOMS[room]['users']:
        CHATROOMS[room]['users'].remove(user)
    
    # remove user from the room
    leave_room(room)

    data = {
        "msg": user + ' has left',
        "members": CHATROOMS[room]['users']
    }
    emit('on_chatroom_change', data, room=room)



# @socketio.on('send msg')
# def message(data):
#     chatroom = data['chatroom']
#     # update global variable
#     CHATROOMS[chatroom].append({ 'text': data['text'], 'author': data['author'], 'date': data['date'] })
#     emit('announce msg', data, broadcast=True)


# @socketio.on('message')
# def handle_user_join(user):
#     print("User", user)
#     send(user, broadcast=True)


# @app.route('/api/conversation', methods=['POST'])
# def get_conversation():
#     """Fetch all messages for particular chatroom"""
#     chatroom = request.form.get('chatroom')
#     id = request.form.get('userID')

#     # add user to that chatroom
#     USERS[int(id)]['chatroom'] = chatroom
    
#     # get all messages from chatroom
#     conversation = CHATROOMS[chatroom]
    
#     members = []

#     for user in USERS:
#         if USERS[user]['chatroom'] == chatroom:
#             members.append(USERS[user]['username'])
    
#     # TODO: emit 'refresh members' so others will see on all rooms when somebody change
#     socketio.on_event('refresh members', members, namespace='/test')

#     return jsonify({'success': True, 'conversation': conversation, "members": members})


# @app.route('/api/username', methods=['POST'])
# def new_user():
#     """Create a new user and save in server-side memory"""
#     global COUNTER
#     global USERS

#     username = request.form.get('username')
#     id = request.form.get('id')

#     # username already exists - return info back
#     for user in USERS:
#         if USERS[user]['username'] == username:
#             return jsonify({'success': False})
    
#     # keep user id for passing back
#     user_id = COUNTER
#     # create a new user
#     if id == 'None':
#         USERS[user_id] = {'username': username, 'chatroom': ''}
#         # increase counter for next user
#         COUNTER += 1
#     # Update username
#     else:
#         print('Update existing username', id)
#         USERS[int(id)]['username'] = username

    
#     print(USERS)
#     # return user id for saving into localStorage
#     return jsonify({'success': True, 'id': user_id})


# API for updating the username


if __name__ == "__main__":
    app.config["DEBUG"] = True
    socketio.run(app)
    # app.run(debug=True)