from flask import Blueprint, render_template, request, jsonify, Response
from flask_login import login_required, current_user
from app.models.website import Website
from app.models.sample import Sample
import json
import ast


bp = Blueprint('sample_history', __name__)


@bp.route('/history')
@login_required
def history():
    # Get websites for the current user
    websites = Website.get_by_user_id(current_user.id)
    
    # Pass the websites to the template
    return render_template('history.html', websites=websites, current_endpoint=request.endpoint)

@bp.route('/history/<int:website_id>', methods=['GET'])
@login_required
def get_sample_data(website_id):
    sample = Sample.query.filter_by(website_id=website_id).first()
    if sample:
        try:
            # Assuming that sample.sample_data is a stringified JSON
            # We parse it into a Python object
            data_dict = ast.literal_eval(sample.sample_data)
            return Response(json.dumps(data_dict), mimetype='application/json')
        except json.JSONDecodeError:
            # Log the error for debugging
            current_app.logger.error(f"Failed to decode JSON for sample id {sample.id}")
            return jsonify(error="Failed to decode sample data"), 500
    return jsonify([])  # return empty list if no data

