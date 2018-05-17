import os

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

chatrooms = {
    "Testing": [],
    "Second": []
}

users = {
    "0": { "username": "Kuba", "chatrooms": [] },
    "1": { "username": "user", "chatrooms": [] }
}


@app.route('/')
def index():
    return render_template('index.html', chatrooms=chatrooms)


@socketio.on('send msg')
def message(data):
    chatroom = data['chatroom']
    # update global variable
    chatrooms[chatroom].append({ 'text': data['text'], 'author': data['author'], 'date': data['date'] })
    emit('announce msg', data, broadcast=True)


@app.route('/api/conversation', methods=['POST'])
def get_conversation():
    
    chatroom = request.form.get('chatroom')

    conversation = chatrooms[chatroom]

    return jsonify({"success": True, "conversation": conversation})


if __name__ == "__main__":
    app.run(debug=True)