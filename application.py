import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)

chatrooms = {
    "Testing": [
        {
            "text": "First Message",
            "author": "Jakub",
            "date": "15.05.2018"
        },
        {
            "text": "Hello Test",
            "author": "Dariusz",
            "date": "15.05.2018"
        }
    ],
    "Second": [
        {
            "text": "Second Test",
            "author": "Jakub",
            "date": "16.05.2018"
        }
    ]
}


@app.route('/')
def index():
    return render_template('index.html', chatrooms=chatrooms)


@app.route('/api/<chatroom>', methods=['GET'])
def get_conversation(chatroom):
    return chatroom 


@socketio.on('send msg')
def message(data):
    chatroom = data['chatroom']
    # update global variable
    chatrooms[chatroom].append({ 'text': data['text'], 'author': data['author'], 'date': data['date'] })
    emit('announce msg', data, broadcast=True)



if __name__ == "__main__":
    app.run(debug=True)