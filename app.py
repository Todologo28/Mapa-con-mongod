from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)

# Conexión a la base de datos MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['PanamaAlert']
pings_collection = db['pings']

@app.route('/')
def index():
    return render_template('map.html')

@app.route('/get_pings', methods=['GET'])
def get_pings():
    try:
        pings = []
        for ping in pings_collection.find():
            ping['_id'] = str(ping['_id'])
            pings.append(ping)
        return jsonify(pings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_ping', methods=['POST'])
def add_ping():
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lng = float(data.get('lng'))
        info = data.get('info', '')

        if not all([lat, lng]):
            return jsonify({"error": "Latitud y longitud son obligatorias"}), 400

        ping = {
            'lat': lat,
            'lng': lng,
            'info': info
        }

        result = pings_collection.insert_one(ping)
        return jsonify({
            'success': True,
            'id': str(result.inserted_id),
            'ping': {
                'lat': lat,
                'lng': lng,
                'info': info
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete_ping/<ping_id>', methods=['DELETE'])
def delete_ping(ping_id):
    try:
        result = pings_collection.delete_one({'_id': ObjectId(ping_id)})
        return jsonify({
            'success': result.deleted_count > 0
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/update_ping/<ping_id>', methods=['PUT'])
def update_ping(ping_id):
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lng = float(data.get('lng'))
        info = data.get('info', '')
        if not all([lat, lng]):
            return jsonify({"error": "Latitud y longitud son obligatorias"}), 400

        result = pings_collection.update_one(
            {'_id': ObjectId(ping_id)},
            {'$set': {
                'lat': lat,
                'lng': lng,
                'info': info
            }}
        )
        return jsonify({'success': result.modified_count > 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
