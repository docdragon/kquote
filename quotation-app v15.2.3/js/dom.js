/**
 * @file dom.js
 * @description Tập trung tất cả các truy vấn DOM.
 */

export const loader = document.getElementById('loader');

// Tabs
export const tabButtons = document.querySelectorAll('.tab-button');
export const tabContents = document.querySelectorAll('.tab-content');

// Quote Info
export const customerNameInput = document.getElementById('customerName');
export const customerAddressInput = document.getElementById('customerAddress');
export const quoteDateInput = document.getElementById('quoteDate');
export const quoteNotesInput = document.getElementById('quoteNotes');

// Quote Item Entry Form
export const quoteItemEntryFormDiv = document.getElementById('quoteItemEntryForm');
export const editingQuoteItemIdInputForm = document.getElementById('editingQuoteItemIdForm');
export const quoteItemMainCategoryInput = document.getElementById('quoteItemMainCategoryInput');
export const mainCategoryDataList = document.getElementById('mainCategoryDataList');

// CHANGE: Thay thế các phần tử cũ bằng combobox
export const catalogItemCombobox = document.getElementById('catalogItemCombobox');
export const catalogDatalist = document.getElementById('catalogDatalist');

export const itemNameQuoteForm = document.getElementById('itemNameQuoteForm');
export const itemSpecQuoteForm = document.getElementById('itemSpecQuoteForm');
export const itemUnitQuoteForm = document.getElementById('itemUnitQuoteForm');
export const itemPriceQuoteForm = document.getElementById('itemPriceQuoteForm');
export const itemDiscountValueForm = document.getElementById('itemDiscountValueForm');
export const itemDiscountTypeForm = document.getElementById('itemDiscountTypeForm');
export const itemCalcTypeQuoteForm = document.getElementById('itemCalcTypeQuoteForm');
export const itemLengthQuoteForm = document.getElementById('itemLengthQuoteForm');
export const itemHeightQuoteForm = document.getElementById('itemHeightQuoteForm');
export const itemDepthQuoteForm = document.getElementById('itemDepthQuoteForm');
export const itemQuantityQuoteForm = document.getElementById('itemQuantityQuoteForm');
export const itemImageFileQuoteForm = document.getElementById('itemImageFileQuoteForm');
export const itemImagePreviewQuoteForm = document.getElementById('itemImagePreviewQuoteForm');
export const addOrUpdateItemButtonForm = document.getElementById('addOrUpdateItemButtonForm');
export const quickSaveToCatalogButtonForm = document.getElementById('quickSaveToCatalogButtonForm');
export const cancelEditQuoteItemButtonForm = document.getElementById('cancelEditQuoteItemButtonForm');

// Quote Preview & Totals
export const itemListPreviewTableBody = document.getElementById('itemListPreview');
export const prepareNewQuoteItemButton = document.getElementById('prepareNewQuoteItemButton');
export const subTotalSpan = document.getElementById('subTotal');
export const applyDiscountCheckbox = document.getElementById('applyDiscountCheckbox');
export const discountValueInput = document.getElementById('discountValueInput'); 
export const discountTypeSelect = document.getElementById('discountTypeSelect');
export const discountAmountSpan = document.getElementById('discountAmount');
export const applyTaxCheckbox = document.getElementById('applyTaxCheckbox');
export const taxPercentInput = document.getElementById('taxPercent');
export const taxAmountSpan = document.getElementById('taxAmount');
export const totalPriceSpan = document.getElementById('totalPrice');

// Installments Section
export const applyInstallmentsCheckbox = document.getElementById('applyInstallmentsCheckbox');
export const installmentsContainer = document.getElementById('installmentsContainer');
export const installmentName1 = document.getElementById('installmentName1');
export const installmentValue1 = document.getElementById('installmentValue1');
export const installmentType1 = document.getElementById('installmentType1');
export const installmentAmount1 = document.getElementById('installmentAmount1');
export const installmentName2 = document.getElementById('installmentName2');
export const installmentValue2 = document.getElementById('installmentValue2');
export const installmentType2 = document.getElementById('installmentType2');
export const installmentAmount2 = document.getElementById('installmentAmount2');
export const installmentName3 = document.getElementById('installmentName3');
export const installmentValue3 = document.getElementById('installmentValue3');
export const installmentType3 = document.getElementById('installmentType3');
export const installmentAmount3 = document.getElementById('installmentAmount3');
export const installmentName4 = document.getElementById('installmentName4');
export const installmentValue4 = document.getElementById('installmentValue4');
export const installmentType4 = document.getElementById('installmentType4');
export const installmentAmount4 = document.getElementById('installmentAmount4');
export const installmentsTotalAmount = document.getElementById('installmentsTotalAmount');
export const installmentsRemainingAmount = document.getElementById('installmentsRemainingAmount');
export const installmentsTotalPercent = document.getElementById('installmentsTotalPercent');

// Main Action Buttons
export const saveCurrentQuoteButton = document.getElementById('saveCurrentQuoteButton');
export const exportPdfButton = document.getElementById('exportPdfButton');
export const printQuoteButton = document.getElementById('printQuoteButton');
export const clearQuoteButton = document.getElementById('clearQuoteButton');

// Saved Quotes Tab
export const savedQuotesTableBody = document.getElementById('savedQuotesList');

// Catalog Management Tab
export const excelFileInputManage = document.getElementById('excelFileManage');
export const reloadExcelButton = document.getElementById('reloadExcelButton');
export const catalogSearchInput = document.getElementById('catalogSearchInput');
export const catalogPreviewList = document.getElementById('catalogPreviewList');
export const catalogItemCount = document.getElementById('catalogItemCount');
export const exportCatalogButton = document.getElementById('exportCatalogButton');
export const catalogPreviewTable = document.getElementById('catalogPreviewTable'); 

// Catalog Entry Edit Form
export const editingCatalogEntryIdInput = document.getElementById('editingCatalogEntryId');
export const catalogItemMainCategorySelect = document.getElementById('catalogItemMainCategorySelect');
export const catalogEditNameInput = document.getElementById('catalogEditName');
export const catalogEditSpecInput = document.getElementById('catalogEditSpec');
export const catalogEditUnitInput = document.getElementById('catalogEditUnit');
export const catalogEditPriceInput = document.getElementById('catalogEditPrice');
export const saveCatalogEntryButton = document.getElementById('saveCatalogEntryButton');
export const cancelCatalogEntryEditButton = document.getElementById('cancelCatalogEntryEditButton');

// Main Category Management
export const mainCategoryNameInput = document.getElementById('mainCategoryNameInput');
export const editingMainCategoryIdInput = document.getElementById('editingMainCategoryId');
export const addOrUpdateMainCategoryButton = document.getElementById('addOrUpdateMainCategoryButton');
export const cancelEditMainCategoryButton = document.getElementById('cancelEditMainCategoryButton');
export const mainCategoriesTableBody = document.getElementById('mainCategoriesList');
export const mainCategoryCountSpan = document.getElementById('mainCategoryCount');

// Company Settings Tab
export const companyNameSettingInput = document.getElementById('companyNameSetting');
export const companyAddressSettingInput = document.getElementById('companyAddressSetting');
export const companyPhoneSettingInput = document.getElementById('companyPhoneSetting');
export const companyEmailSettingInput = document.getElementById('companyEmailSetting');
export const companyTaxIdSettingInput = document.getElementById('companyTaxIdSetting');
export const companyBankAccountSetting = document.getElementById('companyBankAccountSetting');
export const companyLogoFileInput = document.getElementById('companyLogoFile');
export const logoPreview = document.getElementById('logoPreview');
export const saveCompanySettingsButton = document.getElementById('saveCompanySettingsButton');
export const clearAllDataButton = document.getElementById('clearAllDataButton');
export const storageStatusContainer = document.getElementById('storageStatusContainer');
export const storageText = document.getElementById('storageText');
export const storageProgressBarFill = document.getElementById('storageProgressBarFill');

// Printable Area Elements
export const printableQuoteArea = document.getElementById('printableQuoteArea');
export const printableLogo = document.getElementById('printableLogo');
export const printableCompanyName = document.getElementById('printableCompanyName');
export const printableCompanyAddress = document.getElementById('printableCompanyAddress');
export const printableCompanyPhone = document.getElementById('printableCompanyPhone');
export const printableCompanyEmail = document.getElementById('printableCompanyEmail');
export const printableCompanyTaxId = document.getElementById('printableCompanyTaxId');
export const printQuoteDate = document.getElementById('printQuoteDate');
export const printQuoteIdEl = document.getElementById('printQuoteIdEl');
export const printCustomerName = document.getElementById('printCustomerName');
export const printCustomerAddress = document.getElementById('printCustomerAddress');
export const printItemList = document.getElementById('printItemList');
export const printSubTotal = document.getElementById('printSubTotal');
export const printSubTotalLine = document.getElementById('printSubTotalLine');
export const printDiscountAmount = document.getElementById('printDiscountAmount');
export const printDiscountLine = document.getElementById('printDiscountLine');
export const printSubTotalAfterDiscount = document.getElementById('printSubTotalAfterDiscount');
export const printSubTotalAfterDiscountLine = document.getElementById('printSubTotalAfterDiscountLine');
export const printTaxPercent = document.getElementById('printTaxPercent');
export const printTaxAmount = document.getElementById('printTaxAmount');
export const printTaxLine = document.getElementById('printTaxLine');
export const printTotalPrice = document.getElementById('printTotalPrice');
export const printTotalInWords = document.getElementById('printTotalInWords');
export const printQuoteNotes = document.getElementById('printQuoteNotes');
export const paymentInfoPrint = document.getElementById('paymentInfoPrint');
export const paymentInfoBodyPrint = document.getElementById('paymentInfoBodyPrint');
export const paymentSchedulePrint = document.getElementById('paymentSchedulePrint');
export const paymentScheduleBodyPrint = document.getElementById('paymentScheduleBodyPrint');
