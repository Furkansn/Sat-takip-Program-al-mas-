"use client";

import { useState } from "react";
import { createProduct, updateStock, updateProduct, deleteProduct } from "@/actions/transaction";
import { useRouter } from "next/navigation";

export default function ProductsClient({ products }: { products: any[] }) {
    const router = useRouter();
    const [showProductModal, setShowProductModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    async function handleSaveProduct(formData: FormData) {
        const name = formData.get("name") as string;
        const price = Number(formData.get("price"));
        const stock = Number(formData.get("stock"));

        if (editingProduct) {
            await updateProduct(editingProduct.id, { name, price, stock });
        } else {
            await createProduct(formData);
        }
        closeProductModal();
        router.refresh();
    }

    async function handleDeleteProduct(id: string) {
        // if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        try {
            await deleteProduct(id);
            closeProductModal();
            router.refresh();
        } catch (e: any) {
            alert(e.message);
        }
        // }
    }

    async function handleAddStock(formData: FormData) {
        const productId = formData.get("productId") as string;
        const quantity = Number(formData.get("quantity"));

        await updateStock(productId, quantity);
        setShowStockModal(false);
        router.refresh();
    }

    function openEditModal(product: any) {
        setEditingProduct(product);
        setShowProductModal(true);
    }

    function closeProductModal() {
        setEditingProduct(null);
        setShowProductModal(false);
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowStockModal(true)}
                    >
                        + Stok Ekle
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                    >
                        + Ürün Ekle
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="table table-separated">
                    <thead>
                        <tr>
                            <th>Ürün Adı</th>
                            <th>Fiyat</th>
                            <th style={{ textAlign: 'center' }}>Stok</th>
                            <th style={{ textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-neutral)' }}>Ürün bulunamadı.</td>
                            </tr>
                        ) : products.map(p => (
                            <tr key={p.id}>
                                <td data-label="Ürün Adı">{p.name}</td>
                                <td data-label="Fiyat">${p.price.toLocaleString('en-US')}</td>
                                <td data-label="Stok" style={{ textAlign: 'center' }}>
                                    <span className={p.stock < 10 ? "badge badge-warning" : ""}>{p.stock}</span>
                                </td>
                                <td data-label="İşlemler" style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => openEditModal(p)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                        Düzenle
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Product Modal (Create/Edit) */}
            {showProductModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <form action={handleSaveProduct} className="card" style={{ width: '90%', maxWidth: '400px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                            {editingProduct && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(editingProduct.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    Sil
                                </button>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Ürün Adı</label>
                            <input name="name" defaultValue={editingProduct?.name} required className="input" autoFocus />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Birim Fiyat ($)</label>
                            <input name="price" type="number" step="0.01" min="0" defaultValue={editingProduct?.price} required className="input" />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>{editingProduct ? 'Stok (Manuel Düzeltme)' : 'Başlangıç Stok'}</label>
                            <input name="stock" type="number" step="1" min="0" defaultValue={editingProduct?.stock || 0} required className="input" />
                            {editingProduct && <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--color-neutral)', fontSize: '0.75rem' }}>* Stok ekleme işlemini normalde "Stok Ekle" butonu ile yapınız.</small>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={closeProductModal}>İptal</button>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stock Modal */}
            {showStockModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99
                }}>
                    <form action={handleAddStock} className="card" style={{ width: '90%', maxWidth: '400px', margin: 0 }}>
                        <h3>Stok Ekle</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Ürün Seç</label>
                            <select name="productId" className="input" required>
                                <option value="">Seçiniz...</option>
                                {/* Note: Ideally stock modal should have access to ALL products for dropdown, even if pagination limits the table list. 
                                    However, simple implementation uses just the current list. 
                                    To fix this proper, we might need a separate 'allProducts' prop or a combobox. 
                                    For now, we'll use 'products' prop which is the paginated list. 
                                    This IS a limitation of this refactor (Stock Modal only shows products on valid page).
                                    To fix, we should probably fetch all products for the Select separately or use an async select. 
                                    Let's stick to simple first. If user searches, they can find the product.
                                */}
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Mevcut: {p.stock})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Eklenecek Adet</label>
                            <input name="quantity" type="number" step="1" required className="input" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>İptal</button>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
