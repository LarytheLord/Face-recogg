from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Load the pre-trained face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize face recognizer
recognizer = cv2.face.LBPHFaceRecognizer_create()

# In a real application, you'd load a trained model here
# recognizer.read('trained_model.yml')

# Database setup
def init_db():
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS students
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  standard TEXT NOT NULL,
                  age INTEGER NOT NULL,
                  roll_no TEXT NOT NULL UNIQUE,
                  image_3d BLOB)''')
    c.execute('''CREATE TABLE IF NOT EXISTS attendance
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  student_id INTEGER,
                  date TEXT NOT NULL,
                  present BOOLEAN NOT NULL,
                  FOREIGN KEY (student_id) REFERENCES students (id))''')
    conn.commit()
    conn.close()

init_db()

@app.route('/recognize', methods=['POST'])
def recognize_face():
    # Get the image data from the request
    image_data = request.json['image']
    
    # Decode the base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    if len(faces) == 0:
        return jsonify({"result": "No face detected"})
    
    # For simplicity, we'll just use the first detected face
    (x, y, w, h) = faces[0]
    
    # In a real application, you'd use the recognizer here
    # label, confidence = recognizer.predict(gray[y:y+h, x:x+w])
    # student_id = label
    
    # For this example, we'll randomly select a student from the database
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute("SELECT id, name, standard, age, roll_no FROM students ORDER BY RANDOM() LIMIT 1")
    student = c.fetchone()
    
    if student:
        student_id, name, standard, age, roll_no = student
        # Mark attendance
        today = datetime.now().strftime('%Y-%m-%d')
        c.execute("INSERT INTO attendance (student_id, date, present) VALUES (?, ?, ?)",
                  (student_id, today, True))
        conn.commit()
        result = {
            "result": "Recognized",
            "name": name,
            "standard": standard,
            "age": age,
            "roll_no": roll_no
        }
    else:
        result = {"result": "Unknown"}
    
    conn.close()
    return jsonify(result)

@app.route('/add_student', methods=['POST'])
def add_student():
    data = request.json
    name = data['name']
    standard = data['standard']
    age = data['age']
    roll_no = data['roll_no']
    image_3d = data.get('image_3d')  # This would be a base64 encoded string of the 3D image file
    
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO students (name, standard, age, roll_no, image_3d) VALUES (?, ?, ?, ?, ?)",
                  (name, standard, age, roll_no, image_3d))
        conn.commit()
        result = {"success": True, "message": "Student added successfully"}
    except sqlite3.IntegrityError:
        result = {"success": False, "message": "Roll number already exists"}
    finally:
        conn.close()
    
    return jsonify(result)

@app.route('/get_students', methods=['GET'])
def get_students():
    conn = sqlite3.connect('attendance.db')
    c = conn.cursor()
    c.execute("SELECT id, name, standard, age, roll_no FROM students")
    students = [{"id": row[0], "name": row[1], "standard": row[2], "age": row[3], "roll_no": row[4]} for row in c.fetchall()]
    conn.close()
    return jsonify(students)

if __name__ == '__main__':
    app.run(debug=True)
