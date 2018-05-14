import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
socketio = SocketIO(app)


@app.route('/')
def index():
    return render_template('index.html')




if __name__ == "__main__":
    app.run()