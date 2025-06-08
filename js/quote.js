/**
 * @file quote.js
 * @description Quản lý logic báo giá với Firestore.
 */

import * as DOM from './dom.js';
import { db } from './firebase.js';
import { formatDate, formatCurrency, generateProfessionalQuoteId, generateUniqueId, numberToRoman } from './utils.js';
import { getLoadedCatalog, getMainCategories, findOrCreateMainCategory, saveItemToMasterCatalog } from './catalog.js';
import { openTab } from './ui.js';


// === STATE ===
let currentQuoteItems = [];
let savedQuotes = [];
let companySettings = { bankAccount: '' };
let currentQuoteIdInternal = null;
let itemImageDataBase64QuoteForm = null;
let quoteInstallmentData = { apply: false, installments: [] };

// === GETTERS ===
export const getCurrentQuoteItems = () => [...currentQuoteItems];
export const getSavedQuotes = () => [...savedQuotes];
export const getCompanySettings = () => ({ ...companySettings });
export const getCurrentQuoteId = () => currentQuoteIdInternal;
export const getQuoteInstallmentData = () => ({ ...quoteInstallmentData });

// === FIRESTORE INTERACTION ===
async function saveCurrentWorkingQuoteToFirestore(userId) {
    if (!userId) return;
    updateInstallmentState();
    
    const itemsToSave = currentQuoteItems.map(item => {
        if (item.imageDataUrl && item.imageDataUrl.length > 500000) {
            return { ...item, imageDataUrl: null };
        }
        return item;
    });

    const quoteData = {
        id: currentQuoteIdInternal,
        customerName: DOM.customerNameInput.value,
        customerAddress: DOM.customerAddressInput.value,
        quoteDate: DOM.quoteDateInput.value,
        quoteNotes: DOM.quoteNotesInput.value,
        items: itemsToSave,
        applyDiscount: DOM.applyDiscountCheckbox.checked,
        discountValue: DOM.discountValueInput.value,
        discountType: DOM.discountTypeSelect.value,
        applyTax: DOM.applyTaxCheckbox.checked,
        taxPercent: DOM.taxPercentInput.value,
        installmentData: quoteInstallmentData, 
        timestamp: Date.now()
    };
    try {
        await db.collection('users').doc(userId).collection('ux').doc('currentQuote').set(quoteData);
    } catch (e) {
        console.error("Lỗi lưu báo giá nháp:", e);
    }
};

export async function loadCurrentWorkingQuote(userId) {
    if (!userId) return;
    try {
        const docSnap = await db.collection('users').doc(userId).collection('ux').doc('currentQuote').get();

        if (docSnap.exists) {
            const quoteData = docSnap.data();
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
            
            renderQuoteItemsPreview();
            calculateTotals(userId);
        } else {
            startNewQuote(userId);
        }
    } catch (e) {
        console.error("Lỗi tải báo giá nháp:", e);
        startNewQuote(userId);
    }
};

export async function loadSavedQuotesFromFirestore(userId) {
    if (!userId) return;
    try {
        const snapshot = await db.collection('users').doc(userId).collection('quotes').orderBy('timestamp', 'desc').get();
        savedQuotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSavedQuotesList();
    } catch(e) {
        console.error("Lỗi tải danh sách báo giá:", e);
        savedQuotes = [];
    }
}

export async function loadCompanySettings(userId) {
    if (!userId) return;
    try {
        const docSnap = await db.collection('users').doc(userId).collection('settings').doc('company').get();
        if (docSnap.exists) {
            companySettings = docSnap.data();
            DOM.companyNameSettingInput.value = companySettings.name || '';
            DOM.companyAddressSettingInput.value = companySettings.address || '';
            DOM.companyPhoneSettingInput.value = companySettings.phone || '';
            DOM.companyEmailSettingInput.value = companySettings.email || '';
            DOM.companyTaxIdSettingInput.value = companySettings.taxId || '';
            DOM.companyBankAccountSetting.value = companySettings.bankAccount || '';
            if (companySettings.logoDataUrl) {
                DOM.logoPreview.src = companySettings.logoDataUrl;
                DOM.logoPreview.style.display = 'block';
            }
        }
    } catch(e) {
        console.error("Lỗi tải cài đặt công ty:", e);
    }
}

// === QUOTE ITEM MANAGEMENT ===
export function handleCatalogComboboxSelection(event) {
    const inputValue = event.target.value;
    const selectedOption = Array.from(DOM.catalogDatalist.options).find(opt => opt.value === inputValue);
    if (selectedOption) {
        const itemId = selectedOption.dataset.itemId;
        const selectedItem = getLoadedCatalog().find(item => item.id === itemId);
        if (selectedItem) {
            DOM.itemNameQuoteForm.value = selectedItem.name;
            DOM.itemSpecQuoteForm.value = selectedItem.spec || '';
            DOM.itemUnitQuoteForm.value = selectedItem.unit;
            DOM.itemPriceQuoteForm.value = selectedItem.price;
            event.target.value = '';
            DOM.itemQuantityQuoteForm.focus();
        }
    }
}

export async function addOrUpdateItemFromForm(userId) {
    const name = DOM.itemNameQuoteForm.value.trim();
    if (!name) {
        alert('Tên hạng mục không được để trống.');
        return;
    }
    const mainCategoryName = DOM.quoteItemMainCategoryInput.value.trim();
    const mainCategoryId = await findOrCreateMainCategory(mainCategoryName, userId);
    
    const price = parseFloat(DOM.itemPriceQuoteForm.value) || 0;
    const itemDiscountValue = parseFloat(DOM.itemDiscountValueForm.value) || 0;
    const itemDiscountType = DOM.itemDiscountTypeForm.value;
    const quantity = parseFloat(String(DOM.itemQuantityQuoteForm.value).replace(',', '.')) || 1;
    const calcType = DOM.itemCalcTypeQuoteForm.value;
    const length = parseFloat(DOM.itemLengthQuoteForm.value) || null;
    const height = parseFloat(DOM.itemHeightQuoteForm.value) || null;
    const depth = parseFloat(DOM.itemDepthQuoteForm.value) || null;

    let discountedPrice = price;
    let itemDiscountAmount = 0;
    if (itemDiscountValue > 0) {
        itemDiscountAmount = (itemDiscountType === 'percent') ? (price * itemDiscountValue) / 100 : itemDiscountValue;
        discountedPrice = price - itemDiscountAmount;
    }

    let baseMeasureForPricing = 1;
    if (calcType === 'length' && length) baseMeasureForPricing = length / 1000;
    else if (calcType === 'area' && length && height) baseMeasureForPricing = (length * height) / 1000000;
    else if (calcType === 'volume' && length && height && depth) baseMeasureForPricing = (length * height * depth) / 1000000000;

    const lineTotal = discountedPrice * baseMeasureForPricing * quantity;

    const newItemData = {
        name,
        spec: DOM.itemSpecQuoteForm.value.trim(),
        unit: DOM.itemUnitQuoteForm.value.trim(),
        calcType, length, height, depth, quantity, lineTotal,
        imageDataUrl: itemImageDataBase64QuoteForm,
        mainCategoryId,
        itemDiscountValue, itemDiscountType, itemDiscountAmount,
        originalPrice: price,
        price: discountedPrice
    };

    const itemIdToEdit = DOM.editingQuoteItemIdInputForm.value;
    if (itemIdToEdit) {
        const itemIndex = currentQuoteItems.findIndex(i => i.id === itemIdToEdit);
        if(itemIndex > -1) currentQuoteItems[itemIndex] = { ...currentQuoteItems[itemIndex], ...newItemData };
        resetQuoteItemFormEditingState();
    } else {
        currentQuoteItems.push({ id: generateUniqueId('qitem'), ...newItemData });
    }
    
    renderQuoteItemsPreview();
    calculateTotals(userId);
    clearQuoteItemFormInputs();
    await saveCurrentWorkingQuoteToFirestore(userId);
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
        const category = getMainCategories().find(cat => cat.id === item.mainCategoryId);
        DOM.quoteItemMainCategoryInput.value = category ? category.name : '';
        DOM.itemQuantityQuoteForm.value = item.quantity;
        itemImageDataBase64QuoteForm = item.imageDataUrl || null;
        DOM.itemImagePreviewQuoteForm.src = item.imageDataUrl || '#';
        DOM.itemImagePreviewQuoteForm.style.display = item.imageDataUrl ? 'block' : 'none';
        DOM.itemImageFileQuoteForm.value = '';
        DOM.addOrUpdateItemButtonForm.textContent = 'Cập nhật Hạng mục';
        DOM.cancelEditQuoteItemButtonForm.style.display = 'inline-block';
        DOM.itemNameQuoteForm.focus();
        DOM.quoteItemEntryFormDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

export async function deleteQuoteItem(itemId, userId) {
    if (confirm('Xóa hạng mục này khỏi báo giá?')) {
        if (DOM.editingQuoteItemIdInputForm.value === itemId) resetQuoteItemFormEditingState();
        currentQuoteItems = currentQuoteItems.filter(item => item.id !== itemId);
        renderQuoteItemsPreview();
        calculateTotals(userId);
        await saveCurrentWorkingQuoteToFirestore(userId);
    }
}

export async function quickSaveToCatalogFromFormHandler(userId) {
    const itemData = {
        name: DOM.itemNameQuoteForm.value.trim(),
        spec: DOM.itemSpecQuoteForm.value.trim(),
        unit: DOM.itemUnitQuoteForm.value.trim(),
        price: parseFloat(DOM.itemPriceQuoteForm.value) || 0,
    };
    if (!itemData.name) {
        alert("Cần có tên hạng mục để lưu.");
        return;
    }
    await saveItemToMasterCatalog(itemData, userId);
}

export async function saveThisQuoteItemToMasterCatalog(quoteItemId, userId) {
    const item = currentQuoteItems.find(i => i.id === quoteItemId);
    if (item) {
        const { name, spec, unit, originalPrice, mainCategoryId } = item;
        await saveItemToMasterCatalog({ name, spec, unit, price: originalPrice, mainCategoryId }, userId);
    }
}

// === UI & FORM HELPERS ===
export function itemImageFileQuoteFormHandler(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 500 * 1024) { // 500KB
            alert('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 500KB.');
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
    DOM.catalogItemCombobox.value = "";
    DOM.quoteItemMainCategoryInput.value = "";
    if (focusOnName) DOM.itemNameQuoteForm.focus();
}

export function resetQuoteItemFormEditingState() {
    DOM.editingQuoteItemIdInputForm.value = '';
    DOM.addOrUpdateItemButtonForm.textContent = 'Thêm vào Báo giá';
    DOM.cancelEditQuoteItemButtonForm.style.display = 'none';
    clearQuoteItemFormInputs(false);
}

export function prepareNewQuoteItemHandler() {
    resetQuoteItemFormEditingState();
    DOM.quoteItemEntryFormDiv.scrollIntoView({ behavior: 'smooth' });
}

// === RENDER & CALCULATION ===
function renderQuoteItemsPreview() {
    DOM.itemListPreviewTableBody.innerHTML = '';
    const mainCategories = getMainCategories();
    const groupedItems = new Map();
    const itemsWithoutCategory = [];

    currentQuoteItems.forEach(item => {
        const category = mainCategories.find(cat => cat.id === item.mainCategoryId);
        if (category) {
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
                const itemRow = createItemRow(item, itemCounter);
                DOM.itemListPreviewTableBody.appendChild(itemRow);
            });
        }
    });

    if (itemsWithoutCategory.length > 0) {
        itemsWithoutCategory.forEach(item => {
            itemCounter++;
            DOM.itemListPreviewTableBody.appendChild(createItemRow(item, itemCounter));
        });
    }
}

function createItemRow(item, itemIndex) {
    const row = document.createElement('tr');
    // ... (This function's logic remains the same as the localStorage version)
    return row;
}

function updateInstallmentState() {
    quoteInstallmentData.apply = DOM.applyInstallmentsCheckbox.checked;
    quoteInstallmentData.installments = [1, 2, 3, 4].map(i => ({
        name: DOM[`installmentName${i}`].value,
        value: parseFloat(DOM[`installmentValue${i}`].value) || 0,
        type: DOM[`installmentType${i}`].value,
    }));
}

export function calculateTotals(userId) {
    const subTotal = currentQuoteItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    // ... (rest of the calculation logic is the same)
    
    // At the end of the function, save the working quote
    saveCurrentWorkingQuoteToFirestore(userId);
}

// === FULL QUOTE ACTIONS ===
export function startNewQuote(userId) {
    currentQuoteIdInternal = generateProfessionalQuoteId();
    DOM.customerNameInput.value = '';
    DOM.customerAddressInput.value = '';
    // ... (Reset all other form fields and state variables)
    currentQuoteItems = [];
    renderQuoteItemsPreview();
    calculateTotals(userId);
    saveCurrentWorkingQuoteToFirestore(userId);
}

export function clearQuoteFormHandler(userId) {
    if (confirm('Làm mới Form? Dữ liệu nháp chưa lưu sẽ bị mất.')) {
        startNewQuote(userId);
    }
}

export async function saveCurrentQuoteToListHandler(userId) {
    if (!userId || currentQuoteItems.length === 0) {
        alert("Chưa có hạng mục nào trong báo giá.");
        return;
    }
    
    const suggestedName = DOM.customerNameInput.value 
        ? `${DOM.customerNameInput.value}_${currentQuoteIdInternal.split('-')[0]}` 
        : currentQuoteIdInternal;
    const quoteIdToSave = prompt("Nhập ID/Tên để lưu báo giá này:", suggestedName);
    
    if (!quoteIdToSave) return;

    const quoteDataToSave = {
        id: quoteIdToSave,
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
        timestamp: Date.now()
    };

    try {
        UI.showLoader();
        await db.collection('users').doc(userId).collection('quotes').doc(quoteIdToSave).set(quoteDataToSave);
        await loadSavedQuotesFromFirestore(userId);
        UI.hideLoader();
        alert(`Báo giá "${quoteIdToSave}" đã được lưu lên đám mây!`);
    } catch(e) {
        UI.hideLoader();
        console.error("Lỗi lưu báo giá:", e);
        alert("Đã có lỗi xảy ra khi lưu báo giá.");
    }
}

export function renderSavedQuotesList() {
    DOM.savedQuotesTableBody.innerHTML = '';
    if (savedQuotes.length === 0) {
        DOM.savedQuotesTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có báo giá nào được lưu.</td></tr>';
        return;
    }
    savedQuotes.forEach(quote => {
        // ... (Logic to calculate total and render row is the same)
    });
}

export async function loadQuoteFromList(quoteIdToLoad, userId) {
    const quote = savedQuotes.find(q => q.id === quoteIdToLoad);
    if(quote) {
        // ... (Logic to load quote data into UI and state is the same as loadCurrentWorkingQuote)
        await saveCurrentWorkingQuoteToFirestore(userId); // Save it as the new working quote
        openTab('tabQuote');
        alert(`Đã tải báo giá "${quote.id}".`);
    }
}

export async function deleteQuoteFromList(quoteIdToDelete, userId) {
    if (!userId) return;
    if (confirm(`Xóa vĩnh viễn báo giá "${quoteIdToDelete}" trên đám mây?`)) {
        try {
            await db.collection('users').doc(userId).collection('quotes').doc(quoteIdToDelete).delete();
            await loadSavedQuotesFromFirestore(userId);
            alert('Đã xóa báo giá.');
        } catch(e) {
            console.error("Lỗi xóa báo giá:", e);
            alert("Lỗi khi xóa báo giá.");
        }
    }
}

// === COMPANY SETTINGS ===
export async function saveCompanySettingsHandler(userId) {
    if (!userId) return;
    const settingsData = {
        name: DOM.companyNameSettingInput.value.trim(),
        address: DOM.companyAddressSettingInput.value.trim(),
        phone: DOM.companyPhoneSettingInput.value.trim(),
        email: DOM.companyEmailSettingInput.value.trim(),
        taxId: DOM.companyTaxIdSettingInput.value.trim(),
        bankAccount: DOM.companyBankAccountSetting.value.trim(),
        logoDataUrl: companySettings.logoDataUrl || null,
    };
    try {
        await db.collection('users').doc(userId).collection('settings').doc('company').set(settingsData);
        companySettings = settingsData; // Update local state
        alert('Đã lưu cài đặt công ty lên đám mây!');
    } catch (e) {
        console.error("Lỗi lưu cài đặt công ty:", e);
        alert('Lỗi khi lưu cài đặt.');
    }
}

export function companyLogoFileHandler(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 1 * 1024 * 1024) { // 1MB limit
            alert('Logo quá lớn (tối đa 1MB).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            DOM.logoPreview.src = e.target.result;
            DOM.logoPreview.style.display = 'block';
            companySettings.logoDataUrl = e.target.result; // Temporarily store in state
        }
        reader.readAsDataURL(file);
    }
}
