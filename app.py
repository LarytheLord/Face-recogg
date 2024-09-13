from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)

# Load the pre-trained face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Initialize face recognizer
recognizer = cv2.face.LBPHFaceRecognizer_create()

# In a real application, you'd load a trained model here
# recognizer.read('trained_model.yml')

# Dummy database of known faces (In a real app, this would be in a database)
known_faces = {
    1: "Alice",
    2: "Bob",
    3: "Charlie"
}

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
    # name = known_faces.get(label, "Unknown")
    
    # For this example, we'll randomly assign a name or "Unknown"
    import random
    if random.random() < 0.7:  # 70% chance of recognition
        name = random.choice(list(known_faces.values()))
    else:
        name = "Unknown"
    
    return jsonify({"result": name})

if __name__ == '__main__':
    app.run(debug=True)