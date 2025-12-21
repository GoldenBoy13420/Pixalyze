import uuid
import os
import numpy as np

BASE_DIR = "uploads"
os.makedirs(BASE_DIR, exist_ok=True)

def save_image(image_array):
    image_id = str(uuid.uuid4())
    path = os.path.join(BASE_DIR, f"{image_id}.npy")
    np.save(path, image_array)
    return image_id

def load_image(image_id):
    path = os.path.join(BASE_DIR, f"{image_id}.npy")
    if not os.path.exists(path):
        return None
    return np.load(path)

def delete_image(image_id):
    path = os.path.join(BASE_DIR, f"{image_id}.npy")
    if os.path.exists(path):
        os.remove(path)
