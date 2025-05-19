from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Dog(Base):
    __tablename__ = "dogs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    birthdate = Column(Date, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="dogs")
    walks = relationship("Walk", back_populates="dog")
    events = relationship("Event", back_populates="dog")
    vet_visits = relationship("VetVisit", back_populates="dog")