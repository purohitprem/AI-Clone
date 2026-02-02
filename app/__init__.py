from flask import Flask
from app.routes.chat_routes import chat_bp

def create_app():
    app = Flask(
        __name__,
        static_folder="../static",
        template_folder="../templates"
    )
    app.config['SECRET_KEY'] = 'super-secret-key'

    # Register blueprints
    app.register_blueprint(chat_bp)

    return app
