import requests
import concurrent.futures
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from urllib.parse import urlparse
from functools import lru_cache
from app.utils.page_utils import PageUtils


class WebsiteScanner:
    def __init__(self, urls):
        self.urls = urls
        self.urlResultArray = []
        self.urlResults = {}
        self.page_components = {}
        self.visited_urls = set()
        self.href_set = set()

    def scan_website(self):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(self.scan_url, url)
                       for url in self.urls]

            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                except Exception as e:
                    print(f"Error occurred while scanning a URL: {e}")

        print("This is the result of the url:", self.urlResultArray)

    def scan_url(self, url):
        dataResults = []
        count = 0

        # Add "https://" to the URL if it doesn't start with "http://" or "https://"
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        # Parse the URL to extract the domain
        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        # Send a GET request to the URL
        session = requests.Session()
        response = session.get(url)

        # Check if the request was successful
        if response.status_code == 200:
            # Create a BeautifulSoup object to parse the HTML content
            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all anchor tags on the page
            anchor_tags = soup.find_all('a')

            # Extract the href attribute from each anchor tag
            for tag in anchor_tags:
                href = tag.get('href')
                if href and not href.startswith('#'):
                    absolute_url = urljoin(url, href)
                    # Check if the absolute URL belongs to the website being scanned
                    if self.is_same_website(url, absolute_url) and absolute_url not in self.visited_urls:
                        self.visited_urls.add(absolute_url)
                        print('Im here: ', absolute_url)
                        # Check if the href value is already in the set, skip if it's a duplicate
                        if href in self.href_set:
                            continue

                        # Add the href value to the set
                        self.href_set.add(href)

                        # Process the anchor tag
                        dataResults.append({
                            'absolute_url': absolute_url,
                            'page_title': self.get_page_title(absolute_url),
                            'page_components': self.scan_page_components(absolute_url),
                            'page_type': self.get_type_page(absolute_url)
                        })
                        count += 1

        # Add the result of count_pages function to urlResults
        self.urlResults = {
            'url': url,
            'page_count': count,
            'all_urls': dataResults
        }
        self.urlResultArray.append(self.urlResults)

    def is_same_website(self, base_url, absolute_url):
        # Parse the base URL and the absolute URL
        base_parsed = urlparse(base_url)
        absolute_parsed = urlparse(absolute_url)

        # Compare the netloc (domain) of both URLs
        return base_parsed.netloc == absolute_parsed.netloc

    def get_page_title(self, url):
        try:
            session = requests.Session()
            response = session.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            title_tag = soup.find('title')
            if title_tag:
                return title_tag.string
        except requests.exceptions.RequestException as e:
            print(f"Error occurred while fetching page title: {e}")

        return None

    def get_urls(self):
        return self.urlResultArray

    def get_type_page(self, url):
        if self.is_home_page(url):
            return "home"
        if self.is_contact_page(url):
            return "contact"
        if self.is_authentication_page(url):
            return "authentication"
        if self.is_sitemap_page(url):
            return "sitemap"
        if self.is_help_page(url):
            return "help"
        if self.is_search_page(url):
            return "search"
        if self.is_accessibility_page(url):
            return "accessibility"

    def is_home_page(self, url):
        return PageUtils.is_home_page(url)

    def is_legal_page(self, url):
        return PageUtils.is_legal_page(url)

    def is_contact_page(self, url):
        return PageUtils.is_contact_page(url)

    def is_authentication_page(self, url):
        return PageUtils.is_authentication_page(url)

    def is_sitemap_page(self, url):
        return PageUtils.is_sitemap_page(url)

    def is_help_page(self, url):
        return PageUtils.is_help_page(url)

    def is_search_page(self, url):
        return PageUtils.is_search_page(url)

    def is_accessibility_page(self, url):
        return PageUtils.is_accessibility_page(url)

    def is_pdf(self, url):
        return PageUtils.is_pdf(url)

    def count_pages(self):
        return len(self.urlResults)

    @lru_cache(maxsize=None)  # Use cache to store scanned page components
    def scan_page_components(self, url):
        try:
            response = requests.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            components = self.extract_components(soup)
            # print("Theses are the components ", components)
            # self.page_components[url] = components
            return components
        except requests.exceptions.RequestException as e:
            print(f"Error occurred while scanning page components: {e}")

    def extract_components(self, soup):
        components = []

        # Check for the presence of specific components and add their names
        if soup.find('video'):
            components.append('video')
        if soup.find('audio'):
            components.append('audio')
        if soup.find('img'):
            components.append('image')
        if soup.find('table'):
            components.append('table')
        if soup.find('form'):
            components.append('formulaire')
        if soup.find('input'):
            components.append('input')
        if soup.find('blockquote'):
            components.append('citation')

        # Check for the presence of iframe and its visibility
        iframe = soup.find('iframe')
        if iframe and self.is_iframe_visible(iframe):
            components.append('cadre')

        return components

    def is_iframe_visible(self, iframe):
        # Check the visibility of the iframe using its style attribute or CSS classes
        style = iframe.get('style')
        classes = iframe.get('class')

        # Add conditions based on the style attribute or CSS classes to determine visibility
        if style and 'display:none' in style:
            return False
        if classes and 'hidden' in classes:
            return False

        return True

    def get_page_components(self, url):
        return self.page_components.get(url, [])
