import os

# Base Directories
APP_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(APP_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)

# Run time directories
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
OUTPUT_DIR = os.path.join(BACKEND_DIR, "output")

# AI Settings
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
