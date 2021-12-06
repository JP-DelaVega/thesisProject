from flask import Flask, render_template, request, abort
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant, ChatGrant
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

app = Flask(__name__)

twilio_account_sid = "AC2c3f739d8e58f6de0efe536313b9b2fa"
twilio_api_key_sid = "SKa82e9f5ab28e00c2c05ec3409408721b"
twilio_api_key_secret = "tpJ7eiy8o0U6EM99hOHzOUyItBBhLDOT"
twilio_client = Client(twilio_api_key_sid, twilio_api_key_secret,
                       twilio_account_sid)


def get_chatroom(name):
    for conversation in twilio_client.conversations.conversations.stream():
        if conversation.friendly_name == name:
            return conversation

    # a conversation with the given name does not exist ==> create a new one
    return twilio_client.conversations.conversations.create(friendly_name=name)


@app.route("/")
def index():
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    username = request.get_json(force=True).get('username')
    if not username:
        abort(401)

    conversation = get_chatroom('My Room')
    try:
        conversation.participants.create(identity=username)
    except TwilioRestException as exc:
        # do not error if the user is already in the conversation
        if exc.status != 409:
            raise

    token = AccessToken(twilio_account_sid,
                        twilio_api_key_sid,
                        twilio_api_key_secret,
                        identity=username)
    token.add_grant(VideoGrant(room='My Room'))
    token.add_grant(ChatGrant(service_sid=conversation.chat_service_sid))

    return {
        'token': token.to_jwt().decode(),
        'conversation_sid': conversation.sid
    }


if __name__ == '__main__':
    app.run(host='0.0.0.0')