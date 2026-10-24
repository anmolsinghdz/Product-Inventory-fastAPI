from fastapi import FastAPI, Depends

from database_models import Product
from models import Product
from dbconfig import session, engine
import database_models
from sqlalchemy.orm import Session

app = FastAPI()
database_models.Base.metadata.create_all(bind=engine)


@app.get("/")
def greet():
    return "Welcome Anmol"


products = [
    Product(id=1, name="Samsung Phone", description="Budget phone", price=699.99, quantity=50),
    Product(id=2, name="Acer Laptop", description="Gaming Laptop", price=999, quantity=100),
    Product(id=3, name="Sandisk SSD", description="128 GB", price=200, quantity=20),
    Product(id=4, name="Toshiba TV", description="4K TV", price=800, quantity=50)
]


def get_db():
    db = session()
    try:
        yield db
    finally:
        db.close()


def init_db():
    db = session()

    count = db.query(database_models.Product).count()
    if count == 0:
        for product in products:
            db.add(database_models.Product(**product.model_dump()))

        db.commit()


init_db()


@app.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    # db connection
    # query
    db_products = db.query(database_models.Product).all()
    return db_products


@app.get("/product/{id}")
def get_product_by_id(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        return db_product
    return "product not found"


@app.post("/product")
def add_product(product: Product, db: Session = Depends(get_db)):
    db.add(database_models.Product(**product.model_dump()))
    db.commit()
    return product


@app.put("/product")
def update_product(id: int, product: Product, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        db_product.name = product.name
        db_product.description = product.description
        db_product.quantity = product.quantity
        db_product.price = product.price
        db.commit()
        return "Product Updated Successfully😊"
    else:
        return "No Product found😢"


@app.delete("/product")
def delete_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(database_models.Product).filter(database_models.Product.id == id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
        return "Product Deleted Successfully👌"
    else:
        return "Product Not Found😢"
