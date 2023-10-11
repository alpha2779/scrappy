from flask import Blueprint, render_template
from flask_login import login_required, current_user
from app.models.website import Website


bp = Blueprint('sample_history', __name__)


@bp.route('/history')
@login_required
def history():
    # Get websites for the current user
    websites = Website.get_by_user_id(current_user.id)
    
    # Pass the websites to the template
    return render_template('history.html', websites=websites)
