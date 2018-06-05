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
    "Global": {
        "users": [],
        "messages": []
    },
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
    user_exists = False

    # room doesn't exist - change to global
    if room not in CHATROOMS:
        room = "Global"

    # user is already added to that room
    for member in CHATROOMS[room]['users']:
        if member['name'] == user:
            user_exists = True

    if user_exists:
        # emit info to the user if username already in the room or another tab opened
        emit('username exists', broadcast=False)
    else:
        # add user to users list in the room
        CHATROOMS[room]['users'].append({'id': request.sid, 'name':user})
        # add user to the room
        join_room(room)

        data = {
            "msg": user + ' has joined',
            "members": CHATROOMS[room]['users'],
            "messages": CHATROOMS[room]['messages'],
            "room": room
        }
        # send only to joining user
        emit('on_chatroom_change', data, broadcast=False)
        # send to everybody else without messages
        emit('on_chatroom_change', {"msg": user + ' has joined', "members": CHATROOMS[room]['users']}, room=room, include_self=False)


@socketio.on('leave')
def leave(data):
    room = data['chatroom']
    name = data['user']
    
    for member in CHATROOMS[room]['users']:
        if request.sid == member['id']:
            CHATROOMS[room]['users'].remove({'id': request.sid, 'name': name})

    # remove user from the room
    leave_room(room)

    data = {
        "msg": name + ' has left',
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

    # when 100 msg for particular room, remove first one
    if len(CHATROOMS[room]['messages']) > 99:
        CHATROOMS[room]['messages'].pop(0)

    # Add msg to global variable
    CHATROOMS[room]['messages'].append(msg)

    send(msg, room=room, json=True)


@socketio.on('add room')
def add_room(data):
    room = data['room']

    # add room to variable
    CHATROOMS[room] = {"users": [], "messages": []}

    emit('add room', data, broadcast=True)


@socketio.on('change username')
def change_username(data):
    room = data['chatroom']
    old = data['old']
    new = data['new']
    # get index of user to change
    for user in CHATROOMS[room]['users']:
        if user['name'] == old:
            user['name'] = new

    emit('change username', {'members': CHATROOMS[room]['users'] }, room=room)


@socketio.on('disconnect')
def on_disconnect():

    chatroom = ""
    name = ""

    # find chatroom and name of the user
    for room in CHATROOMS:
        for user in CHATROOMS[room]['users']:
            if user['id'] == request.sid:
                name = user['name']
                chatroom = room
        
    data = {
        'user': name,
        'chatroom': chatroom
        }

    # pass info to leave room
    if name and chatroom:
        leave(data)



if __name__ == "__main__":
    # app.config['DEBUG'] = True
    socketio.run(app)