"""Version-1 ORM schema. See migrations/001_initial.md."""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(200), unique=True)
    password = Column(Text)
    role = Column(String(20))
    department = Column(String(100))
    hourly_rate = Column(Float, default=150)
    active = Column(Integer, default=1)


class LoginSession(Base):
    __tablename__ = "sessions"
    token = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    csrf = Column(String(64))
    expires = Column(String(40))


class Duty(Base):
    __tablename__ = "duties"
    __table_args__ = (UniqueConstraint("user_id", "date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String(10))
    shift = Column(String(40))
    start = Column(String(5))
    end = Column(String(5))
    break_minutes = Column(Integer, default=60)


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("user_id", "date"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String(10))
    check_in = Column(String(40))
    check_out = Column(String(40), nullable=True)
    break_minutes = Column(Integer, default=0)


class Audit(Base):
    __tablename__ = "audit"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    message = Column(String(400))
    created = Column(String(40))


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String(100), primary_key=True)
    value = Column(Text)


class Migration(Base):
    __tablename__ = "schema_migrations"
    version = Column(Integer, primary_key=True)
