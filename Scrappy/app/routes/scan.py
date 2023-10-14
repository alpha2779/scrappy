# app/routes/scan.py
from flask import Blueprint, redirect, render_template, request, url_for, send_from_directory, jsonify, flash
from flask_login import login_required, current_user
from app.models.website_scanner import WebsiteScanner
from openpyxl import Workbook, load_workbook
from pathlib import Path
from datetime import datetime
from app.models.website import Website
from app.models.sample import Sample

bp = Blueprint('scan', __name__)

@bp.route('/scan', methods=["GET", "POST"])
@login_required
def scan():
    if request.method == "GET":
        return redirect(url_for('index.index'))

    form_data = request.form.to_dict()
    values_list = list(form_data.values())
    values_list = list(set(values_list))

    try:
        scanner = WebsiteScanner(values_list)
        errors = scanner.scan_website()

        if errors:
            for error in errors:
                flash(error, 'danger')
            # return redirect(url_for('index.index'))

        urlResults = scanner.get_urls()
        total_results = len(urlResults)
        total_pages = sum(int(data['page_count']) for data in urlResults)
        average_pages_per_result = total_pages / total_results if total_results > 0 else 0

        return render_template('res.html',
                           urlResults=urlResults,
                           sum_page_count=total_pages,
                           average_pages_per_result=average_pages_per_result)
    except Exception as e:
        flash(f'An error occurred: {e}', 'danger')  # flash the error message
        return redirect(url_for('index.index'))  # redirect back to the same page
    

@bp.route('/scan-manual', methods=["GET", "POST"])
@login_required
def scan_manual():
    if request.method == "GET":
        return redirect(url_for('index.index'))
    
    form_data = request.form.to_dict()
    first_value = next(iter(form_data.values()))


    urlResults = [
        {
            'url': first_value,
            'page_count': 1, 
            'all_urls': []
        }
    ]
    print(urlResults)

    return render_template('res.html',
                           urlResults=urlResults,
                           sum_page_count=1,
                           average_pages_per_result=1)


@bp.route('/scan/single/', methods=["GET", "POST"])
@login_required
def scan_single():
    data = request.json
    url = data.get('url', '')

    # Validate URL before processing further
    if not url:
        return jsonify({"error": "URL not provided"}), 400

    scanner = WebsiteScanner([])
    result = scanner.scan_single_url(url)

    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Failed to scan the URL"}), 500



@bp.route('/scan/generate/', methods=["POST"])
@login_required
def generate():
    data = request.json

    if not data:
        return "No data received", 400

    # Extract the first URL for website link
    website_link = data[0]['url']

    current_dir = Path(__file__).parent
    file_path = current_dir.parent.parent / \
        "resources" / "Desktop_Estimation_CLIENT_SITE_ANNEE.xlsx"

    # Load the workbook:
    wb = load_workbook(file_path)
    ws = wb.active
    start_row = 2
    for item in data:
        ws.cell(row=start_row, column=2, value=item['pageName'])
        ws.cell(row=start_row, column=3, value=item['url'])
        ws.cell(row=start_row, column=4, value=item['components'])
        # ... Populate other columns as needed
        start_row += 1
        
    # Check if website already exists
    website = Website.query.filter_by(link=website_link).first()

    # If it doesn't exist, create a new website entry using the provided class method
    if not website:
        website = Website.create(user_id=current_user.id, link=website_link)

    # Add the sample data using the provided class method
    Sample.create(website_id=website.id, sample_data=str(data))

    # Creating a unique filename with the current date and time
    current_time_str = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    output_filename = f'output_{current_time_str}.xlsx'

    excel_file_path = current_dir.parent.parent / "Dowloads"
    
    # Ensure the directory exists
    excel_file_path.mkdir(parents=True, exist_ok=True)
    
    # Joining paths correctly using the `/` operator
    full_path = excel_file_path / output_filename

    # Save the workbook in the specified directory
    wb.save(full_path)

    # Note: send_from_directory expects string paths, so we convert the directory path to a string
    return send_from_directory(directory=str(excel_file_path), path=output_filename, as_attachment=True)

