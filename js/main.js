/**
 * @file main.js
 * @description Điểm khởi đầu của ứng dụng (Entry Point).
 */

import * as DOM from './dom.js';
import * as Catalog from './catalog.js';
import * as Quote from './quote.js';
import * as UI from './ui.js';

document.addEventListener('DOMContentLoaded', () => {

    // === SETUP EVENT LISTENERS ===
    
    DOM.tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            UI.openTab(tabName);
            if (tabName === 'tabSettings') {
                UI.updateStorageStatus();
            }
        });
    });

    if (DOM.excelFileInputManage) DOM.excelFileInputManage.addEventListener('change', Catalog.handleExcelFileGeneric);
    if (DOM.reloadExcelButton) DOM.reloadExcelButton.addEventListener('click', () => DOM.excelFileInputManage.click());
    if (DOM.catalogSearchInput) DOM.catalogSearchInput.addEventListener('input', Catalog.renderCatalogPreviewTable);
    if (DOM.exportCatalogButton) DOM.exportCatalogButton.addEventListener('click', Catalog.exportCatalogHandler);
    if (DOM.saveCatalogEntryButton) DOM.saveCatalogEntryButton.addEventListener('click', Catalog.saveCatalogEntryHandler);
    if (DOM.cancelCatalogEntryEditButton) DOM.cancelCatalogEntryEditButton.addEventListener('click', Catalog.resetCatalogEditForm);
    if (DOM.catalogPreviewList) {
        DOM.catalogPreviewList.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id) return;
            if (target.classList.contains('edit-btn')) {
                Catalog.editCatalogEntry(id);
            } else if (target.classList.contains('delete-btn')) {
                Catalog.deleteCatalogEntry(id);
            }
        });
    }

    if (DOM.addOrUpdateMainCategoryButton) DOM.addOrUpdateMainCategoryButton.addEventListener('click', Catalog.addOrUpdateMainCategoryHandler);
    if (DOM.cancelEditMainCategoryButton) DOM.cancelEditMainCategoryButton.addEventListener('click', Catalog.resetMainCategoryForm);
    if (DOM.mainCategoriesTableBody) {
        DOM.mainCategoriesTableBody.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id) return;

            if (target.classList.contains('edit-btn')) {
                Catalog.editMainCategory(id);
            } else if (target.classList.contains('delete-btn')) {
                const quoteDeps = {
                    getCurrentQuoteItems: Quote.getCurrentQuoteItems,
                    getSavedQuotes: Quote.getSavedQuotes,
                    updateQuoteItem: Quote.updateQuoteItem,
                    updateSavedQuote: Quote.updateSavedQuote,
                };
                Catalog.deleteMainCategory(id, quoteDeps);
            }
        });
    }

    if (DOM.catalogItemCombobox) {
        DOM.catalogItemCombobox.addEventListener('input', Quote.handleCatalogComboboxSelection);
    }
    if (DOM.itemImageFileQuoteForm) DOM.itemImageFileQuoteForm.addEventListener('change', Quote.itemImageFileQuoteFormHandler);
    if (DOM.addOrUpdateItemButtonForm) DOM.addOrUpdateItemButtonForm.addEventListener('click', Quote.addOrUpdateItemFromForm);
    if (DOM.quickSaveToCatalogButtonForm) DOM.quickSaveToCatalogButtonForm.addEventListener('click', Quote.quickSaveToCatalogFromFormHandler);
    if (DOM.cancelEditQuoteItemButtonForm) DOM.cancelEditQuoteItemButtonForm.addEventListener('click', Quote.resetQuoteItemFormEditingState);
    if (DOM.prepareNewQuoteItemButton) DOM.prepareNewQuoteItemButton.addEventListener('click', Quote.prepareNewQuoteItemHandler);

    if (DOM.itemListPreviewTableBody) {
        DOM.itemListPreviewTableBody.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = target.dataset.id;
            if (!id) return;

            if (target.classList.contains('edit-btn')) {
                Quote.editQuoteItemOnForm(id);
            } else if (target.classList.contains('delete-btn')) {
                Quote.deleteQuoteItem(id);
            } else if (target.classList.contains('quick-save-to-catalog-btn-row')) {
                Quote.saveThisQuoteItemToMasterCatalog(id);
            }
        });
    }

    if (DOM.applyDiscountCheckbox) DOM.applyDiscountCheckbox.addEventListener('change', Quote.calculateTotals);
    if (DOM.applyTaxCheckbox) DOM.applyTaxCheckbox.addEventListener('change', Quote.calculateTotals);
    
    const inputsToAutoRecalculate = [
        DOM.discountValueInput, 
        DOM.discountTypeSelect, 
        DOM.taxPercentInput
    ];
    inputsToAutoRecalculate.forEach(input => {
        if (input) {
            input.addEventListener('input', Quote.calculateTotals);
            input.addEventListener('change', Quote.calculateTotals);
        }
    });
    
    if (DOM.applyInstallmentsCheckbox) DOM.applyInstallmentsCheckbox.addEventListener('change', Quote.calculateTotals);
    const installmentInputs = [
        DOM.installmentName1, DOM.installmentValue1, DOM.installmentType1,
        DOM.installmentName2, DOM.installmentValue2, DOM.installmentType2,
        DOM.installmentName3, DOM.installmentValue3, DOM.installmentType3,
        DOM.installmentName4, DOM.installmentValue4, DOM.installmentType4,
    ];
    installmentInputs.forEach(input => {
        if(input) {
            input.addEventListener('input', Quote.calculateTotals);
            input.addEventListener('change', Quote.calculateTotals);
        }
    });

    if (DOM.saveCurrentQuoteButton) DOM.saveCurrentQuoteButton.addEventListener('click', Quote.saveCurrentQuoteToListHandler);
    if (DOM.exportPdfButton) DOM.exportPdfButton.addEventListener('click', UI.exportToPdf);
    if (DOM.printQuoteButton) DOM.printQuoteButton.addEventListener('click', UI.printCurrentQuote);
    if (DOM.clearQuoteButton) DOM.clearQuoteButton.addEventListener('click', Quote.clearQuoteFormHandler);

    if (DOM.savedQuotesTableBody) {
        DOM.savedQuotesTableBody.addEventListener('click', (e) => {
            const target = e.target;
            const id = target.dataset.id;
            if (!id) return;
            if (target.classList.contains('load-quote-btn')) {
                Quote.loadQuoteFromList(id);
            } else if (target.classList.contains('delete-btn')) {
                Quote.deleteQuoteFromList(id);
            }
        });
    }

    if (DOM.saveCompanySettingsButton) DOM.saveCompanySettingsButton.addEventListener('click', Quote.saveCompanySettingsHandler);
    if (DOM.companyLogoFileInput) DOM.companyLogoFileInput.addEventListener('change', Quote.companyLogoFileHandler);
    
    if (DOM.clearAllDataButton) {
        DOM.clearAllDataButton.addEventListener('click', () => {
            if (confirm('BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ DỮ LIỆU?\n\nHành động này sẽ xóa vĩnh viễn:\n- Tất cả các báo giá đã lưu\n- Toàn bộ danh mục sản phẩm\n- Danh mục chính\n- Cài đặt công ty\n\nHành động này không thể hoàn tác!')) {
                localStorage.clear();
                alert('Đã xóa toàn bộ dữ liệu. Trang sẽ được tải lại.');
                window.location.reload();
            }
        });
    }

    // === INITIALIZE APP ===
    console.log("Initializing Quotation App...");
    UI.openTab('tabQuote');
    Quote.loadCompanySettings();
    Quote.loadSavedQuotesFromLocalStorage();
    Catalog.loadCatalogFromLocalStorage();
    Catalog.loadMainCategories(); 
    Quote.loadCurrentWorkingQuoteFromLocalStorage(); 

    UI.updateStorageStatus();

    if (DOM.quoteDateInput && !DOM.quoteDateInput.valueAsDate && DOM.quoteDateInput.value === '') {
        DOM.quoteDateInput.value = new Date().toISOString().split('T')[0];
    }
    if (!Quote.getCurrentQuoteId() && DOM.printQuoteIdEl) {
        Quote.startNewQuote();
    }
    
    console.log("App Initialized.");
});
