import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

COUNTER = 0
CHATROOMS = {
    "Testing": [],
    "Second": []
}
USERS = {}


@app.route('/')
def index():
    return render_template('index.html', chatrooms=CHATROOMS)


@socketio.on('send msg')
def message(data):
    chatroom = data['chatroom']
    # update global variable
    CHATROOMS[chatroom].append({ 'text': data['text'], 'author': data['author'], 'date': data['date'] })
    emit('announce msg', data, broadcast=True)


@app.route('/api/conversation', methods=['POST'])
def get_conversation():
    """Fetch all messages for particular chatroom"""
    chatroom = request.form.get('chatroom')

    conversation = CHATROOMS[chatroom]

    return jsonify({'success': True, 'conversation': conversation})


@app.route('/api/username', methods=['POST'])
def new_user():
    """Create a new user and save in server-side memory"""
    global COUNTER
    global USERS

    username = request.form.get('username')
    id = request.form.get('id')

    # username already exists - return info back
    for user in USERS:
        if USERS[user]['username'] == username:
            return jsonify({'success': False})
    
    # keep user id for passing back
    user_id = COUNTER
    # create a new user
    if id == 'None':
        USERS[user_id] = {'username': username, 'chatroom': ''}
        # increase counter for next user
        COUNTER += 1
    # Update username
    else:
        print('Update existing username', id)
        USERS[int(id)]['username'] = username

    
    print(USERS)
    # return user id for saving into localStorage
    return jsonify({'success': True, 'id': user_id})


# API for updating the username


if __name__ == "__main__":
    app.run(debug=True)