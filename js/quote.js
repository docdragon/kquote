/**
 * @file quote.js
 * @description Quản lý tất cả logic liên quan đến một báo giá.
 */

import * as DOM from './dom.js';
import {
    formatCurrency,
    formatDate,
    generateProfessionalQuoteId,
    generateUniqueId,
    numberToRoman,
} from './utils.js';
import {
    getLoadedCatalog,
    saveItemToMasterCatalog,
    getMainCategories,
    findOrCreateMainCategory,
    populateCatalogDatalist
} from './catalog.js';
import {
    openTab
} from './ui.js';


// === STATE ===
let currentQuoteItems = [];
let savedQuotes = [];
let companySettings = {
    bankAccount: ''
};
let currentQuoteIdInternal = null;
let itemImageDataBase64QuoteForm = null;
let quoteInstallmentData = {
    apply: false,
    installments: []
};

// === GETTERS / SETTERS ===
export const getCurrentQuoteItems = () => [...currentQuoteItems];
export const getSavedQuotes = () => [...savedQuotes];
export const getCompanySettings = () => ({ ...companySettings
});
export const getCurrentQuoteId = () => currentQuoteIdInternal;

export const getQuoteInstallmentData = () => ({ ...quoteInstallmentData
});


export const updateQuoteItem = (itemId, updatedProps) => {
    const itemIndex = currentQuoteItems.findIndex(item => item.id === itemId);
    if (itemIndex > -1) { 
        currentQuoteItems[itemIndex] = { ...currentQuoteItems[itemIndex], ...updatedProps }; 
    }
    renderQuoteItemsPreview();
    saveQuoteToLocalStorage();
};

export const updateSavedQuote = (quoteId, updatedQuoteData) => {
    const quoteIndex = savedQuotes.findIndex(q => q.id === quoteId);
    if(quoteIndex > -1) {
        savedQuotes[quoteIndex] = updatedQuoteData;
    }
    saveQuotesListToLocalStorage();
};

// === LOCALSTORAGE INTERACTION ===
function saveQuoteToLocalStorage() {
    updateInstallmentState(); 
    
    const quoteData = {
        id: currentQuoteIdInternal,
        customerName: DOM.customerNameInput.value,
        customerAddress: DOM.customerAddressInput.value,
        quoteDate: DOM.quoteDateInput.value,
        quoteNotes: DOM.quoteNotesInput.value,
        items: currentQuoteItems,
        applyDiscount: DOM.applyDiscountCheckbox.checked,
        discountValue: DOM.discountValueInput.value,
        discountType: DOM.discountTypeSelect.value,
        applyTax: DOM.applyTaxCheckbox.checked,
        taxPercent: DOM.taxPercentInput.value,
        installmentData: quoteInstallmentData, 
        timestamp: currentQuoteIdInternal ? parseInt(String(currentQuoteIdInternal).split('-')[1] || Date.now()) : Date.now()
    };
    try {
        localStorage.setItem('currentWorkingQuote', JSON.stringify(quoteData));
    } catch (e) {
        console.error("Error saving current quote to localStorage", e);
    }
};

export function loadCurrentWorkingQuoteFromLocalStorage() {
    const savedData = localStorage.getItem('currentWorkingQuote');
    if (savedData) {
        try {
            const quoteData = JSON.parse(savedData);
            currentQuoteIdInternal = quoteData.id || generateProfessionalQuoteId();
            DOM.customerNameInput.value = quoteData.customerName || '';
            DOM.customerAddressInput.value = quoteData.customerAddress || '';
            DOM.quoteDateInput.value = quoteData.quoteDate || new Date().toISOString().split('T')[0];
            DOM.quoteNotesInput.value = quoteData.quoteNotes || '';
            currentQuoteItems = quoteData.items || [];
            DOM.applyDiscountCheckbox.checked = typeof quoteData.applyDiscount === 'boolean' ? quoteData.applyDiscount : true;
            DOM.discountValueInput.value = quoteData.discountValue || '0';
            DOM.discountTypeSelect.value = quoteData.discountType || 'percent';
            
            DOM.applyTaxCheckbox.checked = typeof quoteData.applyTax === 'boolean' ? quoteData.applyTax : true;
            DOM.taxPercentInput.value = quoteData.taxPercent || '0';
            
            quoteInstallmentData = quoteData.installmentData || { apply: false, installments: [] };
            DOM.applyInstallmentsCheckbox.checked = quoteInstallmentData.apply;
            if (DOM.installmentsContainer) DOM.installmentsContainer.style.display = quoteInstallmentData.apply ? 'flex' : 'none';
            if (quoteInstallmentData.installments && quoteInstallmentData.installments.length > 0) {
                for (let i = 1; i <= 4; i++) {
                    const inst = quoteInstallmentData.installments[i-1];
                    if (inst) {
                        DOM[`installmentName${i}`].value = inst.name || '';
                        DOM[`installmentValue${i}`].value = inst.value || '';
                        DOM[`installmentType${i}`].value = inst.type || 'percent';
                    }
                }
            }

        } catch (e) {
            console.error("Error parsing current quote from localStorage. Starting fresh.", e);
            localStorage.removeItem('currentWorkingQuote');
            startNewQuote();
        }
    } else {
        startNewQuote();
    }
    if (DOM.discountValueInput) DOM.discountValueInput.disabled = !DOM.applyDiscountCheckbox.checked;
    if (DOM.discountTypeSelect) DOM.discountTypeSelect.disabled = !DOM.applyDiscountCheckbox.checked;
    if (DOM.taxPercentInput) DOM.taxPercentInput.disabled = !DOM.applyTaxCheckbox.checked;
    renderQuoteItemsPreview();
    calculateTotals();
};

function saveQuotesListToLocalStorage() {
    try {
        localStorage.setItem('savedQuotesList', JSON.stringify(savedQuotes));
    } catch (e) {
        console.error("Error saving quotes list to localStorage", e);
    }
};

export function loadSavedQuotesFromLocalStorage() {
    const data = localStorage.getItem('savedQuotesList');
    try {
        savedQuotes = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error parsing saved quotes from localStorage", e);
        savedQuotes = [];
    }
};

// === QUOTE ITEM MANAGEMENT ===
export function handleCatalogComboboxSelection(event) {
    const inputValue = event.target.value;

    const selectedOption = Array.from(DOM.catalogDatalist.options).find(
        option => option.value === inputValue
    );

    if (selectedOption) {
        const itemId = selectedOption.dataset.itemId;
        const loadedCatalog = getLoadedCatalog();
        const selectedItem = loadedCatalog.find(item => item.id === itemId);

        if (selectedItem) {
            DOM.itemNameQuoteForm.value = selectedItem.name;
            DOM.itemSpecQuoteForm.value = selectedItem.spec || '';
            DOM.itemUnitQuoteForm.value = selectedItem.unit;
            DOM.itemPriceQuoteForm.value = selectedItem.price;
            
            const mainCategories = getMainCategories();
            const category = mainCategories.find(cat => cat.id === selectedItem.mainCategoryId);
            DOM.quoteItemMainCategoryInput.value = category ? category.name : '';

            DOM.itemImageFileQuoteForm.value = '';
            DOM.itemImagePreviewQuoteForm.style.display = 'none';
            itemImageDataBase64QuoteForm = null;
            DOM.itemQuantityQuoteForm.value = '1';
            DOM.itemLengthQuoteForm.value = '';
            DOM.itemHeightQuoteForm.value = '';
            DOM.itemDepthQuoteForm.value = '';
            DOM.itemCalcTypeQuoteForm.value = 'unit';
            DOM.itemDiscountValueForm.value = 0;
            DOM.itemDiscountTypeForm.value = 'percent';

            event.target.value = '';
            
            DOM.itemQuantityQuoteForm.focus();
        }
    }
}


export function addOrUpdateItemFromForm() {
    const itemIdToEdit = DOM.editingQuoteItemIdInputForm.value;
    const name = DOM.itemNameQuoteForm.value.trim();
    const spec = DOM.itemSpecQuoteForm.value.trim();
    const unit = DOM.itemUnitQuoteForm.value.trim();
    const price = parseFloat(DOM.itemPriceQuoteForm.value) || 0;
    const itemDiscountValue = parseFloat(DOM.itemDiscountValueForm.value) || 0;
    const itemDiscountType = DOM.itemDiscountTypeForm.value;
    const calcType = DOM.itemCalcTypeQuoteForm.value;
    const length = parseFloat(DOM.itemLengthQuoteForm.value) || null;
    const height = parseFloat(DOM.itemHeightQuoteForm.value) || null;
    const depth = parseFloat(DOM.itemDepthQuoteForm.value) || null;
    const quantityRaw = DOM.itemQuantityQuoteForm.value;
    const quantity = parseFloat(String(quantityRaw).replace(',', '.')) || 1;
    
    const mainCategoryName = DOM.quoteItemMainCategoryInput.value.trim();
    const mainCategoryId = findOrCreateMainCategory(mainCategoryName);

    if (!name || !unit || price < 0 || quantity <= 0) {
        alert('Nhập Tên, ĐVT, Đơn giá (>=0) và SL (>0).');
        return;
    }

    let discountedPrice = price;
    let itemDiscountAmount = 0;
    if (itemDiscountValue > 0) {
        if (itemDiscountType === 'percent') {
            itemDiscountAmount = (price * itemDiscountValue) / 100;
        } else {
            itemDiscountAmount = itemDiscountValue;
        }
        discountedPrice = price - itemDiscountAmount;
    }

    let baseMeasureInMMUnits = 0;
    if (calcType === 'length' && length) {
        baseMeasureInMMUnits = length;
    } else if (calcType === 'area' && length && height) {
        baseMeasureInMMUnits = length * height;
    } else if (calcType === 'volume' && length && height && depth) {
        baseMeasureInMMUnits = length * height * depth;
    }

    let baseMeasureForPricing = 1;
    if (calcType === 'unit') {
        baseMeasureForPricing = 1;
    } else if (calcType === 'length' && length) {
        baseMeasureForPricing = length / 1000;
    } else if (calcType === 'area' && length && height) {
        baseMeasureForPricing = (length * height) / 1000000;
    } else if (calcType === 'volume' && length && height && depth) {
        baseMeasureForPricing = (length * height * depth) / 1000000000;
    }

    const lineTotal = discountedPrice * baseMeasureForPricing * quantity;

    const newItemData = {
        name, spec, unit, calcType, length, height, depth,
        calculatedMeasure: baseMeasureInMMUnits, 
        quantity, lineTotal,
        imageDataUrl: itemImageDataBase64QuoteForm,
        mainCategoryId: mainCategoryId,
        itemDiscountValue,
        itemDiscountType,
        itemDiscountAmount,
        originalPrice: price,
        price: discountedPrice
    };

    if (itemIdToEdit) {
        updateQuoteItem(itemIdToEdit, newItemData);
        resetQuoteItemFormEditingState();
    } else {
        const newItem = {
            id: generateUniqueId('qitem'),
            ...newItemData
        };
        currentQuoteItems.push(newItem);
    }
    renderQuoteItemsPreview();
    calculateTotals();
    clearQuoteItemFormInputs();
    saveQuoteToLocalStorage();
}


export function editQuoteItemOnForm(itemId) {
    const item = currentQuoteItems.find(i => i.id === itemId);
    if (item) {
        DOM.editingQuoteItemIdInputForm.value = item.id;
        DOM.itemNameQuoteForm.value = item.name;
        DOM.itemSpecQuoteForm.value = item.spec || '';
        DOM.itemUnitQuoteForm.value = item.unit;
        DOM.itemPriceQuoteForm.value = item.originalPrice;
        DOM.itemDiscountValueForm.value = item.itemDiscountValue || 0;
        DOM.itemDiscountTypeForm.value = item.itemDiscountType || 'percent';
        DOM.itemCalcTypeQuoteForm.value = item.calcType || 'unit';
        DOM.itemLengthQuoteForm.value = item.length || '';
        DOM.itemHeightQuoteForm.value = item.height || '';
        DOM.itemDepthQuoteForm.value = item.depth || '';
        
        const mainCategories = getMainCategories();
        const category = mainCategories.find(cat => cat.id === item.mainCategoryId);
        DOM.quoteItemMainCategoryInput.value = category ? category.name : '';
        
        DOM.itemQuantityQuoteForm.value = item.quantity;
        itemImageDataBase64QuoteForm = item.imageDataUrl || null;
        if (item.imageDataUrl) {
            DOM.itemImagePreviewQuoteForm.src = item.imageDataUrl;
            DOM.itemImagePreviewQuoteForm.style.display = 'block';
        } else {
            DOM.itemImagePreviewQuoteForm.style.display = 'none';
        }
        DOM.itemImageFileQuoteForm.value = '';
        DOM.addOrUpdateItemButtonForm.textContent = 'Cập nhật Hạng mục';
        if (DOM.cancelEditQuoteItemButtonForm) DOM.cancelEditQuoteItemButtonForm.style.display = 'inline-block';
        if (DOM.itemNameQuoteForm) DOM.itemNameQuoteForm.focus();
        if (DOM.quoteItemEntryFormDiv) DOM.quoteItemEntryFormDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

export function deleteQuoteItem(itemId) {
    if (confirm('Xóa hạng mục này khỏi báo giá?')) {
        if (DOM.editingQuoteItemIdInputForm.value === itemId) resetQuoteItemFormEditingState();
        currentQuoteItems = currentQuoteItems.filter(item => item.id !== itemId);
        renderQuoteItemsPreview();
        calculateTotals();
        saveQuoteToLocalStorage();
    }
};

export function quickSaveToCatalogFromFormHandler() {
    const name = DOM.itemNameQuoteForm.value.trim();
    const spec = DOM.itemSpecQuoteForm.value.trim();
    const unit = DOM.itemUnitQuoteForm.value.trim();
    const price = parseFloat(DOM.itemPriceQuoteForm.value);
    const mainCategoryName = DOM.quoteItemMainCategoryInput.value.trim();
    const mainCatId = findOrCreateMainCategory(mainCategoryName);
    
    if (!name || !unit || isNaN(price) || price < 0) {
        alert("Nhập Tên, ĐVT, Đơn giá (>=0) trên form để lưu.");
        return;
    }
    saveItemToMasterCatalog(name, spec, unit, price, mainCatId);
}

export function saveThisQuoteItemToMasterCatalog(quoteItemId) {
    const item = currentQuoteItems.find(i => i.id === quoteItemId);
    if (item) {
        saveItemToMasterCatalog(item.name, item.spec, item.unit, item.originalPrice, item.mainCategoryId);
    } else {
        alert("Không tìm thấy hạng mục báo giá.");
    }
}

// === UI & FORM HELPERS ===
export function itemImageFileQuoteFormHandler(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 500 * 1024) {
            alert('Ảnh quá lớn (500KB).');
            DOM.itemImageFileQuoteForm.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.itemImagePreviewQuoteForm.src = e.target.result;
            DOM.itemImagePreviewQuoteForm.style.display = 'block';
            itemImageDataBase64QuoteForm = e.target.result;
        }
        reader.readAsDataURL(file);
    } else {
        DOM.itemImagePreviewQuoteForm.style.display = 'none';
        itemImageDataBase64QuoteForm = null;
    }
}

function clearQuoteItemFormInputs(focusOnName = true) {
    DOM.itemNameQuoteForm.value = '';
    DOM.itemSpecQuoteForm.value = '';
    DOM.itemUnitQuoteForm.value = '';
    DOM.itemPriceQuoteForm.value = '';
    DOM.itemDiscountValueForm.value = '0';
    DOM.itemDiscountTypeForm.value = 'percent';
    DOM.itemCalcTypeQuoteForm.value = 'unit';
    DOM.itemLengthQuoteForm.value = '';
    DOM.itemHeightQuoteForm.value = '';
    DOM.itemDepthQuoteForm.value = '';
    DOM.itemQuantityQuoteForm.value = '1';
    DOM.itemImageFileQuoteForm.value = '';
    DOM.itemImagePreviewQuoteForm.style.display = 'none';
    itemImageDataBase64QuoteForm = null;
    if (DOM.catalogItemCombobox) DOM.catalogItemCombobox.value = "";
    if (DOM.quoteItemMainCategoryInput) DOM.quoteItemMainCategoryInput.value = "";
    if (focusOnName && DOM.itemNameQuoteForm) DOM.itemNameQuoteForm.focus();
}

function resetQuoteItemFormEditingState() {
    DOM.editingQuoteItemIdInputForm.value = '';
    DOM.addOrUpdateItemButtonForm.textContent = 'Thêm vào Báo giá';
    if (DOM.cancelEditQuoteItemButtonForm) DOM.cancelEditQuoteItemButtonForm.style.display = 'none';
    clearQuoteItemFormInputs(false);
}

export function prepareNewQuoteItemHandler() {
    resetQuoteItemFormEditingState();
    clearQuoteItemFormInputs(true);
    if (DOM.quoteItemEntryFormDiv) DOM.quoteItemEntryFormDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// === RENDER & CALCULATION ===

function createItemRow(item, itemIndex) {
    const row = document.createElement('tr');
    row.id = `qitem-display-${item.id}`;
    
    let displayNameCellContent = `<span class="item-name-display">${item.name.toUpperCase()}</span>`;
    let dimParts = [];
    if (item.length) dimParts.push(`D ${item.length}mm`);
    if (item.height) dimParts.push(`C ${item.height}mm`);
    if (item.depth) dimParts.push(`S ${item.depth}mm`);
    const dimensionsString = dimParts.join(' x ');
    if (dimensionsString) {
        displayNameCellContent += `<br><span class="item-dimensions-display">KT: ${dimensionsString}</span>`;
    }
    if (item.spec) displayNameCellContent += `<br><span class="item-spec-display">${item.spec}</span>`;

    const imgSrc = item.imageDataUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    let displayedMeasureText = '';
    if (item.calculatedMeasure && typeof item.calculatedMeasure === 'number' && item.calcType !== 'unit') {
        let measureInMeters = item.calculatedMeasure;
        if (item.calcType === 'length') measureInMeters /= 1000;
        else if (item.calcType === 'area') measureInMeters /= 1000000;
        else if (item.calcType === 'volume') measureInMeters /= 1000000000;
        displayedMeasureText = `${parseFloat(measureInMeters.toFixed(4)).toLocaleString('vi-VN')}`;
    }

    row.innerHTML = `
        <td class="cell-align-center">${itemIndex}</td>
        <td><img src="${imgSrc}" alt="Ảnh" class="item-image-preview-table" style="display:${item.imageDataUrl ? 'block':'none'};"></td>
        <td class="item-name-spec-cell">${displayNameCellContent}</td>
        <td class="cell-align-center">${item.unit}</td>
        <td class="cell-align-right">${displayedMeasureText}</td>
        <td class="cell-align-right">${(item.quantity).toLocaleString('vi-VN', {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td>
        <td class="cell-align-right">
            ${item.itemDiscountAmount > 0 ? `<span class="strikethrough-price">${formatCurrency(item.originalPrice)}</span><br>` : ''}
            <strong>${formatCurrency(item.price)}</strong>
        </td>
        <td class="cell-align-right">${formatCurrency(item.lineTotal)}</td>
        <td class="no-print">
            <button class="edit-btn small-btn" data-id="${item.id}">Sửa</button>
            <button class="delete-btn small-btn" data-id="${item.id}">Xóa</button>
            <button class="quick-save-to-catalog-btn-row small-btn" data-id="${item.id}" title="Lưu mục này vào DM chính">Lưu vào DM</button>
        </td>`;
    return row;
}


export function renderQuoteItemsPreview() {
    if (!DOM.itemListPreviewTableBody) return;
    DOM.itemListPreviewTableBody.innerHTML = '';

    const mainCategories = getMainCategories();
    const groupedItems = new Map();
    const itemsWithoutCategory = [];

    currentQuoteItems.forEach(item => {
        if (item.mainCategoryId && mainCategories.some(cat => cat.id === item.mainCategoryId)) {
            if (!groupedItems.has(item.mainCategoryId)) {
                groupedItems.set(item.mainCategoryId, []);
            }
            groupedItems.get(item.mainCategoryId).push(item);
        } else {
            itemsWithoutCategory.push(item);
        }
    });

    let itemCounter = 0;
    let categoryCounter = 0;

    mainCategories.forEach(category => {
        if (groupedItems.has(category.id)) {
            categoryCounter++;
            const itemsInCategory = groupedItems.get(category.id);
            const categoryTotal = itemsInCategory.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

            const headerRow = DOM.itemListPreviewTableBody.insertRow();
            headerRow.className = 'main-category-row';
            headerRow.innerHTML = `
                <td class="main-category-roman-numeral">${numberToRoman(categoryCounter)}</td>
                <td colspan="6" class="main-category-name">${category.name}</td>
                <td class="main-category-total">${formatCurrency(categoryTotal)}</td>
                <td class="no-print"></td>
            `;

            itemsInCategory.forEach(item => {
                itemCounter++;
                DOM.itemListPreviewTableBody.appendChild(createItemRow(item, itemCounter));
            });
        }
    });

    if (itemsWithoutCategory.length > 0) {
        if (groupedItems.size > 0) {
            const separatorRow = DOM.itemListPreviewTableBody.insertRow();
            separatorRow.className = 'main-category-row';
            separatorRow.innerHTML = `<td colspan="9" style="text-align:center; font-style:italic; background-color: #f8f9fa;">Hạng mục khác</td>`;
        }

        itemsWithoutCategory.forEach(item => {
            itemCounter++;
            DOM.itemListPreviewTableBody.appendChild(createItemRow(item, itemCounter));
        });
    }
}

function updateInstallmentState() {
    quoteInstallmentData.apply = DOM.applyInstallmentsCheckbox.checked;
    quoteInstallmentData.installments = [];
    for (let i = 1; i <= 4; i++) {
        const name = DOM[`installmentName${i}`].value;
        const value = parseFloat(DOM[`installmentValue${i}`].value) || 0;
        const type = DOM[`installmentType${i}`].value;
        quoteInstallmentData.installments.push({ name, value, type });
    }
}

function calculateAndRenderInstallments(grandTotal) {
    if (!DOM.applyInstallmentsCheckbox.checked) {
        if (DOM.installmentsContainer) DOM.installmentsContainer.style.display = 'none';
        return;
    }
    if (DOM.installmentsContainer) DOM.installmentsContainer.style.display = 'flex';

    updateInstallmentState();

    let totalInstallmentAmount = 0;
    let totalPercent = 0;
    
    for (let i = 1; i <= 4; i++) {
        const inst = quoteInstallmentData.installments[i - 1];
        let amount = 0;
        if (inst.value > 0) {
            if (inst.type === 'percent') {
                amount = (grandTotal * inst.value) / 100;
                totalPercent += inst.value;
            } else {
                amount = inst.value;
            }
        }
        DOM[`installmentAmount${i}`].textContent = formatCurrency(amount);
        totalInstallmentAmount += amount;
    }

    if (DOM.installmentsTotalPercent) {
        const totalPercentStrongEl = DOM.installmentsTotalPercent.querySelector('strong');
        if (totalPercentStrongEl) {
            totalPercentStrongEl.textContent = `${totalPercent.toFixed(2)}%`;
            if (totalPercent > 100) {
                totalPercentStrongEl.style.color = '#dc3545';
            } else {
                totalPercentStrongEl.style.color = '#0d6efd';
            }
        }
    }
    
    if (DOM.installmentsTotalAmount) DOM.installmentsTotalAmount.textContent = formatCurrency(totalInstallmentAmount);
    const remainingAmount = grandTotal - totalInstallmentAmount;
    if (DOM.installmentsRemainingAmount) DOM.installmentsRemainingAmount.textContent = formatCurrency(remainingAmount);
    if(remainingAmount < 0) {
        if (DOM.installmentsRemainingAmount) DOM.installmentsRemainingAmount.style.color = '#dc3545';
    } else {
        if (DOM.installmentsRemainingAmount) DOM.installmentsRemainingAmount.style.color = '#198754';
    }
}


export function calculateTotals() {
    const subTotal = currentQuoteItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const applyDiscount = DOM.applyDiscountCheckbox.checked;
    const applyTax = DOM.applyTaxCheckbox.checked;

    const discountInputValue = parseFloat(DOM.discountValueInput.value) || 0;
    const discountType = DOM.discountTypeSelect.value;
    
    let discountAmount = 0;
    if (applyDiscount && discountInputValue > 0) {
        if (discountType === 'percent') {
            discountAmount = (subTotal * discountInputValue) / 100;
        } else {
            discountAmount = discountInputValue;
        }
    }
    
    DOM.discountValueInput.disabled = !applyDiscount;
    DOM.discountTypeSelect.disabled = !applyDiscount;

    const taxPercentVal = applyTax ? (parseFloat(DOM.taxPercentInput.value) || 0) : 0;

    if (DOM.taxPercentInput) DOM.taxPercentInput.disabled = !applyTax;
    if (!applyTax && DOM.taxPercentInput) DOM.taxPercentInput.value = '0';
    
    const subTotalAfterDiscount = subTotal - discountAmount;
    const taxValue = (subTotalAfterDiscount * taxPercentVal) / 100;
    const grandTotal = subTotalAfterDiscount + taxValue;

    if (DOM.subTotalSpan) DOM.subTotalSpan.textContent = formatCurrency(subTotal);
    if (DOM.discountAmountSpan) DOM.discountAmountSpan.textContent = applyDiscount ? `(${formatCurrency(discountAmount)})` : '(0 VNĐ)';
    
    if (DOM.taxAmountSpan) DOM.taxAmountSpan.textContent = applyTax ? `(${formatCurrency(taxValue)})` : '(0 VNĐ)';
    
    if (DOM.totalPriceSpan) DOM.totalPriceSpan.textContent = formatCurrency(grandTotal);

    calculateAndRenderInstallments(grandTotal);

    saveQuoteToLocalStorage();
    return {
        subTotal,
        discountValue: discountAmount,
        subTotalAfterDiscount,
        taxValue,
        grandTotal,
        taxPercent: taxPercentVal,
        applyDiscount,
        applyTax
    };
};

// === FULL QUOTE ACTIONS ===
export function startNewQuote() {
    currentQuoteIdInternal = generateProfessionalQuoteId();
    DOM.customerNameInput.value = '';
    DOM.customerAddressInput.value = '';
    DOM.quoteDateInput.value = new Date().toISOString().split('T')[0];
    DOM.quoteNotesInput.value = '';
    resetQuoteItemFormEditingState();
    currentQuoteItems = [];
    DOM.applyDiscountCheckbox.checked = true;
    
    DOM.discountValueInput.value = '0';
    DOM.discountTypeSelect.value = 'percent';
    if (DOM.discountValueInput) DOM.discountValueInput.disabled = false;
    if (DOM.discountTypeSelect) DOM.discountTypeSelect.disabled = false;

    DOM.applyTaxCheckbox.checked = true;
    DOM.taxPercentInput.value = '0';
    if (DOM.taxPercentInput) DOM.taxPercentInput.disabled = false;

    DOM.applyInstallmentsCheckbox.checked = false;
    if (DOM.installmentsContainer) DOM.installmentsContainer.style.display = 'none';
    for (let i = 1; i <= 4; i++) {
        DOM[`installmentName${i}`].value = i === 1 ? 'Đợt 1: Tạm ứng' : (i === 4 ? 'Đợt 4: Bàn giao' : `Đợt ${i}`);
        DOM[`installmentValue${i}`].value = '';
        DOM[`installmentType${i}`].value = 'percent';
        DOM[`installmentAmount${i}`].textContent = '0 VNĐ';
    }
    if (DOM.installmentsTotalAmount) DOM.installmentsTotalAmount.textContent = '0 VNĐ';
    if (DOM.installmentsRemainingAmount) DOM.installmentsRemainingAmount.textContent = '0 VNĐ';

    if (DOM.installmentsTotalPercent) {
        const totalPercentStrongEl = DOM.installmentsTotalPercent.querySelector('strong');
        if (totalPercentStrongEl) {
            totalPercentStrongEl.textContent = '0%';
            totalPercentStrongEl.style.color = '#0d6efd';
        }
    }
    
    renderQuoteItemsPreview();
    calculateTotals();
    saveQuoteToLocalStorage();
    if (DOM.customerNameInput) DOM.customerNameInput.focus();
};

export function clearQuoteFormHandler() {
    if (confirm('Làm mới Form? Thay đổi với báo giá hiện tại sẽ mất (trừ khi đã lưu).')) {
        startNewQuote();
    }
}

export function saveCurrentQuoteToListHandler() {
    if (currentQuoteItems.length === 0) {
        alert("Chưa có hạng mục để lưu.");
        return;
    }
    let quoteNameToSave = currentQuoteIdInternal;
    const existingQuoteIndex = savedQuotes.findIndex(q => q.id === currentQuoteIdInternal);
    if (existingQuoteIndex === -1 || !String(currentQuoteIdInternal).match(/^\d{8}-\d{3}$/)) {
        const suggestedName = DOM.customerNameInput.value ? `${DOM.customerNameInput.value.replace(/[^a-zA-Z0-9]/g,'_')}_${currentQuoteIdInternal.split('-')[0]}` : currentQuoteIdInternal;
        const promptedName = prompt("Nhập ID/Tên để lưu báo giá này (nếu khác ID hiện tại):", suggestedName);
        if (!promptedName) return;
        quoteNameToSave = promptedName;
    } else {
        if (!confirm(`Báo giá ID "${currentQuoteIdInternal}" đã có. Ghi đè?`)) return;
    }
    const finalQuoteIdToSave = quoteNameToSave || currentQuoteIdInternal;
    updateInstallmentState(); 
    const quoteDataToSave = {
        id: finalQuoteIdToSave,
        customerName: DOM.customerNameInput.value,
        customerAddress: DOM.customerAddressInput.value,
        quoteDate: DOM.quoteDateInput.value,
        quoteNotes: DOM.quoteNotesInput.value,
        items: JSON.parse(JSON.stringify(currentQuoteItems)),
        applyDiscount: DOM.applyDiscountCheckbox.checked,
        discountValue: DOM.discountValueInput.value,
        discountType: DOM.discountTypeSelect.value,
        applyTax: DOM.applyTaxCheckbox.checked,
        taxPercent: DOM.taxPercentInput.value,
        installmentData: quoteInstallmentData,
        timestamp: Date.now()
    };
    const finalExistingQuoteIndex = savedQuotes.findIndex(q => q.id === finalQuoteIdToSave);
    if (finalExistingQuoteIndex > -1) {
        savedQuotes[finalExistingQuoteIndex] = quoteDataToSave;
    } else {
        savedQuotes.push(quoteDataToSave);
    }
    currentQuoteIdInternal = finalQuoteIdToSave;
    saveQuotesListToLocalStorage();
    renderSavedQuotesList();
    saveQuoteToLocalStorage();
    alert(`Báo giá "${finalQuoteIdToSave}" đã lưu!`);
};

export function renderSavedQuotesList() {
    if (!DOM.savedQuotesTableBody) return;
    DOM.savedQuotesTableBody.innerHTML = '';
    if (savedQuotes.length === 0) {
        DOM.savedQuotesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có báo giá.</td></tr>';
        return;
    }
    savedQuotes.sort((a, b) => b.timestamp - a.timestamp);
    savedQuotes.forEach(quote => {
        const row = DOM.savedQuotesTableBody.insertRow();
        let displayTotal = 0;
        if (quote.items && quote.items.length > 0) {
            const tempSubTotal = quote.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
            const useDiscount = typeof quote.applyDiscount === 'boolean' ? quote.applyDiscount : true;
            const useTax = typeof quote.applyTax === 'boolean' ? quote.applyTax : true;

            let tempDiscountVal = 0;
            if (useDiscount && quote.discountValue > 0) {
                if (quote.discountType === 'percent') {
                    tempDiscountVal = (tempSubTotal * parseFloat(quote.discountValue)) / 100;
                } else {
                    tempDiscountVal = parseFloat(quote.discountValue);
                }
            }

            const tempTaxVal = useTax ? ((tempSubTotal - tempDiscountVal) * (parseFloat(quote.taxPercent) || 0)) / 100 : 0;
            displayTotal = tempSubTotal - tempDiscountVal + tempTaxVal;
        }
        row.innerHTML = `
            <td>${quote.id}</td>
            <td>${quote.customerName}</td>
            <td>${formatDate(quote.quoteDate || quote.timestamp)}</td>
            <td>${formatCurrency(displayTotal)}</td>
            <td class="no-print">
                <button class="load-quote-btn small-btn" data-id="${quote.id}">Tải & Sửa</button>
                <button class="delete-btn small-btn" data-id="${quote.id}">Xóa</button>
            </td>`;
    });
};

export function loadQuoteFromList(quoteIdToLoad) {
    const quote = savedQuotes.find(q => q.id === quoteIdToLoad);
    if (quote) {
        currentQuoteIdInternal = quote.id;
        DOM.customerNameInput.value = quote.customerName;
        DOM.customerAddressInput.value = quote.customerAddress;
        DOM.quoteDateInput.value = quote.quoteDate;
        DOM.quoteNotesInput.value = quote.quoteNotes;
        currentQuoteItems = JSON.parse(JSON.stringify(quote.items));
        DOM.applyDiscountCheckbox.checked = typeof quote.applyDiscount === 'boolean' ? quote.applyDiscount : true;
        DOM.discountValueInput.value = quote.discountValue || '0';
        DOM.discountTypeSelect.value = quote.discountType || 'percent';

        if (DOM.discountValueInput) DOM.discountValueInput.disabled = !DOM.applyDiscountCheckbox.checked;
        if (DOM.discountTypeSelect) DOM.discountTypeSelect.disabled = !DOM.applyDiscountCheckbox.checked;

        DOM.applyTaxCheckbox.checked = typeof quote.applyTax === 'boolean' ? quote.applyTax : true;
        DOM.taxPercentInput.value = quote.taxPercent;
        if (DOM.taxPercentInput) DOM.taxPercentInput.disabled = !DOM.applyTaxCheckbox.checked;
        
        quoteInstallmentData = quote.installmentData || { apply: false, installments: [] };
        DOM.applyInstallmentsCheckbox.checked = quoteInstallmentData.apply;
        if (quoteInstallmentData.installments && quoteInstallmentData.installments.length > 0) {
            for (let i = 1; i <= 4; i++) {
                const inst = quoteInstallmentData.installments[i-1];
                if (inst) {
                    DOM[`installmentName${i}`].value = inst.name || '';
                    DOM[`installmentValue${i}`].value = inst.value || '';
                    DOM[`installmentType${i}`].value = inst.type || 'percent';
                }
            }
        }
        
        resetQuoteItemFormEditingState();
        renderQuoteItemsPreview();
        calculateTotals();
        saveQuoteToLocalStorage();
        openTab('tabQuote');
        alert(`Đã tải báo giá "${quote.id}".`);
        if (DOM.customerNameInput) DOM.customerNameInput.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
};

export function deleteQuoteFromList(quoteIdToDelete) {
    if (confirm(`Xóa vĩnh viễn báo giá "${quoteIdToDelete}"?`)) {
        savedQuotes = savedQuotes.filter(q => q.id !== quoteIdToDelete);
        saveQuotesListToLocalStorage();
        renderSavedQuotesList();
        if (currentQuoteIdInternal === quoteIdToDelete) startNewQuote();
        alert(`Đã xóa báo giá "${quoteIdToDelete}".`);
    }
};

// === COMPANY SETTINGS ===
export function loadCompanySettings() {
    const savedSettingsData = localStorage.getItem('companySettings');
    if (savedSettingsData) {
        try {
            companySettings = JSON.parse(savedSettingsData);
            DOM.companyNameSettingInput.value = companySettings.name || '';
            DOM.companyAddressSettingInput.value = companySettings.address || '';
            DOM.companyPhoneSettingInput.value = companySettings.phone || '';
            DOM.companyEmailSettingInput.value = companySettings.email || '';
            DOM.companyTaxIdSettingInput.value = companySettings.taxId || '';
            DOM.companyBankAccountSetting.value = companySettings.bankAccount || '';
            if (companySettings.logoDataUrl) {
                DOM.logoPreview.src = companySettings.logoDataUrl;
                DOM.logoPreview.style.display = 'block';
            } else {
                DOM.logoPreview.style.display = 'none';
            }
        } catch (e) {
            console.error("Error parsing company settings from localStorage", e);
            companySettings = {};
        }
    }
}

export function saveCompanySettingsHandler() {
    companySettings.name = DOM.companyNameSettingInput.value.trim();
    companySettings.address = DOM.companyAddressSettingInput.value.trim();
    companySettings.phone = DOM.companyPhoneSettingInput.value.trim();
    companySettings.email = DOM.companyEmailSettingInput.value.trim();
    companySettings.taxId = DOM.companyTaxIdSettingInput.value.trim();
    companySettings.bankAccount = DOM.companyBankAccountSetting.value.trim();
    try {
        localStorage.setItem('companySettings', JSON.stringify(companySettings));
        alert('Đã lưu cài đặt công ty!');
    } catch (e) {
        console.error("Error saving company settings to localStorage", e);
        alert('Lỗi khi lưu cài đặt công ty.');
    }
}

export function companyLogoFileHandler(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 1 * 1024 * 1024) {
            alert('Logo quá lớn (1MB).');
            DOM.companyLogoFileInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.logoPreview.src = e.target.result;
            DOM.logoPreview.style.display = 'block';
            companySettings.logoDataUrl = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}
