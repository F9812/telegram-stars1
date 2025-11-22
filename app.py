# app.py

from flask import Flask, render_template, request, jsonify
from database import Database
import random

app = Flask(__name__)
db = Database()

@app.route('/')
def index():
    user_id = 1  # Для теста можно использовать фиксированный ID пользователя
    user_data = db.get_user_data(user_id)
    return render_template('index.html', user_data=user_data)

@app.route('/get_balance', methods=['GET'])
def get_balance():
    user_id = request.args.get('user_id', type=int)
    user_data = db.get_user_data(user_id)
    return jsonify({"balance": user_data["balance"]})

@app.route('/open_case', methods=['POST'])
def open_case():
    user_id = request.json['user_id']
    case_price = request.json['case_price']
    user_data = db.get_user_data(user_id)

    if user_data['balance'] < case_price:
        return jsonify({"error": "Недостаточно средств!"})

    # Вычитание стоимости кейса
    user_data['balance'] -= case_price
    db.update_user_data(user_id, user_data)

    # Генерация приза
    prize = generate_prize(case_price)

    return jsonify({"prize": prize, "balance": user_data['balance']})

def generate_prize(case_price):
    rewards = {
        1: [("Звезды", 2), ("Звезды", 3), ("Звезды", 4)],
        15: [("Медвежонок", 15), ("Сердечко", 15), ("Подарок", 25)],
        25: [("Торт", 50), ("Ракета", 50), ("Алмаз", 100)]
    }

    case_rewards = rewards.get(case_price, [])
    if not case_rewards:
        return "Ошибка: Призы для этого кейса не настроены."

    return random.choice(case_rewards)

if __name__ == "__main__":
    app.run(debug=True)

