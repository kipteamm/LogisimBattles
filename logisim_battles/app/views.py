from logisim_battles.app.models import Battle, Player
from logisim_battles.extensions import db

from flask_login import login_required, current_user
from flask import Blueprint, render_template, redirect, request, make_response

import typing as t


app_blueprint = Blueprint("app", __name__, url_prefix="/app")


@app_blueprint.route("/battles", methods=["GET", "POST"])
@login_required
def battles():
    if request.method == "GET":
        return render_template("app/battles.html")
    
    player = Player.query.filter_by(user_id=current_user.id).first()
    if player:
        return redirect(f"/app/battle/{player.battle_id}")

    battle_id = request.form["battle_id"]
    battle: t.Optional[Battle] = Battle.query.get(battle_id)

    if not battle:
        return render_template("app/battles.html")
    
    battle.players.append(current_user)
    db.session.commit()

    response = make_response(redirect(f"/app/battle/{battle.id}"))
    response.set_cookie("bt", current_user.set_battle_token())
    return response


@app_blueprint.get("/battle/new/")
@login_required
def new_battle():
    player = Player.query.filter_by(user_id=current_user.id).first()
    if player:
        return redirect(f"/app/battle/{player.battle_id}")

    battle = Battle(current_user.id)

    battle.players.append(current_user)
    db.session.add(battle)
    db.session.commit()

    response = make_response(redirect(f"/app/battle/{battle.id}"))
    response.set_cookie("bt", current_user.set_battle_token())
    return response


@app_blueprint.get("/battle/<string:id>")
@login_required
def battle(id):
    player = Player.query.filter_by(battle_id=id, user_id=current_user.id)
    if not player:
        return redirect("/app/battles")

    battle: t.Optional[Battle] = Battle.query.get(id)
    if not battle:
        return redirect("/app/battles")

    response = make_response(render_template(f"app/{'battle' if battle.started else 'queue'}.html", battle=battle.serialize(), player=current_user.serialize()))
    response.set_cookie("bt", current_user.set_battle_token())
    return response


@app_blueprint.get("/profile")
@login_required
def profile():
    return render_template("app/profile.html")
