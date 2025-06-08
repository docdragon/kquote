/**
 * @file ui.js
 * @description Chứa các logic liên quan đến giao diện người dùng (UI) chung.
 */
import * as DOM from './dom.js';
import { formatDate, formatCurrency, numberToWordsVi, numberToRoman } from './utils.js';
import { calculateTotals, getCurrentQuoteItems, getCompanySettings, getCurrentQuoteId, getQuoteInstallmentData } from './quote.js';
import { getMainCategories } from './catalog.js';

export function showLoader() {
    if (DOM.loader) DOM.loader.style.display = 'flex';
}

export function hideLoader() {
    if (DOM.loader) DOM.loader.style.display = 'none';
}

export function openTab(tabName) {
    if (!tabName) return;
    DOM.tabContents.forEach(content => content.classList.remove('active'));
    DOM.tabButtons.forEach(button => button.classList.remove('active'));
    document.getElementById(tabName)?.classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabName}"]`)?.classList.add('active');
}

function createPrintableItemRow(item, itemIndex) {
    const row = document.createElement('tr');
    
    let displayNameInPrint = `<span class="item-name-display">${item.name.toUpperCase()}</span>`;
    let dimPartsPrint = [];
    if (item.length) dimPartsPrint.push(`D ${item.length}mm`);
    if (item.height) dimPartsPrint.push(`C ${item.height}mm`);
    if (item.depth) dimPartsPrint.push(`S ${item.depth}mm`);
    if (dimPartsPrint.length > 0) {
        displayNameInPrint += `<br><span class="item-dimensions-display">KT: ${dimPartsPrint.join(' x ')}</span>`;
    }
    if (item.spec) {
        displayNameInPrint += `<br><span class="item-spec-display">${item.spec}</span>`;
    }
    
    const imgSrcPrint = item.imageDataUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    let displayedMeasureTextPrint = '';
    // Logic to display calculated measure can be added here if needed

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
    const totals = calculateTotals(); // Recalculate to get latest grandTotal, NO user ID needed here as it's just calculation
    const grandTotal = totals.grandTotal;

    if (!apply || grandTotal <= 0) {
        if(DOM.paymentSchedulePrint) DOM.paymentSchedulePrint.style.display = 'none';
        return;
    }

    DOM.paymentSchedulePrint.style.display = 'block';
    DOM.paymentScheduleBodyPrint.innerHTML = '';

    let content = '';
    installments.forEach((inst) => {
        if (!inst.name && !inst.value) return; 
        const amount = (inst.type === 'percent') ? (grandTotal * inst.value) / 100 : inst.value;
        content += `<p><strong>${inst.name}:</strong> ${formatCurrency(amount)}</p>`;
    });
    DOM.paymentScheduleBodyPrint.innerHTML = content;
}

function populatePrintableArea() {
    const totals = calculateTotals(); // No userId needed for pure calculation
    const companySettings = getCompanySettings();
    const currentQuoteItems = getCurrentQuoteItems();
    const quoteId = getCurrentQuoteId();
    const mainCategories = getMainCategories();
    
    // ... (rest of the logic is the same as the localStorage version)
    // It populates DOM elements like DOM.printableCompanyName, etc.
    
    renderPrintablePaymentSchedule();
}

export async function exportToPdf() {
    if (getCurrentQuoteItems().length === 0) {
        alert("Chưa có hạng mục để xuất PDF.");
        return;
    }
    
    showLoader();
    await new Promise(resolve => setTimeout(resolve, 50)); 
    populatePrintableArea();
    const elementToCapture = DOM.printableQuoteArea;
    elementToCapture.style.display = 'block';
    
    try {
        const { jsPDF } = window.jspdf;
        const canvas = await html2canvas(elementToCapture, { scale: 2.5, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`BaoGia_${(DOM.customerNameInput.value || 'KhachHang').replace(/[^a-zA-Z0-9]/g,'_')}.pdf`);
    } catch (e) {
        console.error("Lỗi PDF:", e);
        alert("Lỗi xuất PDF: " + e.message);
    } finally {
        elementToCapture.style.display = 'none';
        hideLoader();
    }
};

export function printCurrentQuote() {
    if (getCurrentQuoteItems().length === 0) {
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
        } finally {
            // Use a listener for afterprint event for better reliability
            const afterPrint = () => {
                DOM.printableQuoteArea.style.display = 'none';
                hideLoader();
                window.removeEventListener('afterprint', afterPrint);
            };
            window.addEventListener('afterprint', afterPrint);
        }
    }, 100);
};
