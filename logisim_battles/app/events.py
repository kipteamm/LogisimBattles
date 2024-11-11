from logisim_battles.auth.models import User
from logisim_battles.app.models import Player

from flask_socketio import SocketIO, join_room

import typing as t


def register_events(socketio: SocketIO):
    @socketio.on('join')
    def join(data: dict):
        player: t.Optional[Player] = Player.query.filter_by(battle_id=data["battle_id"], user_id=data["player_id"]).first()
        if not player:
            return
        
        user: t.Optional[User] = User.query.get(player.user_id)
        if not user:
            return

        join_room(player.battle_id)
        socketio.emit("new_player", {"id": user.id, "username": user.username}, room=player.battle_id)