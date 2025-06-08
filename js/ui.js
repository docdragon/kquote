/**
 * @file ui.js
 * @description Chứa các logic liên quan đến giao diện người dùng (UI) chung.
 */
import * as DOM from './dom.js';
import {
    formatDate,
    formatCurrency,
    numberToWordsVi,
    numberToRoman,
    getLocalStorageUsage,
} from './utils.js';
import {
    calculateTotals,
    getCurrentQuoteItems,
    getCompanySettings,
    getCurrentQuoteId,
    getQuoteInstallmentData
} from './quote.js';
import {
    getMainCategories
} from './catalog.js';

// Hàm điều khiển chỉ báo tải
function showLoader() {
    if (DOM.loader) DOM.loader.style.display = 'flex';
}

function hideLoader() {
    if (DOM.loader) DOM.loader.style.display = 'none';
}


export function openTab(tabName) {
    if (!tabName) {
        console.error("openTab: tabName is undefined");
        return;
    }
    if (!DOM.tabContents || !DOM.tabButtons) {
        console.error("openTab: tabContents or tabButtons not found");
        return;
    }
    DOM.tabContents.forEach(content => {
        if (content) content.classList.remove('active');
    });
    DOM.tabButtons.forEach(button => {
        if (button) button.classList.remove('active');
    });
    const activeTabContent = document.getElementById(tabName);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    } else {
        console.error("openTab: activeTabContent not found for id:", tabName);
    }
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        console.error("openTab: activeButton not found for data-tab:", tabName);
    }
}

export function updateStorageStatus() {
    if (!DOM.storageStatusContainer) return;
    
    const usage = getLocalStorageUsage();
    const usedMB = (usage.used / (1024 * 1024)).toFixed(2);
    const totalMB = (usage.total / (1024 * 1024)).toFixed(2);

    DOM.storageText.textContent = `Đã dùng: ${usedMB} MB / ${totalMB} MB`;
    DOM.storageProgressBarFill.style.width = `${usage.percentage}%`;
    DOM.storageProgressBarFill.textContent = `${usage.percentage.toFixed(1)}%`;

    if (usage.percentage > 90) {
        DOM.storageProgressBarFill.style.backgroundColor = '#dc3545';
    } else if (usage.percentage > 75) {
        DOM.storageProgressBarFill.style.backgroundColor = '#ffc107';
    } else {
        DOM.storageProgressBarFill.style.backgroundColor = '#0d6efd';
    }
}


function createPrintableItemRow(item, itemIndex) {
    const row = document.createElement('tr');
    
    let displayNameInPrint = `<span class="item-name-display">${item.name.toUpperCase()}</span>`;
    let dimPartsPrint = [];
    if (item.length) dimPartsPrint.push(`D ${item.length}mm`);
    if (item.height) dimPartsPrint.push(`C ${item.height}mm`);
    if (item.depth) dimPartsPrint.push(`S ${item.depth}mm`);
    const dimensionsStringPrint = dimPartsPrint.join(' x ');
    if (dimensionsStringPrint) {
        displayNameInPrint += `<br><span class="item-dimensions-display">KT: ${dimensionsStringPrint}</span>`;
    }
    if (item.spec) {
        displayNameInPrint += `<br><span class="item-spec-display">${item.spec}</span>`;
    }
    
    const imgSrcPrint = item.imageDataUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    let displayedMeasureTextPrint = '';
    if (item.calculatedMeasure && typeof item.calculatedMeasure === 'number' && item.calcType !== 'unit') {
        let measureInMeters = item.calculatedMeasure;
        if (item.calcType === 'length') measureInMeters /= 1000;
        else if (item.calcType === 'area') measureInMeters /= 1000000;
        else if (item.calcType === 'volume') measureInMeters /= 1000000000;
        displayedMeasureTextPrint = `${parseFloat(measureInMeters.toFixed(4)).toLocaleString('vi-VN')}`;
    }

    const priceCellContent = item.itemDiscountAmount > 0 
        ? `<span class="strikethrough-price">${formatCurrency(item.originalPrice)}</span><br><strong>${formatCurrency(item.price)}</strong>` 
        : `<strong>${formatCurrency(item.price)}</strong>`;

    row.innerHTML = `
        <td class="cell-align-center">${itemIndex}</td>
        <td><img src="${imgSrcPrint}" alt="" class="item-image-print" style="display:${item.imageDataUrl ? 'block':'none'};"></td>
        <td class="item-name-spec-cell-print">${displayNameInPrint}</td> 
        <td class="cell-align-center">${item.unit}</td>
        <td class="cell-align-right">${displayedMeasureTextPrint}</td> 
        <td class="cell-align-right">${(item.quantity).toLocaleString('vi-VN', {minimumFractionDigits: 0, maximumFractionDigits: 2})}</td> 
        <td class="cell-align-right">${priceCellContent}</td>
        <td class="cell-align-right">${formatCurrency(item.lineTotal)}</td>
    `;
    return row;
}

function renderPrintablePaymentSchedule() {
    const { apply, installments } = getQuoteInstallmentData();
    const grandTotal = calculateTotals().grandTotal;

    if (!apply || grandTotal <= 0) {
        if(DOM.paymentSchedulePrint) DOM.paymentSchedulePrint.style.display = 'none';
        return;
    }

    if(DOM.paymentSchedulePrint) DOM.paymentSchedulePrint.style.display = 'block';
    if(DOM.paymentScheduleBodyPrint) DOM.paymentScheduleBodyPrint.innerHTML = '';

    let content = '';
    installments.forEach((inst) => {
        if (!inst.name && !inst.value) return; 

        let amount = 0;
        if (inst.value > 0) {
            if (inst.type === 'percent') {
                amount = (grandTotal * inst.value) / 100;
            } else {
                amount = inst.value;
            }
        }
        content += `<p><strong>${inst.name}:</strong> ${formatCurrency(amount)}</p>`;
    });
    if (DOM.paymentScheduleBodyPrint) DOM.paymentScheduleBodyPrint.innerHTML = content;
}


function populatePrintableArea() {
    const totals = calculateTotals();
    const companySettings = getCompanySettings();
    const currentQuoteItems = getCurrentQuoteItems();
    const quoteId = getCurrentQuoteId();
    const mainCategories = getMainCategories();
    
    const currentDate = DOM.quoteDateInput.value ? new Date(DOM.quoteDateInput.value + "T00:00:00Z") : new Date();

    if (DOM.printableLogo) {
        if (companySettings.logoDataUrl) {
            DOM.printableLogo.src = companySettings.logoDataUrl;
            DOM.printableLogo.style.display = 'block';
        } else {
            DOM.printableLogo.style.display = 'none';
        }
    }
    if (DOM.printableCompanyName) DOM.printableCompanyName.textContent = companySettings.name || '[Tên Công Ty/Cá Nhân]';
    if (DOM.printableCompanyAddress) DOM.printableCompanyAddress.textContent = companySettings.address || '[Địa chỉ]';
    if (DOM.printableCompanyPhone) DOM.printableCompanyPhone.textContent = companySettings.phone || '[SĐT]';
    if (DOM.printableCompanyEmail) DOM.printableCompanyEmail.textContent = companySettings.email || '[Email]';
    if (DOM.printableCompanyTaxId) DOM.printableCompanyTaxId.textContent = companySettings.taxId || '[MST]';
    if (DOM.printQuoteDate) DOM.printQuoteDate.textContent = formatDate(currentDate);
    if (DOM.printQuoteIdEl) DOM.printQuoteIdEl.textContent = quoteId;
    if (DOM.printCustomerName) DOM.printCustomerName.textContent = DOM.customerNameInput.value;
    if (DOM.printCustomerAddress) DOM.printCustomerAddress.textContent = DOM.customerAddressInput.value;
    if (DOM.printQuoteNotes) DOM.printQuoteNotes.textContent = DOM.quoteNotesInput.value;
    
    if (DOM.printItemList) {
        DOM.printItemList.innerHTML = '';
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

                const headerRow = DOM.printItemList.insertRow();
                headerRow.className = 'main-category-row';
                headerRow.innerHTML = `
                    <td class="main-category-roman-numeral">${numberToRoman(categoryCounter)}</td>
                    <td colspan="6" class="main-category-name">${category.name}</td>
                    <td class="main-category-total">${formatCurrency(categoryTotal)}</td>
                `;

                itemsInCategory.forEach(item => {
                    itemCounter++;
                    DOM.printItemList.appendChild(createPrintableItemRow(item, itemCounter));
                });
            }
        });

        if (itemsWithoutCategory.length > 0) {
            if (groupedItems.size > 0) {
                const separatorRow = DOM.printItemList.insertRow();
                separatorRow.className = 'main-category-row';
                separatorRow.innerHTML = `<td colspan="8" style="text-align:center; font-style:italic;">Hạng mục khác</td>`;
            }
            itemsWithoutCategory.forEach(item => {
                itemCounter++;
                DOM.printItemList.appendChild(createPrintableItemRow(item, itemCounter));
            });
        }
    }

    if (DOM.printSubTotal) DOM.printSubTotal.textContent = formatCurrency(totals.subTotal);
    
    if (DOM.printDiscountLine) DOM.printDiscountLine.style.display = totals.applyDiscount && totals.discountValue > 0 ? 'flex' : 'none';
    if (DOM.printDiscountAmount) DOM.printDiscountAmount.textContent = formatCurrency(totals.discountValue);
    
    if (DOM.printSubTotalAfterDiscountLine) DOM.printSubTotalAfterDiscountLine.style.display = totals.applyDiscount && totals.discountValue > 0 ? 'flex' : 'none';
    if (DOM.printSubTotalAfterDiscount) DOM.printSubTotalAfterDiscount.textContent = formatCurrency(totals.subTotalAfterDiscount);
    
    if (DOM.printTaxLine) DOM.printTaxLine.style.display = totals.applyTax && totals.taxValue > 0 ? 'flex' : 'none';
    
    if (DOM.printTaxPercent) {
        DOM.printTaxPercent.textContent = totals.taxPercent;
    }
    
    if (DOM.printTaxAmount) DOM.printTaxAmount.textContent = formatCurrency(totals.taxValue);
    if (DOM.printTotalPrice) DOM.printTotalPrice.textContent = formatCurrency(totals.grandTotal);
    if (DOM.printTotalInWords) DOM.printTotalInWords.textContent = numberToWordsVi(totals.grandTotal);
    
    if (companySettings.bankAccount) {
        if(DOM.paymentInfoPrint) DOM.paymentInfoPrint.style.display = 'block';
        if(DOM.paymentInfoBodyPrint) DOM.paymentInfoBodyPrint.textContent = companySettings.bankAccount;
    } else {
        if(DOM.paymentInfoPrint) DOM.paymentInfoPrint.style.display = 'none';
    }

    renderPrintablePaymentSchedule();
};


export async function exportToPdf() {
    const currentQuoteItems = getCurrentQuoteItems();
    if (currentQuoteItems.length === 0) {
        alert("Chưa có hạng mục để xuất PDF.");
        return;
    }
    
    showLoader();
    
    await new Promise(resolve => setTimeout(resolve, 50)); 

    populatePrintableArea();
    const elementToCapture = DOM.printableQuoteArea;
    elementToCapture.style.display = 'block';
    
    try {
        const canvas = await html2canvas(elementToCapture, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            width: elementToCapture.offsetWidth,
            height: elementToCapture.offsetHeight,
            windowWidth: elementToCapture.scrollWidth,
            windowHeight: elementToCapture.scrollHeight
        });
        const imgData = canvas.toDataURL('image/png', 0.9);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        let newImgWidth = pdfWidth - 15;
        let newImgHeight = newImgWidth / imgRatio;
        if (newImgHeight > pdfHeight - 15) {
            newImgHeight = pdfHeight - 15;
            newImgWidth = newImgHeight * imgRatio;
        }
        const xOffset = (pdfWidth - newImgWidth) / 2;
        const yOffset = 7.5;
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, newImgWidth, newImgHeight);
        pdf.save(`BaoGia_${(DOM.customerNameInput.value || 'KhachHang').replace(/[^a-zA-Z0-9]/g,'_')}_${getCurrentQuoteId() || Date.now()}.pdf`);
    } catch (e) {
        console.error("Lỗi PDF:", e);
        alert("Lỗi xuất PDF: " + e.message);
    } finally {
        elementToCapture.style.display = 'none';
        hideLoader();
        updateStorageStatus();
    }
};

export function printCurrentQuote() {
    const currentQuoteItems = getCurrentQuoteItems();
    if (currentQuoteItems.length === 0) {
        alert("Chưa có hạng mục để in.");
        return;
    }
    
    showLoader();
    setTimeout(() => {
        populatePrintableArea();
        DOM.printableQuoteArea.style.display = 'block';
        
        try {
            window.print();
        } catch (e) {
            console.error("Lỗi khi in:", e);
            alert("Đã có lỗi xảy ra trong quá trình in.");
        } finally {
            setTimeout(() => {
                DOM.printableQuoteArea.style.display = 'none';
                hideLoader();
                updateStorageStatus();
            }, 500);
        }
    }, 100);
};
