import os
from app import create_app
from app.extensions import db

app = create_app(os.getenv("FLASK_ENV", "development"))

@app.cli.command("init-db")
def init_db():
    """Create all database tables."""
    db.create_all()
    print("Database tables created.")

@app.cli.command("seed-db")
def seed_db():
    """Seed database with initial data."""
    from seed import seed_database
    seed_database()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    app.run(host="0.0.0.0", port=port, debug=debug)
