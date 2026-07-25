"""
PayProof — SQLAlchemy database models for OCR records and manual confirmation.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./payproof.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class OcrRecord(Base):
    __tablename__ = "ocr_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    amount = Column(String, nullable=True)
    ref_no = Column(String, nullable=True)
    sender = Column(String, nullable=True)
    date = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    review_status = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    template = Column(String, nullable=True)
    detected_app = Column(String, nullable=True)
    llm_confidence = Column(Float, nullable=True)

    # Manual confirmation fields
    confirmed = Column(Boolean, default=False, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a session, closing it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
