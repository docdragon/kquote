/**
 * @file catalog.js
 * @description Quản lý tất cả logic liên quan đến danh mục sản phẩm/dịch vụ.
 */
import * as DOM from './dom.js';
import {
    formatCurrency,
    generateUniqueId
} from './utils.js';

let loadedCatalog = [];
let mainCategories = [];

export const getLoadedCatalog = () => [...loadedCatalog];
export const getMainCategories = () => [...mainCategories];


// === MAIN CATEGORY MANAGEMENT ===

export function loadMainCategories() {
    const storedMainCategories = localStorage.getItem('mainCategories');
    if (storedMainCategories) {
        try {
            mainCategories = JSON.parse(storedMainCategories);
        } catch (e) {
            console.error("Error parsing main categories from localStorage", e);
            mainCategories = [];
        }
    } else {
        mainCategories = [];
    }
    renderMainCategoriesTable();
    populateMainCategoryUIs();
}

function saveMainCategories() {
    try {
        localStorage.setItem('mainCategories', JSON.stringify(mainCategories));
    } catch (e) {
        console.error("Error saving main categories to localStorage", e);
    }
}

function renderMainCategoriesTable() {
    if (!DOM.mainCategoriesTableBody || !DOM.mainCategoryCountSpan) return;
    DOM.mainCategoriesTableBody.innerHTML = '';
    DOM.mainCategoryCountSpan.textContent = mainCategories.length;

    if (mainCategories.length === 0) {
        DOM.mainCategoriesTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Chưa có danh mục chính nào.</td></tr>';
        return;
    }

    mainCategories.forEach((category, index) => {
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
    // Cập nhật cho select trong tab Quản lý
    const catalogSelect = DOM.catalogItemMainCategorySelect;
    if (catalogSelect) {
        const currentCatalogSelectValue = catalogSelect.value;
        while (catalogSelect.options.length > 1) {
            catalogSelect.remove(1);
        }
        mainCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            catalogSelect.appendChild(option);
        });
        catalogSelect.value = currentCatalogSelectValue;
    }

    // Cập nhật cho datalist (combobox) trong tab Báo giá
    const datalist = DOM.mainCategoryDataList;
    if (datalist) {
        datalist.innerHTML = '';
        mainCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            datalist.appendChild(option);
        });
    }
}


export function addOrUpdateMainCategoryHandler() {
    const name = DOM.mainCategoryNameInput.value.trim();
    const editingId = DOM.editingMainCategoryIdInput.value;

    if (!name) {
        alert('Tên danh mục chính không được để trống.');
        return;
    }

    if (editingId) {
        const categoryIndex = mainCategories.findIndex(cat => cat.id === editingId);
        if (categoryIndex > -1) mainCategories[categoryIndex].name = name;
    } else {
        if (mainCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('Tên danh mục chính này đã tồn tại.');
            return;
        }
        mainCategories.push({
            id: generateUniqueId('mc'),
            name: name
        });
    }
    saveMainCategories();
    renderMainCategoriesTable();
    populateMainCategoryUIs();
    resetMainCategoryForm();
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

export function deleteMainCategory(id, {
    getCurrentQuoteItems,
    getSavedQuotes,
    updateQuoteItem,
    updateSavedQuote
}) {
    const category = mainCategories.find(cat => cat.id === id);
    if (!category) return;

    if (confirm(`Bạn có chắc chắn muốn xóa danh mục chính "${category.name}"?\nLƯU Ý: Các hạng mục sản phẩm/dịch vụ và các hạng mục trong báo giá đang thuộc danh mục này sẽ được bỏ liên kết.`)) {
        mainCategories = mainCategories.filter(cat => cat.id !== id);

        loadedCatalog.forEach(item => {
            if (item.mainCategoryId === id) item.mainCategoryId = "";
        });
        saveCatalogToLocalStorage();
        renderCatalogPreviewTable();

        getCurrentQuoteItems().forEach(item => {
            if (item.mainCategoryId === id) {
                updateQuoteItem(item.id, { mainCategoryId: "" });
            }
        });
        
        getSavedQuotes().forEach(quote => {
            let quoteUpdated = false;
            quote.items.forEach(item => {
                if (item.mainCategoryId === id) {
                    item.mainCategoryId = "";
                    quoteUpdated = true;
                }
            });
            if(quoteUpdated) updateSavedQuote(quote.id, quote);
        });
        
        saveMainCategories();
        renderMainCategoriesTable();
        populateMainCategoryUIs();
        if (DOM.editingMainCategoryIdInput.value === id) resetMainCategoryForm(); 
        alert(`Đã xóa danh mục chính "${category.name}".`);
    }
}


export function resetMainCategoryForm() {
    DOM.mainCategoryNameInput.value = '';
    DOM.editingMainCategoryIdInput.value = '';
    DOM.addOrUpdateMainCategoryButton.textContent = 'Thêm/Cập nhật DM Chính';
    if (DOM.cancelEditMainCategoryButton) DOM.cancelEditMainCategoryButton.style.display = 'none';
}


export function findOrCreateMainCategory(name) {
    if (!name || name.trim() === '') {
        return null;
    }
    const trimmedName = name.trim();
    const existingCategory = mainCategories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingCategory) {
        return existingCategory.id;
    }
    
    const newCategory = {
        id: generateUniqueId('mc'),
        name: trimmedName
    };
    mainCategories.push(newCategory);
    saveMainCategories();
    renderMainCategoriesTable();
    populateMainCategoryUIs();
    console.log(`Đã tạo mới danh mục chính: "${trimmedName}"`);
    return newCategory.id;
}


// === CATALOG ITEM MANAGEMENT ===

function saveCatalogToLocalStorage() {
    try {
        localStorage.setItem('loadedExcelCatalog', JSON.stringify(loadedCatalog));
    } catch (e) {
        console.error("Error saving catalog to localStorage", e);
    }
}

export function loadCatalogFromLocalStorage() {
    const savedCatalog = localStorage.getItem('loadedExcelCatalog');
    if (savedCatalog) {
        try {
            loadedCatalog = JSON.parse(savedCatalog);
        } catch (e) {
            console.error("Error parsing catalog from localStorage", e);
            loadedCatalog = [];
        }
    }
    populateCatalogDatalist();
    renderCatalogPreviewTable();
}

export function handleExcelFileGeneric(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        try {
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });

            if (jsonData.length === 0) {
                alert('File Excel trống.');
                return;
            }

            const normalizeKey = (key) => {
                if (typeof key !== 'string') return '';
                return key.toLowerCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/\s+/g, '');
            };
            
            const columnMapping = {
                id: ['id'],
                mainCategoryId: ['madanhmucchinh'],
                name: ['tenhangmuc', 'tenhang'],
                spec: ['quycach', 'mota', 'ghichu'],
                unit: ['donvitinh', 'dvt'],
                price: ['dongia', 'gia']
            };

            const reverseColumnMapping = {};
            Object.keys(columnMapping).forEach(standardKey => {
                columnMapping[standardKey].forEach(variation => {
                    reverseColumnMapping[variation] = standardKey;
                });
            });

            const normalizedData = jsonData.map(row => {
                const newRow = {};
                for (const key in row) {
                    const normalized = normalizeKey(key);
                    const standardKey = reverseColumnMapping[normalized];
                    if (standardKey) {
                        newRow[standardKey] = row[key];
                    } else {
                        newRow[key] = row[key];
                    }
                }
                return newRow;
            });
            
            const firstRow = normalizedData[0];
            if (!firstRow || !firstRow.name || !firstRow.unit || typeof firstRow.price === 'undefined') {
                alert('LỖI: File Excel phải có các cột tương ứng với: "Tên Hàng Mục", "Đơn Vị Tính", và "Đơn Giá".\nVui lòng kiểm tra lại tên cột trong file của bạn.');
                if (event.target) event.target.value = '';
                return;
            }
            
            loadedCatalog = normalizedData.map(row => ({
                id: String(row.id || generateUniqueId('excel')).trim(),
                name: String(row.name || '').trim(),
                spec: String(row.spec || '').trim(),
                mainCategoryId: String(row.mainCategoryId || '').trim(),
                unit: String(row.unit || '').trim(),
                price: parseFloat(String(row.price).replace(/[^0-9.-]+/g, "")) || 0
            }));
            
            populateCatalogDatalist();
            renderCatalogPreviewTable();
            saveCatalogToLocalStorage();
            alert(`Đã tải thành công ${loadedCatalog.length} hạng mục.`);

        } catch (error) {
            console.error("Lỗi đọc Excel:", error);
            alert(`Lỗi đọc Excel: ${error.message}.`);
            if (event.target) event.target.value = '';
        }
    };
    reader.onerror = function(error) {
        console.error("Lỗi FileReader:", error);
        alert("Không thể đọc file.");
    };
    reader.readAsArrayBuffer(file);
}


export function populateCatalogDatalist() {
    if (!DOM.catalogDatalist) return;
    DOM.catalogDatalist.innerHTML = '';
    
    loadedCatalog.forEach((item) => {
        const option = document.createElement('option');
        let displayText = item.name;
        if (item.spec) displayText += ` (${item.spec.substring(0, 30)}${item.spec.length > 30 ? '...' : ''})`;
        displayText += ` - ${formatCurrency(item.price)}/${item.unit}`;
        
        option.value = displayText;
        option.dataset.itemId = item.id;
        DOM.catalogDatalist.appendChild(option);
    });
}

export function renderCatalogPreviewTable() {
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
                <td>${item.id}</td> 
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
        if (DOM.catalogItemMainCategorySelect) DOM.catalogItemMainCategorySelect.value = item.mainCategoryId || "";
        DOM.catalogEditUnitInput.value = item.unit;
        DOM.catalogEditPriceInput.value = item.price;
        DOM.saveCatalogEntryButton.textContent = 'Cập nhật';
        DOM.cancelCatalogEntryEditButton.style.display = 'inline-block';
        DOM.catalogEditNameInput.focus();
    }
};

export function deleteCatalogEntry(entryId) {
    if (confirm(`Xóa hạng mục ID: ${entryId} khỏi danh mục?`)) {
        loadedCatalog = loadedCatalog.filter(item => item.id !== entryId);
        saveCatalogToLocalStorage();
        renderCatalogPreviewTable();
        populateCatalogDatalist();
        alert('Đã xóa hạng mục.');
    }
};

export function saveCatalogEntryHandler() {
    const id = DOM.editingCatalogEntryIdInput.value;
    const name = DOM.catalogEditNameInput.value.trim();
    const spec = DOM.catalogEditSpecInput.value.trim();
    const unit = DOM.catalogEditUnitInput.value.trim();
    const price = parseFloat(DOM.catalogEditPriceInput.value);
    const mainCatId = DOM.catalogItemMainCategorySelect ? DOM.catalogItemMainCategorySelect.value : "";
    if (!name || !unit || isNaN(price) || price < 0) {
        alert('Thông tin không hợp lệ.');
        return;
    }
    if (id) {
        const itemIndex = loadedCatalog.findIndex(i => i.id === id);
        if (itemIndex > -1) loadedCatalog[itemIndex] = { ...loadedCatalog[itemIndex],
            name, spec, unit, price, mainCategoryId: mainCatId
        };
    } else {
        loadedCatalog.push({
            id: generateUniqueId('cat'), name, spec, unit, price, mainCategoryId: mainCatId
        });
    }
    saveCatalogToLocalStorage();
    renderCatalogPreviewTable();
    populateCatalogDatalist();
    resetCatalogEditForm();
    alert(id ? 'Đã cập nhật.' : 'Đã thêm mới.');

    if (DOM.catalogPreviewTable) {
        DOM.catalogPreviewTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    if (mainCategories.length === 0 && loadedCatalog.length === 0) {
        alert('Không có dữ liệu danh mục để xuất.');
        return;
    }

    const workbook = XLSX.utils.book_new();

    const catalogItemsData = loadedCatalog.map(item => ({
        ID: item.id.startsWith('excel-') ? '' : item.id,
        tenhangmuc: item.name,
        quycach: item.spec || '',
        donvitinh: item.unit,
        dongia: item.price
    }));
    const ws2 = XLSX.utils.json_to_sheet(catalogItemsData);
    XLSX.utils.book_append_sheet(workbook, ws2, "QL hang muc");

    if (mainCategories.length > 0) {
        const mainCategoriesData = mainCategories.map(cat => ({
            ID: cat.id,
            Tendanhmucchinh: cat.name
        }));
        const ws1 = XLSX.utils.json_to_sheet(mainCategoriesData);
        XLSX.utils.book_append_sheet(workbook, ws1, "QL DM Chính");
    }

    XLSX.writeFile(workbook, `TongHopDanhMuc_${new Date().toISOString().slice(0,10)}.xlsx`);
    alert('Đã xuất tổng hợp danh mục ra file Excel.');
};


export function saveItemToMasterCatalog(name, spec, unit, price, mainCatId = "") {
    const existingCatalogItem = loadedCatalog.find(item =>
        item.name.toLowerCase() === name.toLowerCase() &&
        (item.spec || '').toLowerCase() === (spec || '').toLowerCase()
    );
    if (existingCatalogItem) {
        if (!confirm(`"${name}${spec ? ' - ' + spec : ''}" đã có trong DM. Cập nhật giá và ĐVT không?`)) return;
        existingCatalogItem.unit = unit;
        existingCatalogItem.price = price;
        existingCatalogItem.mainCategoryId = mainCatId || existingCatalogItem.mainCategoryId || "";
    } else {
        loadedCatalog.push({
            id: generateUniqueId('cat'),
            name,
            spec,
            unit,
            price,
            mainCategoryId: mainCatId
        });
    }

    saveCatalogToLocalStorage();
    populateCatalogDatalist();
    renderCatalogPreviewTable();
    alert(`"${name}${spec ? ' (' + spec + ')' : ''}" đã lưu/cập nhật vào DM chính.`);
}
