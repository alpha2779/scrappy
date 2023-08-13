# scrappy

Scrappy Website Scanner
Le Scrappy Website Scanner est un script Python conçu pour analyser des sites web en extrayant les liens, en identifiant les composants des pages et en catégorisant les types de pages.

Fonctionnalités
Analyse une liste d'URLs en parallèle en utilisant concurrent.futures.ThreadPoolExecutor.
Extrait les liens (URLs) à partir des balises d'ancre <a> sur chaque page.
Filtre les liens pour s'assurer qu'ils appartiennent au même domaine que l'URL de départ et évite les doublons.
Récupère le titre de la page, les composants (vidéo, audio, image, etc.) et le type de page pour chaque lien.
Classe les types de pages en "accueil," "contact," "authentification," "plan du site," "aide," "recherche" et "accessibilité."
Utilise la mise en cache pour stocker les composants des pages et réduire les requêtes excessives.

Installation
Assurez-vous d'avoir Python installé sur votre système.
Clonez ce dépôt : git clone https://github.com/alpha2779/scrappy.git
Accédez au répertoire du projet : cd scrappy-website-scanner
Installez les dépendances requises : pip install -r requirements.txt
