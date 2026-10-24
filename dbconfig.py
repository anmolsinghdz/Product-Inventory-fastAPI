from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

db_url = "mysql+mysqlconnector://root:root@localhost:3306/sqlalchemy"

engine = create_engine(db_url)
session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
