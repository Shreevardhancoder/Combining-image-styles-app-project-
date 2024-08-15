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

app = Flask(__name__)

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

@app.route('/processimage', methods=['POST'])
def stylize_image():
    # Get content image and style image files from the request
    # content_image_file = request.files['content_image']
    # style_image_file = request.files['style_image']
    content_image_file = request.files['./assests/dog.jpeg']
    style_image_file = request.files['./assests/starry_night.jpeg']

    # Load content image
    content_img = tf.image.decode_image(content_image_file.read(), channels=3)
    content_img = tf.image.convert_image_dtype(content_img, tf.float32)
    content_img = tf.image.resize(content_img, (512, 512))[tf.newaxis, :]

    # Load style image
    style_img = tf.image.decode_image(style_image_file.read(), channels=3)
    style_img = tf.image.convert_image_dtype(style_img, tf.float32)
    style_img = tf.image.resize(style_img, (512, 512))[tf.newaxis, :]

    # Load style transfer model
    hub_model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')

    # Stylize the content image with the style image
    stylized_image = hub_model(tf.constant(content_img), tf.constant(style_img))[0]

    # Convert the stylized image tensor to a PIL image
    stylized_pil_image = tensor_to_image(stylized_image)

    # Convert the PIL image to base64
    buffered = io.BytesIO()
    stylized_pil_image.save(buffered, format="PNG")
    base64_image = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # Return the base64-encoded image
    return jsonify({"base64_image": base64_image})

if __name__ == '__main__':
    app.run(debug=True)
