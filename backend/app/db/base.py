from sqlalchemy.orm import declarative_base

# This Base will be inherited by all models (User, Dog, etc.)
# Must be before the models import since it's used by them
Base = declarative_base()

# Import all models so they're registered with Base.metadata
from app.db import models