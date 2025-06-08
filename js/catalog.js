/**
 * @file catalog.js
 * @description Quản lý danh mục sản phẩm/dịch vụ với Firestore.
 */
import * as DOM from './dom.js';
import { db } from './firebase.js';
import { formatCurrency, generateUniqueId } from './utils.js';

let loadedCatalog = [];
let mainCategories = [];

export const getLoadedCatalog = () => [...loadedCatalog];
export const getMainCategories = () => [...mainCategories];

// === MAIN CATEGORY MANAGEMENT (FIRESTORE) ===

export async function loadMainCategories(userId) {
    if (!userId) return;
    try {
        const snapshot = await db.collection('users').doc(userId).collection('mainCategories').get();
        mainCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMainCategoriesTable();
        populateMainCategoryUIs();
    } catch (e) {
        console.error("Lỗi tải danh mục chính:", e);
        mainCategories = [];
    }
}

function renderMainCategoriesTable() {
    DOM.mainCategoriesTableBody.innerHTML = '';
    DOM.mainCategoryCountSpan.textContent = mainCategories.length;

    if (mainCategories.length === 0) {
        DOM.mainCategoriesTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có danh mục chính nào.</td></tr>';
        return;
    }
    
    mainCategories.sort((a,b) => (a.name > b.name) ? 1 : -1).forEach((category, index) => {
        const row = DOM.mainCategoriesTableBody.insertRow();
        row.innerHTML = `
            <td style="text-align:center;">${index + 1}</td>
            <td>${category.name}</td>
            <td class="no-print" style="text-align:center;">
                <button class="edit-btn small-btn" data-id="${category.id}">Sửa</button>
                <button class="delete-btn small-btn" data-id="${category.id}">Xóa</button>
            </td>
        `;
    });
}

function populateMainCategoryUIs() {
    const catalogSelect = DOM.catalogItemMainCategorySelect;
    if (catalogSelect) {
        const currentCatalogSelectValue = catalogSelect.value;
        while (catalogSelect.options.length > 1) catalogSelect.remove(1);
        mainCategories.forEach(category => {
            const option = new Option(category.name, category.id);
            catalogSelect.appendChild(option);
        });
        catalogSelect.value = currentCatalogSelectValue;
    }
    
    if (DOM.mainCategoryDataList) {
        DOM.mainCategoryDataList.innerHTML = '';
        mainCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            DOM.mainCategoryDataList.appendChild(option);
        });
    }
}

export async function addOrUpdateMainCategoryHandler(userId) {
    if (!userId) return;
    const name = DOM.mainCategoryNameInput.value.trim();
    const editingId = DOM.editingMainCategoryIdInput.value;

    if (!name) {
        alert('Tên danh mục chính không được để trống.');
        return;
    }
    if (mainCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase() && cat.id !== editingId)) {
        alert('Tên danh mục chính này đã tồn tại.');
        return;
    }

    try {
        const docRef = editingId 
            ? db.collection('users').doc(userId).collection('mainCategories').doc(editingId)
            : db.collection('users').doc(userId).collection('mainCategories').doc();
        
        await docRef.set({ name }, { merge: true });

        await loadMainCategories(userId); // Tải lại để cập nhật UI
        resetMainCategoryForm();
        alert(editingId ? "Đã cập nhật danh mục." : "Đã thêm danh mục mới.");
    } catch (e) {
        console.error("Lỗi lưu danh mục chính:", e);
        alert("Đã có lỗi xảy ra khi lưu.");
    }
}

export function editMainCategory(id) {
    const category = mainCategories.find(cat => cat.id === id);
    if (category) {
        DOM.mainCategoryNameInput.value = category.name;
        DOM.editingMainCategoryIdInput.value = category.id;
        DOM.addOrUpdateMainCategoryButton.textContent = 'Cập nhật DM Chính';
        DOM.cancelEditMainCategoryButton.style.display = 'inline-block';
        DOM.mainCategoryNameInput.focus();
    }
}

export async function deleteMainCategory(id, userId) {
    if (!userId) return;
    const category = mainCategories.find(cat => cat.id === id);
    if (!category) return;

    if (confirm(`Bạn chắc chắn muốn xóa danh mục "${category.name}"?`)) {
        try {
            await db.collection('users').doc(userId).collection('mainCategories').doc(id).delete();
            // Cần thêm logic cập nhật các hạng mục con nếu có
            await loadMainCategories(userId);
            alert(`Đã xóa danh mục "${category.name}".`);
        } catch(e) {
            console.error("Lỗi xóa danh mục:", e);
            alert("Lỗi khi xóa danh mục.");
        }
    }
}

export function resetMainCategoryForm() {
    DOM.mainCategoryNameInput.value = '';
    DOM.editingMainCategoryIdInput.value = '';
    DOM.addOrUpdateMainCategoryButton.textContent = 'Thêm/Cập nhật DM Chính';
    DOM.cancelEditMainCategoryButton.style.display = 'none';
}

export async function findOrCreateMainCategory(name, userId) {
    if (!name || !userId) return null;

    const trimmedName = name.trim();
    const existingCategory = mainCategories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingCategory) {
        return existingCategory.id;
    }
    
    try {
        const newDocRef = db.collection('users').doc(userId).collection('mainCategories').doc();
        const newCategory = { id: newDocRef.id, name: trimmedName };
        await newDocRef.set({ name: trimmedName });
        
        mainCategories.push(newCategory); // Cập nhật state cục bộ
        renderMainCategoriesTable();
        populateMainCategoryUIs();
        
        return newCategory.id;
    } catch (e) {
        console.error("Lỗi tạo DM chính mới:", e);
        return null;
    }
}


// === CATALOG ITEM MANAGEMENT (FIRESTORE) ===

export async function loadCatalogFromFirestore(userId) {
    if (!userId) return;
    try {
        const snapshot = await db.collection('users').doc(userId).collection('catalog').get();
        loadedCatalog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        populateCatalogDatalist();
        renderCatalogPreviewTable();
    } catch(e) {
        console.error("Lỗi tải danh mục sản phẩm:", e);
        loadedCatalog = [];
    }
}

export function handleExcelFileGeneric(event, userId) {
    const file = event.target.files[0];
    if (!file || !userId) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
            
            // ... (Phần xử lý, map cột trong file Excel vẫn giữ nguyên)
            // ...

            const catalogBatch = db.batch();
            const collectionRef = db.collection('users').doc(userId).collection('catalog');

            jsonData.forEach(row => {
                 const newId = generateUniqueId('cat');
                 const docRef = collectionRef.doc(newId);
                 const mappedData = {
                    // map dữ liệu từ row sang cấu trúc của Firestore
                    name: String(row['TenHangMuc'] || row['tenhangmuc'] || '').trim(),
                    spec: String(row['QuyCach'] || row['quycach'] || '').trim(),
                    unit: String(row['DonViTinh'] || row['donvitinh'] || '').trim(),
                    price: parseFloat(String(row['DonGia'] || row['dongia']).replace(/[^0-9.-]+/g, "")) || 0
                 };
                 catalogBatch.set(docRef, mappedData);
            });

            await catalogBatch.commit();
            alert(`Đã nhập thành công ${jsonData.length} hạng mục từ Excel lên đám mây.`);
            await loadCatalogFromFirestore(userId);

        } catch (error) {
            console.error("Lỗi đọc Excel hoặc ghi Firestore:", error);
            alert(`Lỗi: ${error.message}.`);
        }
    };
    reader.readAsArrayBuffer(file);
}

export function populateCatalogDatalist() {
    if (!DOM.catalogDatalist) return;
    DOM.catalogDatalist.innerHTML = '';
    
    loadedCatalog.forEach((item) => {
        const option = document.createElement('option');
        let displayText = `${item.name} (${formatCurrency(item.price)}/${item.unit})`;
        option.value = displayText;
        option.dataset.itemId = item.id;
        DOM.catalogDatalist.appendChild(option);
    });
}

export function renderCatalogPreviewTable() {
    // ... (Hàm này không thay đổi, chỉ cần state `loadedCatalog` được cập nhật)
    if (!DOM.catalogPreviewList || !DOM.catalogItemCount) return;
    const searchTerm = DOM.catalogSearchInput ? DOM.catalogSearchInput.value.toLowerCase() : '';
    const filteredCatalog = loadedCatalog.filter(item => {
        if (!searchTerm) return true;
        const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
        const specMatch = item.spec && item.spec.toLowerCase().includes(searchTerm);
        return nameMatch || specMatch;
    });
    DOM.catalogPreviewList.innerHTML = '';
    DOM.catalogItemCount.textContent = filteredCatalog.length;
    if (filteredCatalog.length > 0) {
        filteredCatalog.forEach(item => {
            const row = DOM.catalogPreviewList.insertRow();
            row.innerHTML = `
                <td>${item.id.substring(0,8)}...</td> 
                <td style="white-space: pre-wrap; max-width: 250px;">${item.name}</td>
                <td style="white-space: pre-wrap; max-width: 200px;">${item.spec || ''}</td> 
                <td>${item.unit}</td> <td>${formatCurrency(item.price)}</td>
                <td class="no-print">
                    <button class="edit-btn small-btn" data-id="${item.id}">Sửa</button>
                    <button class="delete-btn small-btn" data-id="${item.id}">Xóa</button>
                </td>`;
        });
    } else {
        DOM.catalogPreviewList.innerHTML = '<tr><td colspan="6" style="text-align:center;">Không tìm thấy hạng mục hoặc danh mục trống.</td></tr>';
    }
}

export function editCatalogEntry(entryId) {
    const item = loadedCatalog.find(i => i.id === entryId);
    if (item) {
        DOM.editingCatalogEntryIdInput.value = item.id;
        DOM.catalogEditNameInput.value = item.name;
        DOM.catalogEditSpecInput.value = item.spec || '';
        DOM.catalogEditUnitInput.value = item.unit;
        DOM.catalogEditPriceInput.value = item.price;
        DOM.saveCatalogEntryButton.textContent = 'Cập nhật';
        DOM.cancelCatalogEntryEditButton.style.display = 'inline-block';
        DOM.catalogEditNameInput.focus();
    }
};

export async function deleteCatalogEntry(entryId, userId) {
    if (!userId) return;
    if (confirm(`Xóa hạng mục này khỏi danh mục trên đám mây?`)) {
        try {
            await db.collection('users').doc(userId).collection('catalog').doc(entryId).delete();
            await loadCatalogFromFirestore(userId); // Tải lại
            alert('Đã xóa hạng mục.');
        } catch (e) {
            console.error("Lỗi xóa hạng mục DM:", e);
            alert("Đã có lỗi xảy ra.");
        }
    }
};

export async function saveCatalogEntryHandler(userId) {
    if (!userId) return;
    const id = DOM.editingCatalogEntryIdInput.value;
    const itemData = {
        name: DOM.catalogEditNameInput.value.trim(),
        spec: DOM.catalogEditSpecInput.value.trim(),
        unit: DOM.catalogEditUnitInput.value.trim(),
        price: parseFloat(DOM.catalogEditPriceInput.value) || 0,
        mainCategoryId: DOM.catalogItemMainCategorySelect.value || "",
    };
    if (!itemData.name || !itemData.unit || itemData.price < 0) {
        alert('Thông tin không hợp lệ.');
        return;
    }
    
    try {
        const docRef = id
            ? db.collection('users').doc(userId).collection('catalog').doc(id)
            : db.collection('users').doc(userId).collection('catalog').doc();
        
        await docRef.set(itemData, { merge: true });
        
        await loadCatalogFromFirestore(userId);
        resetCatalogEditForm();
        alert(id ? 'Đã cập nhật.' : 'Đã thêm mới.');

    } catch (e) {
        console.error("Lỗi lưu hạng mục DM:", e);
        alert("Đã xảy ra lỗi khi lưu.");
    }
};

export function resetCatalogEditForm() {
    DOM.editingCatalogEntryIdInput.value = '';
    DOM.catalogEditNameInput.value = '';
    DOM.catalogEditSpecInput.value = '';
    DOM.catalogEditUnitInput.value = '';
    DOM.catalogEditPriceInput.value = '';
    if (DOM.catalogItemMainCategorySelect) DOM.catalogItemMainCategorySelect.value = "";
    DOM.saveCatalogEntryButton.textContent = 'Thêm vào Danh mục';
    DOM.cancelCatalogEntryEditButton.style.display = 'none';
}

export function exportCatalogHandler() {
    // ... (Hàm này không thay đổi, vì nó export từ state `loadedCatalog` hiện tại)
    if (loadedCatalog.length === 0) {
        alert('Không có dữ liệu danh mục để xuất.');
        return;
    }
    const workbook = XLSX.utils.book_new();
    const catalogItemsData = loadedCatalog.map(item => ({
        ID: item.id,
        tenhangmuc: item.name,
        quycach: item.spec || '',
        donvitinh: item.unit,
        dongia: item.price
    }));
    const ws = XLSX.utils.json_to_sheet(catalogItemsData);
    XLSX.utils.book_append_sheet(workbook, ws, "QL hang muc");
    XLSX.writeFile(workbook, `DanhMuc_${new Date().toISOString().slice(0,10)}.xlsx`);
}

export async function saveItemToMasterCatalog(itemData, userId) {
    if (!userId) {
         alert("Lỗi: Không xác định được người dùng.");
         return;
    }
    // Logic kiểm tra trùng có thể phức tạp hơn với Firestore,
    // ở đây ta đơn giản hóa bằng cách thêm mới hoặc ghi đè nếu có ID.
    try {
        const docRef = itemData.id 
            ? db.collection('users').doc(userId).collection('catalog').doc(itemData.id)
            : db.collection('users').doc(userId).collection('catalog').doc();
        
        await docRef.set(itemData, { merge: true });

        await loadCatalogFromFirestore(userId);
        alert(`"${itemData.name}" đã được lưu/cập nhật vào danh mục trên đám mây.`);
    } catch (e) {
        console.error("Lỗi lưu nhanh vào DM:", e);
        alert("Đã có lỗi khi lưu vào danh mục.");
    }
}
    