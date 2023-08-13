# app/routes/scan.py
from flask import Blueprint, render_template, request
from flask_login import login_required
from app.models.website_scanner import WebsiteScanner

bp = Blueprint('scan', __name__)


@bp.route('/scan/', methods=["POST"])
@login_required
def scan():
    form_data = request.form.to_dict()
    values_list = list(form_data.values())

    scanner = WebsiteScanner(values_list)
    scanner.scan_website()

    urlResults = scanner.get_urls()
    total_results = len(urlResults)
    total_pages = sum(int(data['page_count']) for data in urlResults)
    average_pages_per_result = total_pages / \
        total_results if total_results > 0 else 0

    print("This is the sum of the page count...", total_pages)
    print("This is the total results...", total_results)
    print("This is the average", average_pages_per_result)

    return render_template('results.html',
                           urlResults=urlResults,
                           sum_page_count=total_pages,
                           average_pages_per_result=average_pages_per_result)
