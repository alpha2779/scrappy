from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, login_required, logout_user, current_user, LoginManager
from app.models.user import User  # Ensure correct import path after restructuring
from flask_bcrypt import Bcrypt

bp = Blueprint('auth', __name__)

bcrypt = Bcrypt()
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Assuming users can log in with either username or email
        identifier = request.form['email']  # The input field in the form should be named 'identifier'
        password = request.form['password']

        # Check if the identifier is an email or a username
        user = User.query.filter_by(username=identifier).first()

        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index.index'))
        else:
            flash('Invalid username or email, or password', 'error')

    return render_template('login.html')

@bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
