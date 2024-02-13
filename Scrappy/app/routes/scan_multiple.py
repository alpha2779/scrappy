# app/routes/scan_multiple.py
from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required
from app.models.website_scanner import WebsiteScanner

bp = Blueprint('scan_multiple', __name__)


@bp.route('/scan-multiple', methods=["GET", "POST"])
@login_required
def scan_multiple():
    if request.method == "GET":
        # Redirect them to the homepage or wherever you'd like
        return redirect(url_for('index.index'))
    
    urls = request.form.get("multiple-urls").split("\n")
    urls = [url.strip() for url in urls if url.strip()]

    scanner = WebsiteScanner(urls)
    scanner.scan_website()

    # Check if an error occurred during scanning
    if scanner.error_occurred:
        # Use flash to send an error message
        flash("Impossible to proceed due to an error.", "error")
        # Redirect back to the same page (the index page in this case)
        return redirect(url_for('index.index'))

    urlResults = scanner.urlResultArray
    sum_page_count = sum(int(data['page_count']) for data in urlResults)
    total_results = len(urlResults)
    average_pages_per_result = sum_page_count / \
        total_results if total_results > 0 else 0

    return render_template('res.html',
                           urlResults=urlResults,
                           sum_page_count=sum_page_count,
                           average_pages_per_result=average_pages_per_result)
