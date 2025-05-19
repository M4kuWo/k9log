from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base
import enum

class EventType(str, enum.Enum):
    food = "food"
    treat = "treat"
    puke = "puke"
    pee = "pee"
    poop = "poop"

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    walk_id = Column(Integer, ForeignKey("walks.id"), nullable=True)

    type = Column(Enum(EventType), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    dog = relationship("Dog", back_populates="events")
    user = relationship("User", back_populates="events")
    walk = relationship("Walk", back_populates="events")
