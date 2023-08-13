# app/routes/scan_multiple.py
from flask import Blueprint, render_template, request
from flask_login import login_required
from app.models.website_scanner import WebsiteScanner

bp = Blueprint('scan_multiple', __name__)


@bp.route('/scan-multiple', methods=["POST"])
@login_required
def scan_multiple():
    urls = request.form.get("multiple-urls").split("\n")
    urls = [url.strip() for url in urls if url.strip()]

    scanner = WebsiteScanner(urls)
    scanner.scan_website()

    urlResults = scanner.urlResultArray
    sum_page_count = sum(int(data['page_count']) for data in urlResults)
    total_results = len(urlResults)
    average_pages_per_result = sum_page_count / \
        total_results if total_results > 0 else 0

    return render_template('results.html',
                           urlResults=urlResults,
                           sum_page_count=sum_page_count,
                           average_pages_per_result=average_pages_per_result)
