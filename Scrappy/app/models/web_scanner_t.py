import requests
import concurrent.futures
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from functools import lru_cache
from app.utils.page_utils import PageUtils
import re
import logging


class WebScanner:
    def __init__(self, urls):
        self.urls = urls
        self.urlResultArray = []
        self.visited_urls = set()
        self.session = requests.Session()  # Use session for all requests
        self.error_occurred = False
        # Precompile regular expressions
        self.search_re = re.compile(r'search|query|find', re.I)
        self.pdf_re = re.compile(r'\.pdf$', re.I)

    def scan_website(self):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(self.scan_url, url)
                       for url in self.urls]
            # Wait for all futures to complete
            concurrent.futures.wait(futures)

    def scan_url(self, url):
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            self.process_soup(url, soup)
        except Exception as e:
            logging.error(f"Error occurred while scanning URL {url}: {e}")
            self.error_occurred = True

    def process_soup(self, url, soup):
        dataResults = []
        anchor_tags = soup.find_all('a')
        for tag in anchor_tags:
            href = tag.get('href')
            if href and not href.startswith('#'):
                absolute_url = urljoin(url, href)
                if self.is_same_website(url, absolute_url) and absolute_url not in self.visited_urls:
                    self.visited_urls.add(absolute_url)
                    dataResults.append(self.analyze_page(absolute_url, soup))

        self.urlResultArray.append({
            'url': url,
            'page_count': len(dataResults),
            'all_urls': dataResults
        })

    def analyze_page(self, url, soup=None):
        if not soup:  # If soup object is not provided, fetch and parse the content
            soup = BeautifulSoup(self.get_content(url), 'html.parser')
        page_title = soup.find('title').string if soup.find('title') else None
        page_components = self.extract_components(soup)
        page_type = self.get_type_page(url)
        return {
            'absolute_url': url,
            'page_title': page_title,
            'page_components': page_components,
            'page_type': page_type
        }

    @lru_cache(maxsize=None)
    def get_content(self, url):
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to get content for URL {url}: {e}")
            return None

    def is_same_website(self, base_url, absolute_url):
        return urlparse(base_url).netloc == urlparse(absolute_url).netloc

    def extract_components(self, soup):
        components = {
            'video': bool(soup.find('video')),
            'audio': bool(soup.find('audio')),
            'image': bool(soup.find('img')),
            'table': bool(soup.find('table')),
            'citation': bool(soup.find('blockquote') or soup.find('q')),
            # Add more components as needed
        }
        # Example for extracting PDFs, extend similarly for other components
        pdf_links = soup.find_all('a', href=self.pdf_re)
        if pdf_links:
            components['pdf_count'] = len(pdf_links)
        return components

    def get_type_page(self, url):
        # Simplify checks, assuming PageUtils provides similar simple functions
        if PageUtils.is_home_page(url):
            return "Home"
        if PageUtils.is_contact_page(url):
            return "Contact"
        # Add more checks as needed
        return "Unknown"
