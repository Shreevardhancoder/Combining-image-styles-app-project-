from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from flask import Flask, request, jsonify
from bcrypt import gensalt, hashpw,checkpw
from dotenv import load_dotenv
from flask_cors import CORS
import io
from flask import Flask, request, jsonify, send_file
import os
import tensorflow as tf
import numpy as np
import PIL.Image
import matplotlib.pyplot as plt
import matplotlib as mpl
import tensorflow_hub as hub
import base64
from PIL import Image
import asyncio
import time 
load_dotenv()

mongoURI = "mongodb+srv://rohan182004:rohan098@sportsapi.g4gt9hs.mongodb.net/?retryWrites=true&w=majority&appName=sportsapi"
app = Flask(__name__)
CORS(app)
dbDetails = None
dbUserDetails = None  # Corrected variable name

def dbConnect():
    global client, dbDetails, dbUserDetails
    
    try:
        client = MongoClient(mongoURI)
        dbDetails = client.NeuralStyleTransfer
        dbUserDetails = dbDetails.Userdetails
        print("Successfully connected to the database!")
    except ConnectionFailure as e:
        print({"Connection Error": e})

dbConnect()

@app.route('/signup', methods=["POST"])
def signup():
    print("On signup page")
    if request.method == 'POST':
        credentials = request.json
        username = credentials["username"]
        pwd = credentials["password"]
        salt = gensalt()
        hashedPwd = hashpw(pwd.encode('utf-8'), salt)
        email = credentials["email"]
        mobileNo = credentials["mobile_no"]
        authCreds = {"username": username, "password": hashedPwd, "email": email, "mobile_no": mobileNo}

    existing_user = dbUserDetails.find_one({"$or": [{"username": username}, {"email": email}, {"mobile_no": mobileNo}]})
    if existing_user:
        return jsonify({"error": "Username, email, or mobile number already exists"}), 400

    result = dbUserDetails.insert_one(authCreds)
    user_id = result.inserted_id
    invCreds = {"items": [], "user_id": user_id}

    dbUserDetails.insert_one(invCreds)

    return jsonify({"message": "User created successfully"}), 201





@app.route('/Login', methods=["POST"])
def Login():
    print("On login page")
    if request.method == "POST":
        credentials = request.json
        username = credentials["username"]
        pwd = credentials["password"]

        user = dbUserDetails.find_one({"username": username})
        if user:
            print("userfound")
            user_id = user["_id"]
        else:
            return jsonify({"error":"User not found","user_id":""}), 404
        if user:
            userPwd = user["password"]
            if checkpw(pwd.encode('utf-8'),userPwd):

                return jsonify({"message": "Login successful",
                                "user_id":str(user_id)
                                }), 200
            else:
                return jsonify({"error": "Incorrect password"}), 401
        else:
            return jsonify({"error": "User not found"}), 404






os.environ['TFHUB_MODEL_LOAD_FORMAT'] = 'COMPRESSED'
mpl.rcParams['figure.figsize'] = (12, 12)
mpl.rcParams['axes.grid'] = False

def tensor_to_image(tensor):
    tensor = tensor * 255
    tensor = np.array(tensor, dtype=np.uint8)
    if np.ndim(tensor) > 3:
        assert tensor.shape[0] == 1
        tensor = tensor[0]
    return PIL.Image.fromarray(tensor)



import os

# @app.route('/processimage', methods=['POST'])
# def stylize_image():
#     if request.method == "POST":
#         content_image_path = "./assets/dog.jpg"
#         style_image_path = "./assets/starry_night.jpg"

#         # Load content image
#         content_img = tf.image.decode_image(tf.io.read_file(content_image_path), channels=3)
#         content_img = tf.image.convert_image_dtype(content_img, tf.float32)
#         content_img = tf.image.resize(content_img, (512, 512))[tf.newaxis, :]

#         # Load style image
#         style_img = tf.image.decode_image(tf.io.read_file(style_image_path), channels=3)
#         style_img = tf.image.convert_image_dtype(style_img, tf.float32)
#         style_img = tf.image.resize(style_img, (512, 512))[tf.newaxis, :]

#         # Load style transfer model
#         hub_model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')

#         # Stylize the content image with the style image
#         stylized_image = hub_model(tf.constant(content_img), tf.constant(style_img))[0]

#         # Convert the stylized image tensor to a PIL image
#         stylized_pil_image = tensor_to_image(stylized_image)

#         # Convert the stylized image to base64-encoded string
#         buffered = io.BytesIO()
#         stylized_pil_image.save(buffered, format="PNG")
#         base64_image = base64.b64encode(buffered.getvalue()).decode("utf-8")

#         # Return the base64-encoded stylized image in the response
#         return jsonify({"stylized_image": base64_image})
def tensor_to_image(tensor):
    # Convert tensor to NumPy array
    tensor = tensor * 255
    tensor = np.array(tensor, dtype=np.uint8)
    
    # If tensor has more than 3 dimensions and the first dimension is 1, remove it
    if np.ndim(tensor) > 3 and tensor.shape[0] == 1:
        tensor = tensor[0]
    
    # Create PIL Image from NumPy array
    image = PIL.Image.fromarray(tensor)
    return image

@app.route('/processimage', methods=['POST'])
def stylize_images():
    if request.method == 'POST':
        try:
            print("in function")
            # Load style transfer model
            hub_model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')
            
            # Get the JSON data containing the images
            image_data_array = request.json
            
            # Ensure there are exactly two images
            if len(image_data_array) != 2:
                return jsonify({"error": "Exactly two images are required."}), 400
            print("before image")
            # Load the content image
            content_image_data = image_data_array[0]
            content_base64_data = content_image_data['image']
            print("hi" ,content_base64_data)
            content_bytes = base64.b64decode(content_base64_data)
            content_img = tf.image.decode_image(content_bytes, channels=3)
            content_img = tf.image.convert_image_dtype(content_img, tf.float32)
            content_img = tf.image.resize(content_img, (256, 256))[tf.newaxis, :]
            print(content_img)
            # content_image_bytes = base64.b64decode(content_base64_data)
            # print(content_image_bytes)
            # content_image = Image.open(io.BytesIO(content_image_bytes))
            # print(content_image)
            # content_image = content_image.resize((256, 256))
            # print(content_image)
            # content_image_np = tf.keras.preprocessing.image.img_to_array(content_image) / 255.0
            # print(content_image_np)
            print("one image done")
            # Load the style image
            style_image_data = image_data_array[1]
            style_base64_data = style_image_data['image']
            style_bytes = base64.b64decode(style_base64_data)
            style_img = tf.image.decode_image(style_bytes, channels=3)
            style_img = tf.image.convert_image_dtype(style_img, tf.float32)
            style_img = tf.image.resize(style_img, (512, 512))[tf.newaxis, :]
            print(style_img)
            # style_image_bytes = base64.b64decode(style_base64_data)
            # style_image = Image.open(io.BytesIO(style_image_bytes))
            # style_image = style_image.resize((256, 256))
            # style_image_np = tf.keras.preprocessing.image.img_to_array(style_image) / 255.0
            print("second image done")
            # Stylize the content image with the style image
            stylized_image = hub_model(tf.constant(content_img), tf.constant(style_img))
            print('check')
            print(stylized_image)
            stylized_image_tensor = stylized_image[0]  # Extracting the tensor from the list
            stylized_image_np = np.array(stylized_image_tensor)  # Convert to NumPy array
            stylized_image_np = np.clip(stylized_image_np * 255, 0, 255).astype(np.uint8)  # Ensure values are in range [0, 255]

# Assuming the tensor shape is (1, height, width, channels), you may need to remove the first dimension
            stylized_image_np = np.squeeze(stylized_image_np, axis=0)

# Create a PIL image from the NumPy array
            pil_stylized_image = PIL.Image.fromarray(stylized_image_np)

            image_buffer = io.BytesIO()
    # Save the PIL image to the bytes buffer in JPEG format
            pil_stylized_image.save(image_buffer, format='JPEG')
    # Encode the image data in the buffer as base64
            base64_str = base64.b64encode(image_buffer.getvalue()).decode('utf-8')
# Now you can save the image or display it as needed
            pil_stylized_image.save("hello1_image.jpg")
    #         time.sleep(1)
    #         with open('hello1_image.jpg', "rb") as img_file:
    # #     # Read the image file as bytes
    #             img_bytes = img_file.read()
        
    # # Encode the image bytes as base64 string
            # base64_str = base64.b64encode(img_bytes).decode('utf-8')
            # print(base64_str)

            # os.remove('hello1_image.jpg')
            buffered = io.BytesIO()
            pil_stylized_image.save(buffered, format="JPEG")
            base64_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
            # Return the base64-encoded stylized image in the response
            return jsonify({"stylized_image": base64_str})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

