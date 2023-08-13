# app/config.py
import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'thisisasecretkey')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'sqlite:///database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
