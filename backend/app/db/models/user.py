from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dogs = relationship("Dog", back_populates="owner")
    walks = relationship("Walk", back_populates="user")
    events = relationship("Event", back_populates="user")
    vet_visits = relationship("VetVisit", back_populates="user")