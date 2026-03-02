from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///audits.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class AuditRecord(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    rules_count = Column(Integer)
    score = Column(Integer)
    grade = Column(String)
    critical = Column(Integer)
    high = Column(Integer)
    medium = Column(Integer)
    report = Column(Text)


Base.metadata.create_all(bind=engine)


def save_audit(rules_count, score_data, report_text):
    db = SessionLocal()
    audit = AuditRecord(
        rules_count=rules_count,
        score=score_data["score"],
        grade=score_data["grade"],
        critical=score_data["summary"]["critical"],
        high=score_data["summary"]["high"],
        medium=score_data["summary"]["medium"],
        report=report_text
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    db.close()
    return audit.id


def get_all_audits():
    db = SessionLocal()
    audits = db.query(AuditRecord).order_by(AuditRecord.timestamp.desc()).all()
    db.close()
    return audits


def get_audit_by_id(audit_id):
    db = SessionLocal()
    audit = db.query(AuditRecord).filter(AuditRecord.id == audit_id).first()
    db.close()
    return audit
