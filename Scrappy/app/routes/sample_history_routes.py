from flask import Blueprint, render_template, request, jsonify, Response, current_app
from flask_login import login_required, current_user
from app.models.website import Website
from app.models.sample import Sample
from app.models.user import User
import ast
from datetime import datetime


bp = Blueprint('sample_history', __name__)



@bp.route('/history')
@login_required
def history():
    page = request.args.get('page', 1, type=int)
    url_search = request.args.get('url', None, type=str)
    start_date_str = request.args.get('start_date', None, type=str)
    end_date_str = request.args.get('end_date', None, type=str)

    # Convert date strings to date objects
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date() if start_date_str else None
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date() if end_date_str else None

    # Start with a base query filtered by the current user's ID
    websites_query = Website.query.filter_by(user_id=current_user.id).order_by(Website.date_added.desc())

    if url_search:
        websites_query = websites_query.filter(Website.link.like(f"%{url_search}%"))

    if start_date and end_date:
        websites_query = websites_query.filter(
            Website.date_added.between(start_date, end_date)
        )

    # Pagination
    pagination = websites_query.paginate(page=page, per_page=10, error_out=False)
    websites = pagination.items

    # Pass the websites to the template
    return render_template('history.html', websites=websites, current_endpoint=request.endpoint, pagination=pagination)


@bp.route('/history/<int:website_id>', methods=['GET'])
@login_required
def get_sample_data(website_id):
    website = Website.get_by_website_id(website_id)
    sample = Sample.query.filter_by(website_id=website_id).first()
    username = User.get_username_by_id(website.user_id)
    
    response_data = {
        "website": {
            "date": website.date_added,
            "name": website.link,  # assuming the Website model has a "name" field
            "username": username   # add the fetched username to the response
            # ... add other fields from the website object as needed
        },
        "sample_data": {}
    }

    if sample:
        try:
            # Assuming that sample.sample_data is a stringified JSON
            # We parse it into a Python object
            data_dict = ast.literal_eval(sample.sample_data)
            response_data["sample_data"] = data_dict
        except (ValueError, SyntaxError):  # ast.literal_eval might raise these errors
            # Log the error for debugging
            current_app.logger.error(f"Failed to decode JSON for sample id {sample.id}")
            return jsonify(error="Failed to decode sample data"), 500

    return jsonify(response_data)