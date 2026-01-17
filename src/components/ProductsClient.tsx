"use client";

import { useState, useRef } from "react";
import { createProduct, updateStock, updateProduct, deleteProduct } from "@/actions/transaction";
import { useRouter } from "next/navigation";

export default function ProductsClient({ products }: { products: any[] }) {
    const router = useRouter();
    const [showProductModal, setShowProductModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Image & Price Calculation States
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
    const [cost, setCost] = useState<number>(0);

    // Product Group State (Current selection)
    const [selectedProductGroup, setSelectedProductGroup] = useState<string>("Ekran");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSimpleMode = ["Ekran", "Ekran Koruma", "Kumanda"].includes(selectedProductGroup);

    // Reset states when modal closes/opens
    const resetForm = () => {
        setImagePreview(null);
        setCalculatedPrice(0);
        setCost(0);
        setEditingProduct(null);
        setSelectedProductGroup("Ekran");
    };

    async function handleSaveProduct(formData: FormData) {
        // Append image data if available
        if (imagePreview) {
            formData.set("imageUrl", imagePreview);
        }

        if (editingProduct) {
            await updateProduct(editingProduct.id, formData);
        } else {
            await createProduct(formData);
        }
        closeProductModal();
        router.refresh();
    }

    async function handleDeleteProduct(id: string) {
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
            try {
                await deleteProduct(id);
                closeProductModal();
                router.refresh();
            } catch (e: any) {
                alert(e.message);
            }
        }
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
        setImagePreview(product.imageUrl || null);
        setCost(product.cost || 0);
        setCalculatedPrice(product.price || 0);
        // Correctly set the group from existing product
        setSelectedProductGroup(product.productGroup || "Ekran");
        setShowProductModal(true);
    }

    function closeProductModal() {
        resetForm();
        setShowProductModal(false);
    }

    // Image Processing
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: any) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Resize logic: Max 800px width
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 800;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/webp', 0.8);
                    setImagePreview(dataUrl);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // Price Calculation
    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setCost(val);
        // %30 profit margin logic: Price = Cost * 1.30
        const suggestedPrice = Number((val * 1.30).toFixed(2));
        setCalculatedPrice(suggestedPrice);
    };

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
                        onClick={() => { resetForm(); setShowProductModal(true); }}
                    >
                        + Ürün Ekle
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="table table-separated">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>Görsel</th>
                            <th>Ürün Adı</th>
                            <th>Grup</th>
                            <th>Fiyat</th>
                            <th style={{ textAlign: 'center' }}>Stok</th>
                            <th style={{ textAlign: 'right' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-neutral)' }}>Ürün bulunamadı.</td>
                            </tr>
                        ) : products.map(p => (
                            <tr key={p.id}>
                                <td>
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', background: 'var(--surface-hover)', borderRadius: '4px' }}></div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral)' }}>
                                        {p.compatibleBrand} {p.compatibleModels}
                                    </div>
                                </td>
                                <td>{p.productGroup || '-'}</td>
                                <td>${p.price.toLocaleString('en-US')}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={p.stock < 5 ? "badge badge-danger" : (p.stock < 10 ? "badge badge-warning" : "badge")}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
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
                    <form action={handleSaveProduct} className="card"
                        style={{
                            width: '90%',
                            maxWidth: '800px',
                            maxHeight: '85vh',  // Reduced slightly to ensure fit on mobile
                            overflowY: 'auto',
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
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

                        {/* Form Content - Scrollable Part */}
                        <div style={{ flex: 1, paddingBottom: isSimpleMode ? '0' : '0' }}>

                            {/* Product Group - Always Top */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Ürün Grubu *</label>
                                <select
                                    name="productGroup"
                                    value={selectedProductGroup}
                                    onChange={(e) => setSelectedProductGroup(e.target.value)}
                                    required
                                    className="input"
                                    style={{ height: '42px', width: '100%', fontSize: '1rem' }}
                                >
                                    <option value="Ekran">Ekran (Varsayılan)</option>
                                    <option value="Ekran Koruma">Ekran Koruma</option>
                                    <option value="Kumanda">Kumanda</option>
                                    <option value="LGP">LGP</option>
                                    <option value="Led">Led</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            {/* Basic Info (Common to all) */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Ürün Adı *</label>
                                <input name="name" defaultValue={editingProduct?.name} required className="input" style={{ width: '100%' }} />
                            </div>

                            {/* Financials & Stock (Common to all) */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                background: 'var(--surface-hover)',
                                padding: '1rem',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <label>Maliyet ($)</label>
                                    <input
                                        name="cost"
                                        type="number"
                                        step="0.01"
                                        value={cost}
                                        onChange={handleCostChange}
                                        className="input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label>Satış Fiyatı ($)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        value={calculatedPrice}
                                        onChange={(e) => setCalculatedPrice(Number(e.target.value))}
                                        required
                                        className="input"
                                        style={{ width: '100%', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div>
                                    <label>Stok Adedi</label>
                                    <input
                                        name="stock"
                                        type="number"
                                        defaultValue={editingProduct?.stock || 0}
                                        required
                                        className="input"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>


                            {/* Complex Fields - Only shown if NOT simple mode */}
                            {!isSimpleMode && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                                    {/* Detailed Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>Led St Kodu</label>
                                                <input name="ledStCode" defaultValue={editingProduct?.ledStCode} className="input" />
                                            </div>
                                            <div>
                                                <label>Led Kodu</label>
                                                <input name="ledCode" defaultValue={editingProduct?.ledCode} className="input" />
                                            </div>
                                        </div>

                                        <div>
                                            <label>Uyumlu Marka</label>
                                            <input name="compatibleBrand" defaultValue={editingProduct?.compatibleBrand} className="input" placeholder="Örn: Samsung" />
                                        </div>

                                        <div>
                                            <label>Uyumlu Modeller</label>
                                            <textarea name="compatibleModels" defaultValue={editingProduct?.compatibleModels} className="input" rows={3} placeholder="Model kodlarını yazınız..." />
                                        </div>
                                    </div>

                                    {/* Inventory & Supplier */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label>İnç</label>
                                                <input name="inch" type="number" defaultValue={editingProduct?.inch} className="input" />
                                            </div>
                                            <div>
                                                <label>Depo Konumu</label>
                                                <input name="location" defaultValue={editingProduct?.location} className="input" />
                                            </div>
                                        </div>

                                        <div>
                                            <label>Tedarikçi</label>
                                            <input
                                                name="supplierName"
                                                list="suppliers"
                                                defaultValue={editingProduct?.supplier?.name}
                                                className="input"
                                                placeholder="Seçiniz veya yazınız"
                                            />
                                        </div>

                                        <div>
                                            <label>Ürün Görseli</label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    height: '100px',
                                                    border: '2px dashed var(--border)',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    marginTop: '0.5rem',
                                                    overflow: 'hidden',
                                                    position: 'relative'
                                                }}
                                            >
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ color: 'var(--color-neutral)' }}>Fotoğraf Seç</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Buttons - Sticky bottom with padding */}
                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '1.5rem',
                            paddingBottom: '2.5rem', // Extra padding for mobile navbar clearance
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.5rem',
                            background: 'var(--surface)',  // Ensure it covers content behind it
                            position: 'sticky',
                            bottom: 0,
                            zIndex: 10
                        }}>
                            <button type="button" className="btn btn-secondary" onClick={closeProductModal}>İptal</button>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Kaydet</button>
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
