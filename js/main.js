/**
 * @file main.js
 * @description Điểm khởi đầu của ứng dụng (Entry Point) - Phiên bản Firebase.
 */

import * as DOM from './dom.js';
import * as Catalog from './catalog.js';
import * as Quote from './quote.js';
import * as UI from './ui.js';
import { db, auth } from './firebase.js';

let currentUserId = null;

// === AUTHENTICATION LOGIC ===

auth.onAuthStateChanged(async (user) => {
    const authStatusEl = document.getElementById('auth-status');
    const logoutButton = document.getElementById('logoutButton');

    if (user) {
        // Người dùng đã đăng nhập.
        currentUserId = user.uid;
        authStatusEl.textContent = `Đã đăng nhập với User ID: ${user.uid.substring(0, 10)}... (Ẩn danh)`;
        authStatusEl.style.color = 'green';
        logoutButton.style.display = 'inline-block';
        
        UI.showLoader();
        await initializeAppForUser(currentUserId);
        UI.hideLoader();

    } else {
        // Người dùng chưa đăng nhập.
        currentUserId = null;
        authStatusEl.textContent = 'Đang đăng nhập ẩn danh...';
        logoutButton.style.display = 'none';
        auth.signInAnonymously().catch((error) => {
            console.error("Lỗi đăng nhập ẩn danh:", error);
            authStatusEl.textContent = 'Lỗi đăng nhập. Vui lòng làm mới trang.';
            authStatusEl.style.color = 'red';
        });
    }
});

document.getElementById('logoutButton').addEventListener('click', () => {
    if (confirm('Bạn có muốn đăng xuất và tạo một phiên làm việc mới không? Dữ liệu chưa lưu sẽ mất.')) {
        auth.signOut().then(() => {
            // Xóa dữ liệu tạm trên UI và bắt đầu lại
             window.location.reload();
        });
    }
});


// === APP INITIALIZATION ===

async function initializeAppForUser(userId) {
    console.log(`Initializing app for user: ${userId}`);
    
    // Tải tất cả dữ liệu từ Firestore
    await Promise.all([
        Catalog.loadMainCategories(userId),
        Catalog.loadCatalogFromFirestore(userId),
        Quote.loadCompanySettings(userId),
        Quote.loadSavedQuotesFromFirestore(userId)
    ]);

    // Tải báo giá đang làm việc dở
    await Quote.loadCurrentWorkingQuote(userId);
    
    // Thiết lập các event listener sau khi dữ liệu đã sẵn sàng
    setupEventListeners(userId);

    // Cài đặt giao diện
    UI.openTab('tabQuote');
    if (DOM.quoteDateInput && !DOM.quoteDateInput.valueAsDate && DOM.quoteDateInput.value === '') {
        DOM.quoteDateInput.value = new Date().toISOString().split('T')[0];
    }
    if (!Quote.getCurrentQuoteId()) {
        Quote.startNewQuote(userId);
    }
    
    console.log("App Initialized for user.");
}

// === EVENT LISTENERS SETUP ===
function setupEventListeners(userId) {
    // ---- TABS ----
    DOM.tabButtons.forEach(button => {
        button.addEventListener('click', (e) => UI.openTab(e.target.dataset.tab));
    });

    // ---- CATALOG ----
    DOM.excelFileInputManage?.addEventListener('change', (e) => Catalog.handleExcelFileGeneric(e, userId));
    DOM.reloadExcelButton?.addEventListener('click', () => DOM.excelFileInputManage.click());
    DOM.catalogSearchInput?.addEventListener('input', Catalog.renderCatalogPreviewTable);
    DOM.exportCatalogButton?.addEventListener('click', Catalog.exportCatalogHandler);
    DOM.saveCatalogEntryButton?.addEventListener('click', () => Catalog.saveCatalogEntryHandler(userId));
    DOM.cancelCatalogEntryEditButton?.addEventListener('click', Catalog.resetCatalogEditForm);
    DOM.catalogPreviewList?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains('edit-btn')) Catalog.editCatalogEntry(id);
        else if (e.target.classList.contains('delete-btn')) Catalog.deleteCatalogEntry(id, userId);
    });

    // ---- MAIN CATEGORIES ----
    DOM.addOrUpdateMainCategoryButton?.addEventListener('click', () => Catalog.addOrUpdateMainCategoryHandler(userId));
    DOM.cancelEditMainCategoryButton?.addEventListener('click', Catalog.resetMainCategoryForm);
    DOM.mainCategoriesTableBody?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains('edit-btn')) Catalog.editMainCategory(id);
        else if (e.target.classList.contains('delete-btn')) Catalog.deleteMainCategory(id, userId);
    });

    // ---- QUOTE ITEMS ----
    DOM.catalogItemCombobox?.addEventListener('input', Quote.handleCatalogComboboxSelection);
    DOM.itemImageFileQuoteForm?.addEventListener('change', Quote.itemImageFileQuoteFormHandler);
    DOM.addOrUpdateItemButtonForm?.addEventListener('click', () => Quote.addOrUpdateItemFromForm(userId));
    DOM.quickSaveToCatalogButtonForm?.addEventListener('click', () => Quote.quickSaveToCatalogFromFormHandler(userId));
    DOM.cancelEditQuoteItemButtonForm?.addEventListener('click', Quote.resetQuoteItemFormEditingState);
    DOM.prepareNewQuoteItemButton?.addEventListener('click', Quote.prepareNewQuoteItemHandler);
    DOM.itemListPreviewTableBody?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('edit-btn')) Quote.editQuoteItemOnForm(id);
        else if (target.classList.contains('delete-btn')) Quote.deleteQuoteItem(id, userId);
        else if (target.classList.contains('quick-save-to-catalog-btn-row')) Quote.saveThisQuoteItemToMasterCatalog(id, userId);
    });
    
    // ---- TOTALS & INSTALLMENTS ----
    const inputsToAutoRecalculate = [
        DOM.discountValueInput, DOM.discountTypeSelect, DOM.taxPercentInput,
        DOM.applyDiscountCheckbox, DOM.applyTaxCheckbox, DOM.applyInstallmentsCheckbox,
        DOM.installmentValue1, DOM.installmentValue2, DOM.installmentValue3, DOM.installmentValue4,
        DOM.installmentType1, DOM.installmentType2, DOM.installmentType3, DOM.installmentType4,
    ];
    inputsToAutoRecalculate.forEach(input => {
        input?.addEventListener('input', () => Quote.calculateTotals(userId));
    });
    
    // ---- MAIN ACTIONS ----
    DOM.saveCurrentQuoteButton?.addEventListener('click', () => Quote.saveCurrentQuoteToListHandler(userId));
    DOM.exportPdfButton?.addEventListener('click', UI.exportToPdf);
    DOM.printQuoteButton?.addEventListener('click', UI.printCurrentQuote);
    DOM.clearQuoteButton?.addEventListener('click', () => Quote.clearQuoteFormHandler(userId));
    
    // ---- SAVED QUOTES ----
    DOM.savedQuotesTableBody?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;
        if (e.target.classList.contains('load-quote-btn')) Quote.loadQuoteFromList(id, userId);
        else if (e.target.classList.contains('delete-btn')) Quote.deleteQuoteFromList(id, userId);
    });

    // ---- SETTINGS ----
    DOM.saveCompanySettingsButton?.addEventListener('click', () => Quote.saveCompanySettingsHandler(userId));
    DOM.companyLogoFileInput?.addEventListener('change', Quote.companyLogoFileHandler);
    DOM.clearAllDataButton?.addEventListener('click', () => {
        alert("Chức năng này đang được phát triển. Vui lòng liên hệ nhà phát triển để xóa dữ liệu.");
        // Chú ý: Xóa dữ liệu trên Firestore từ client là một hành động phức tạp và cần được bảo mật cẩn thận.
        // Tạm thời vô hiệu hóa để tránh người dùng vô tình xóa dữ liệu.
    });
}
