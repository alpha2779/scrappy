from app.routes.index import bp as index_bp
from app.routes.scan import bp as scan_bp
from app.routes.scan_multiple import bp as scan_multiple_bp
from app.routes.auth import bp as auth_bp
from flask import Flask
from app.models.user import db
from app.routes.auth import bcrypt, login_manager

app = Flask(__name__)
app.config.from_object('app.config.Config')

db.init_app(app)
bcrypt.init_app(app)
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

app.register_blueprint(index_bp)
app.register_blueprint(scan_bp)
app.register_blueprint(scan_multiple_bp)
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # app.run(debug=False, host="0.0.0.0", port=3000)
    app.run(debug=True)
