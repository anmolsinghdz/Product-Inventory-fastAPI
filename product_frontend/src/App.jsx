
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/products";

const emptyForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  quantity: "",
};

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not fetch products.");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(
        "Unable to connect to FastAPI. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const payload = {
      id: Number(form.id),
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    if (
      !payload.name ||
      !payload.id ||
      !Number.isFinite(payload.price) ||
      !Number.isInteger(payload.quantity) ||
      payload.price < 0 ||
      payload.quantity < 0
    ) {
      setError("Enter a valid ID, name, price and quantity.");
      return;
    }

    try {
      const url = editing
        ? `${API_URL}?id=${encodeURIComponent(form.id)}`
        : API_URL;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Request failed.");
      }

      setMessage(
        editing
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    }
  }

  function handleEdit(product) {
    setForm({
      id: String(product.id),
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      quantity: String(product.quantity),
    });

    setEditing(true);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      `Are you sure you want to delete product #${id}?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product.");
      }

      setMessage("Product deleted successfully.");

      if (String(form.id) === String(id)) {
        resetForm();
      }

      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    }
  }

  const filteredProducts = products.filter((product) => {
    const query = searchId.trim().toLowerCase();

    return (
      String(product.id).includes(query) ||
      product.name.toLowerCase().includes(query) ||
      (product.description || "").toLowerCase().includes(query)
    );
  });

  const totalValue = products.reduce(
    (total, product) =>
      total + Number(product.price) * Number(product.quantity),
    0
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-icon">P</span>
          Product<span>Hub</span>
        </a>

        <div className="api-status">
          <span className={`status-dot ${error ? "offline" : ""}`} />
          FastAPI Dashboard
        </div>
      </header>

      <main className="container">
        <section className="page-heading">
          <div>
            <p className="eyebrow">INVENTORY MANAGEMENT</p>
            <h1>Product Dashboard</h1>
            <p className="subtitle">
              Manage your products, prices and inventory in one place.
            </p>
          </div>

          <button className="refresh-btn" onClick={loadProducts}>
            ↻ Refresh
          </button>
        </section>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Products</span>
            <strong>{products.length}</strong>
            <span className="stat-note">Products in inventory</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Units</span>
            <strong>
              {products.reduce(
                (total, product) => total + Number(product.quantity),
                0
              )}
            </strong>
            <span className="stat-note">Units in stock</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Inventory Value</span>
            <strong>
              {totalValue.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </strong>
            <span className="stat-note">Price × quantity</span>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {editing ? "EDIT DETAILS" : "NEW ENTRY"}
                </p>
                <h2>{editing ? "Update Product" : "Add Product"}</h2>
              </div>
              <span className="heading-icon">{editing ? "✎" : "+"}</span>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="id">Product ID</label>
              <input
                id="id"
                name="id"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 5"
                value={form.id}
                onChange={handleChange}
                disabled={editing}
                required
              />

              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                name="name"
                placeholder="e.g. Wireless Headphones"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the product..."
                rows="3"
                value={form.description}
                onChange={handleChange}
              />

              <div className="form-row">
                <div>
                  <label htmlFor="price">Price (₹)</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="699.99"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50"
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button className="primary-btn" type="submit">
                {editing ? "Save Changes" : "+ Add Product"}
              </button>

              {editing && (
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel Editing
                </button>
              )}
            </form>
          </div>

          <div className="panel inventory-panel">
            <div className="panel-heading inventory-heading">
              <div>
                <p className="eyebrow">YOUR CATALOG</p>
                <h2>All Products</h2>
              </div>
              <span className="count-badge">{products.length} items</span>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                aria-label="Search products"
                placeholder="Search by ID, name or description..."
                value={searchId}
                onChange={(event) => setSearchId(event.target.value)}
              />
            </div>

            {loading ? (
              <div className="empty-state">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">▤</span>
                <h3>No products found</h3>
                <p>Try a different search or add a new product.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>PRICE</th>
                      <th>STOCK</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <span className="product-avatar">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <strong>{product.name}</strong>
                              <small>
                                #{product.id} · {product.description || "No description"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td className="price-cell">
                          ₹{Number(product.price).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td>
                          <span
                            className={`stock-badge ${
                              product.quantity === 0
                                ? "out-stock"
                                : product.quantity < 10
                                ? "low-stock"
                                : "in-stock"
                            }`}
                          >
                            {product.quantity === 0
                              ? "Out of stock"
                              : `${product.quantity} units`}
                          </span>
                        </td>

                        <td>
                          <div className="actions">
                            <button
                              className="edit-btn"
                              title="Edit product"
                              aria-label={`Edit ${product.name}`}
                              onClick={() => handleEdit(product)}
                            >
                              ✎
                            </button>
                            <button
                              className="delete-btn"
                              title="Delete product"
                              aria-label={`Delete ${product.name}`}
                              onClick={() => handleDelete(product.id)}
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="panel-footer">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </section>

        <footer>
          ProductHub <span>·</span> React + FastAPI + SQLAlchemy + MySQL
        </footer>
      </main>
    </div>
  );
}

export default App;
