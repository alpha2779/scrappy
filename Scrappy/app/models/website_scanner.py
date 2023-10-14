import requests
import concurrent.futures
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from urllib.parse import urlparse
from functools import lru_cache
from app.utils.page_utils import PageUtils
import re


class WebsiteScanner:
    def __init__(self, urls):
        self.urls = urls
        self.urlResultArray = []
        self.urlResults = {}
        self.page_components = {}
        self.visited_urls = set()
        self.href_set = set()
        self.session = requests.Session()  # Create one session for all requests
        self.errors = []

    def scan_website(self):
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(self.scan_url, url)
                       for url in self.urls]

            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                except Exception as e:
                    error_msg = f"Error occurred while scanning URL: {e}"
                    self.errors.append(error_msg)
                    print(error_msg)

        # print("This is the result of the url:", self.urlResultArray)
        return self.errors

    def scan_url(self, url):
        dataResults = []
        count = 0

        # Use tuple for startswith check
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # Use the session created during initialization
        response = self.session.get(url)

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

                        try:
                            # ... scanning logic ...
                            self.visited_urls.add(absolute_url)
                            print('Im here: ', absolute_url)
                            # Check if the href value is already in the set, skip if it's a duplicate
                            if href in self.href_set:
                                continue

                            # Add the href value to the set
                            self.href_set.add(href)

                            # Get page components once
                            page_components = self.scan_page_components(absolute_url)

                            # Process the anchor tag
                            dataResults.append({
                                'absolute_url': absolute_url,
                                'page_title': self.get_page_title(absolute_url),
                                'page_components': page_components,
                                'page_type': self.get_type_page(absolute_url),
                                'complexity': self.determine_complexity(page_components)
                            })
                            count += 1
                        except TypeError as e:
                            if str(e) == "unhashable type: 'dict'":
                                # Handle the specific error, perhaps logging additional details
                                print(f"Error with URL {url}: {e}")
                                # Add more detailed error message to errors list
                                self.errors.append(f"Error with URL {url}: {e}")
                            else:
                                raise
                        except Exception as e:
                            # Handle other exceptions
                            print(f"Error with URL {url}: {e}")
                            self.errors.append(f"Error with URL {url}: {e}")

                        

        # Add the result of count_pages function to urlResults
        self.urlResults = {
            'url': url,
            'page_count': count,
            'all_urls': dataResults
        }
        self.urlResultArray.append(self.urlResults)

    def scan_single_url(self, url):
        # Ensure the URL starts with 'http' or 'https'
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # Use the session to get the content
        response = self.session.get(url)

        # If successful, create a BeautifulSoup object
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')

            try:
            
                # Fetch the necessary details
                absolute_url = url
                page_title = soup.title.string if soup.title else "No Title"
                page_components = self.scan_page_components(url)
                page_type = self.get_type_page(url)

                return {
                    'absolute_url': absolute_url,
                    'page_title': page_title,
                    'page_components': page_components,
                    'page_type': page_type,
                    'complexity': self.determine_complexity(page_components)
                }
            except TypeError as e:
                if str(e) == "unhashable type: 'dict'":
                    # Handle the specific error, perhaps logging additional details
                    print(f"Error with URL {url}: {e}")
                    # Add more detailed error message to errors list
                    self.errors.append(f"Error with URL {url}: {e}")
                else:
                    raise
            except Exception as e:
                # Handle other exceptions
                print(f"Error with URL {url}: {e}")
                self.errors.append(f"Error with URL {url}: {e}")

        return None
    
    def determine_complexity(self, components):
        ultrasimple_components = {'image', 'citation', 'pdf', 'Recherche'}
        simple_additions = {'table', 'formulaire'}
        complex_components = {'video', 'audio', 'cadre'}

        if set(components).issubset(ultrasimple_components):
            return 'ultra-simple'
        elif any(item in simple_additions for item in components):
            return 'simple'
        elif any(item in complex_components for item in components):
            return 'complexe'
        else:
            return 'simple'  # Return a default complexity


    def is_same_website(self, base_url, absolute_url):
        # Parse the base URL and the absolute URL
        base_parsed = urlparse(base_url)
        absolute_parsed = urlparse(absolute_url)

        # Compare the netloc (domain) of both URLs
        return base_parsed.netloc == absolute_parsed.netloc

    def get_page_title(self, url):
        # Get content once and store it
        content = self.get_content(url)
        if content:
            soup = BeautifulSoup(content, 'html.parser')
            title_tag = soup.find('title')
            if title_tag:
                return title_tag.string
        return None

    @lru_cache(maxsize=None)
    def get_content(self, url):
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException:
            return None

    def get_urls(self):
        return self.urlResultArray

    def get_type_page(self, url):
        page_types = {
            self.is_home_page: "Accueil",
            self.is_legal_page: "Mentions Légales",
            self.is_contact_page: "Contact",
            self.is_authentication_page: "Authentification",
            self.is_sitemap_page: "Plan du site",
            self.is_help_page: "Aide",
            self.is_search_page: "Recherche",
            self.is_accessibility_page: "Accessibilité",
            # ... add other page type checks here ...
        }
        for check, page_type in page_types.items():
            if check(url):
                return page_type

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
        if soup.find('blockquote') or soup.find('q'):
            components.append('citation')
        if soup.find('form'):
            forms = soup.find_all('form')
            search_input = False
            search_action = False
            search_button = False
            for form in forms:
                # Check for search forms based on input type, placeholder, or name
                search_input = form.find('input', {'type': ['search', 'text'],
                                                   'placeholder': re.compile(r'search|query|find', re.I),
                                                   'name': re.compile(r'search|query|find', re.I)})
                # Check form action or button label
                search_action = 'search' in form.get('action', '').lower()
                search_button = form.find(
                    'input', {'type': 'submit', 'value': re.compile(r'search|find', re.I)})

            if search_input or search_action or search_button:
                components.append('Recherche')
            else:
                components.append('formulaire')

        # Check for the presence of PDF documents and count them
        pdf_links = soup.find_all('a', href=re.compile(r'\.pdf$', re.I))
        num_pdfs = len(pdf_links)

        if num_pdfs > 0:
            components.append('pdf')
            components.append({'pdf_count': num_pdfs})

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
