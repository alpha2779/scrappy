from flask import Blueprint, request, redirect, url_for
from models.user import User

user_bp = Blueprint('user', __name__)

# Create a new user
@user_bp.route('/user', methods=['POST'])
def create_user():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    user = User.create(username, email, password)
    return redirect(url_for('index.home'))  # Assuming 'home' function in index.py

# Update an existing user (by ID)
@user_bp.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.get_by_id(user_id)
    if user:
        username = request.form.get('username')
        email = request.form.get('email')
        user.update(username=username, email=email)
    return redirect(url_for('index.home'))

# Delete a user (by ID)
@user_bp.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.get_by_id(user_id)
    if user:
        user.delete()
    return redirect(url_for('index.home'))
