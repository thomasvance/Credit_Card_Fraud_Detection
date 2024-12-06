from flask import Flask, render_template, request
from pymongo import MongoClient
import pandas as pd
import folium

# Initialize Flask app
app = Flask(__name__, static_folder='static')

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["Card_fraud_db"]
collection = db["card_users"]

@app.route('/', methods=['GET', 'POST'])
def dashboard():
    # Fetch all unique names for the dropdown
    names = collection.distinct('Person')
    print("Fetched Names:", names)  # Debugging

    # Variables to handle selected person and their details
    selected_person = None
    person_data = None
    map_html = None

    if request.method == 'POST':
        selected_person = request.form.get('person')
        if selected_person:
            # Fetch data for the selected person
            person_data = collection.find_one({'Person': selected_person})

            if person_data:
                # Generate the map
                user_map = folium.Map(
                    location=[person_data['Latitude'], person_data['Longitude']],
                    zoom_start=10
                )
                folium.Marker(
                    location=[person_data['Latitude'], person_data['Longitude']],
                    popup=f"Name: {person_data['Person']}",
                    icon=folium.Icon(color="blue")
                ).add_to(user_map)
                map_html = user_map._repr_html_()


    # If no selection, display a default US map
    if not map_html:
        user_map = folium.Map(location=[37.0902, -95.7129], zoom_start=4)
        map_html = user_map._repr_html_()

    return render_template(
        'index.html',
        names=names,
        selected_person=selected_person,
        person_data=person_data,
        map_html=map_html
    )


if __name__ == '__main__':
    app.run(debug=True)