from bs4 import BeautifulSoup
from urllib.parse import urlparse
from .http_utils import fetch_url


class PageUtils:
    @staticmethod
    def is_same_website(url, absolute_url):
        parsed_url = urlparse(url)
        parsed_absolute_url = urlparse(absolute_url)
        return parsed_url.netloc == parsed_absolute_url.netloc

    @staticmethod
    def get_page_title(url):
        response = fetch_url(url)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            title = soup.find('title')
            if title:
                return title.text.strip()
        return None

    @staticmethod
    def get_type_page(url):
        # Get the page type based on its URL or any other criteria
        pass

    @staticmethod
    def is_home_page(url):
        if url.endswith("/"):
            return True
        if url == "https://example.com/":
            return True
        if url.endswith("/index.html"):
            return True
        if "home" in url or "main" in url:
            return True
        return False

    @staticmethod
    def is_legal_page(url):
        if "legal" in url or "terms" in url or "conditions" in url or "mentions-legales" in url:
            return True
        if "/legal" in url or "/terms" in url or "/conditions" in url or "/mentions-legales" in url:
            return True
        return False

    @staticmethod
    def is_contact_page(url):
        if "contact" in url or "contactez-nous" in url:
            return True
        if "/contact" in url or url.endswith("/contact.html"):
            return True
        return False

    @staticmethod
    def is_authentication_page(url):
        if "login" in url or "register" in url or "signin" in url or "signup" in url or "connexion" in url or "enregistrement" in url:
            return True
        if "/login" in url or "/register" in url or "/signin" in url or "/signup" in url or "/connexion" in url or "/enregistrement" in url:
            return True
        return False

    @staticmethod
    def is_sitemap_page(url):
        if "plan-du-site" in url or "sitemap" in url:
            return True
        if "/plan-du-site" in url or url.endswith("/sitemap.xml"):
            return True
        return False

    @staticmethod
    def is_help_page(url):
        if "help" in url or "faq" in url or "aide" in url or "foire-aux-questions" in url:
            return True
        if "/help" in url or "/faq" in url or "/aide" in url or "/foire-aux-questions" in url:
            return True
        return False

    @staticmethod
    def is_search_page(url):
        if "search" in url or "recherche" in url:
            return True
        if "/search?" in url or "/recherche" in url:
            return True
        return False

    @staticmethod
    def is_accessibility_page(url):
        if "accessibility" in url or "accessibilite" in url:
            return True
        if "/accessibility" in url or "/accessibilite" in url:
            return True
        return False

    @staticmethod
    def is_pdf(url):
        if url.endswith('.pdf'):
            return True
        return False
