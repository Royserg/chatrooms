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


@socketio.on('send msg')
def send_msg(data):
    room = data['chatroom']
    msg = {
        'user': data['user'],
        'text': data['text'],
        'date': data['date']
    }

    # Add msg to global variable
    CHATROOMS[room]['messages'].append(msg)

    send(msg, room=room, json=True)




if __name__ == "__main__":
    app.config["DEBUG"] = True
    socketio.run(app)