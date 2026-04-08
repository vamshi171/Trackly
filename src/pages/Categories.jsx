import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { toast } from "react-toastify";

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name) {
            alert("Please enter a category name");
            return;
        }

        setLoading(true);
        try {
            await api.post("/categories", {
                name: newCategory.name
            });
            setShowAddModal(false);
            setNewCategory({ name: "", description: "" });
            fetchCategories();
        } catch (err) {
            console.error("Error adding category:", err);

            toast.error("Failed to add category");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category?")) return;

        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("Failed to delete category");
        }
    };

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="category-header">
                    <div>
                        <p className="eyebrow">Categories</p>
                        <h1>Organize spending by category</h1>
                        <p className="subtext">Create and manage categories so every expense lands in the right place.</p>
                    </div>
                    <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                        ➕ Add Category
                    </button>
                </div>

                <div className="category-banner">
                    <div>
                        <h2>Build organized budgets faster</h2>
                        <p>Set up category groups, keep expenses cleaner, and make reporting easier.</p>
                    </div>
                    <span>📁</span>
                </div>

                <div className="category-grid">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div key={category.id} className="category-card">
                                <div>
                                    <h3>{category.name}</h3>
                                    <p>{category.description || "No description provided."}</p>
                                </div>
                                <button className="action-button" onClick={() => handleDeleteCategory(category.id)}>
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-card">
                            <div className="empty-icon">📂</div>
                            <h3>No categories yet</h3>
                            <p>Create categories to better organize your expenses!</p>
                            <button className="secondary-btn" onClick={() => setShowAddModal(true)}>
                                Add your first category
                            </button>
                        </div>
                    )}
                </div>

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Add New Category</h2>
                                <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
                            </div>

                            <form onSubmit={handleAddCategory}>
                                <div className="form-group">
                                    <label>Category Name</label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        placeholder="Enter category name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                        placeholder="Enter category description"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        background: loading ? "#ccc" : "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "16px",
                                        cursor: loading ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {loading ? "Adding..." : "Add Category"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}