from sqlalchemy import Column, Integer, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Walk(Base):
    __tablename__ = "walks"

    id = Column(Integer, primary_key=True, index=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    steps = Column(Integer, nullable=True)
    distance = Column(Float, nullable=True)  # in kilometers
    route = Column(String, nullable=True)    # could store JSON string or encoded path

    # Relationships
    dog = relationship("Dog", back_populates="walks")
    user = relationship("User", back_populates="walks")
    events = relationship("Event", back_populates="walk")