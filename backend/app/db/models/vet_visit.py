from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class VetVisit(Base):
    __tablename__ = "vet_visits"

    id = Column(Integer, primary_key=True, index=True)
    dog_id = Column(Integer, ForeignKey("dogs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    dog = relationship("Dog", back_populates="vet_visits")
    user = relationship("User", back_populates="vet_visits")
