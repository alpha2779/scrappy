# app/routes/index.py
from flask import Blueprint, render_template, request
from flask_login import login_required

bp = Blueprint('index', __name__)


@bp.route('/')
@login_required
def index():
    return render_template('index.html',  current_endpoint=request.endpoint)
