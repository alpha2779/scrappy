# app/models/user.py
from flask_login import UserMixin
from .init import db
from werkzeug.security import generate_password_hash, check_password_hash
from .website import Website


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    password = db.Column(db.String(80), nullable=False)
    date_created = db.Column(db.DateTime, nullable=False, default=db.func.current())
    last_login = db.Column(db.DateTime)
    websites = db.relationship('Website', backref='user', lazy=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    @classmethod
    def create(cls, username, email, password):
        user = cls(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @classmethod
    def get_by_id(cls, user_id):
        return cls.query.get(user_id)
    
    @classmethod
    def get_username_by_id(cls, user_id):
        user = cls.query.get(user_id)
        return user.username if user else None

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()