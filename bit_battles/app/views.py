from bit_battles.challenges.models import DailyChallengeStatistic, Challenge
from bit_battles.battles.models import BattleStatistic
from bit_battles.auth.models import User
from bit_battles.extensions import db

from collections import defaultdict
from flask_login import login_required, current_user
from flask import Blueprint, render_template, redirect


app_blueprint = Blueprint("app", __name__, url_prefix="/app")


@app_blueprint.get("/editor")
def editor():
    return render_template("app/editor.html")


@app_blueprint.get("/user/<string:username>")
@login_required
def profile(username: str):
    if username == current_user.username:
        user = current_user
    else:
        user = User.query.filter(
            db.func.lower(User.username) == username.lower() # type: ignore
        ).first()

    if not user:
        return redirect(f"/app/user/{current_user.username}")

    battle_statistics = defaultdict(list)
        
    for battle in BattleStatistic.query.filter_by(user_id=user.id).order_by(
        BattleStatistic.creation_timestamp.desc() # type: ignore
        ).all():
        name = battle.battle_type.split("-")
        battle_statistics[f"Inputs: {name[0]} Outputs: {name[1]} Gates: {name[2].replace(',', ', ')}"].append(battle.serialize())

    return render_template(
        "app/user.html", 
        user=user, 
        streak=DailyChallengeStatistic.get_streak(user.id), 
        statistics=battle_statistics
    )


@app_blueprint.get("/user/<string:username>/challenges")
@login_required
def challenges(username: str):
    if username == current_user.username:
        user = current_user
    else:
        user = User.query.filter(
            db.func.lower(User.username) == username.lower() # type: ignore
        ).first()

    if not user:
        return redirect(f"/app/user/{current_user.username}")

    return render_template(
        "app/challenges.html", 
        user=user, 
        challenges=[challenge.list_serialize(True) for challenge in Challenge.query.filter_by(user_id=user.id).all()]
    )
