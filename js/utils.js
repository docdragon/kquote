/**
 * @file utils.js
 * @description Chứa các hàm tiện ích chung, có thể tái sử dụng trong toàn bộ ứng dụng.
 */

export function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number || 0);
}

export function formatDate(dateStringOrDate) {
    if (!dateStringOrDate) return '';
    const date = new Date(dateStringOrDate);
    if (isNaN(date.getTime())) return '';
    try {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        return '';
    }
}

export function numberToWordsVi(s) {
    const dg = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const dv = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ', 'tỷ tỷ'];
    s = String(s).split('.')[0];
    if (s === "0" || s === "") return "Không";
    let i = s.length;
    if (i == 0) return dg[0];
    let str = "",
        M = 0;
    while (i > 0) {
        let CS = "";
        let H = -1,
            CH = -1,
            DVV = -1;
        DVV = parseInt(s.substring(i - 1, i));
        i--;
        if (i > 0) {
            CH = parseInt(s.substring(i - 1, i));
            i--;
        }
        if (i > 0) {
            H = parseInt(s.substring(i - 1, i));
            i--;
        }
        if (H !== -1 && H !== 0) CS += dg[H] + " trăm ";
        else if (H === 0 && (CH !== 0 || DVV !== 0) && (M > 0 || s.length > 3) && str.trim() !== "") CS += "không trăm ";
        if (CH !== -1 && CH !== 0) {
            if (CH === 1) CS += "mười ";
            else CS += dg[CH] + " mươi ";
        } else if (CH === 0 && DVV !== 0 && H !== -1 && (H !== 0 || (M > 0 && str.trim() !== "") || s.length > 3)) CS += "lẻ ";
        if (DVV !== -1 && DVV !== 0) {
            if (CH === 1 && DVV === 1) {
                CS = CS.replace("mười ", "mười một ");
            } else if (CH === 1 && DVV === 5) {
                CS = CS.replace("mười ", "mười lăm ");
            } else if (CH !== 1 && DVV === 1 && CH !== 0) {
                CS += "mốt ";
            } else if (CH !== 1 && DVV === 5 && CH !== 0) {
                CS += "lăm ";
            } else if (DVV === 4 && CH !== undefined && CH > 1) {
                CS += "tư ";
            } else {
                CS += dg[DVV] + " ";
            }
        }
        if (H !== -1 || CH !== -1 || DVV !== -1) {
            if ((H !== 0 || CH !== 0 || DVV !== 0)) {
                if (M > 0) CS += dv[M] + " ";
                str = CS + str;
            } else if (M > 0 && str.trim() === "" && M < dv.length) { /* No action */ } else if (M === 0 && s === "0") {
                str = CS + str;
            }
        }
        M++;
    }
    str = str.replace(/ +/g, " ").trim();
    if (str === "") return "Không đồng";
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng";
}

export function generateProfessionalQuoteId() { // For main quote ID
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    let dailyCounter = 1;
    try {
        const lastQuoteInfo = JSON.parse(localStorage.getItem('lastQuoteIdInfo')) || {};
        if (lastQuoteInfo.date === datePrefix) {
            dailyCounter = (lastQuoteInfo.counter || 0) + 1;
        }
        localStorage.setItem('lastQuoteIdInfo', JSON.stringify({
            date: datePrefix,
            counter: dailyCounter
        }));
    } catch (e) {
        console.error("Failed to read/write lastQuoteIdInfo from localStorage", e);
    }
    return `${datePrefix}-${String(dailyCounter).padStart(3, '0')}`;
}

export function generateUniqueId(prefix = 'id') { // For item IDs etc.
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function numberToRoman(num) {
    if (num < 1) return '';
    const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const rom = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
    let result = '';
    for (let i = 0; i < val.length; i++) {
        while (num >= val[i]) {
            result += rom[i];
            num -= val[i];
        }
    }
    return result;
}
export function getLocalStorageUsage() {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        // Ước tính kích thước (UTF-16, 2 bytes/char) - một cách tiếp cận đơn giản và nhanh chóng
        totalBytes += (key.length + value.length) * 2;
    }
    const totalStorage = 5 * 1024 * 1024; // Giả định 5MB
    const percentage = Math.min((totalBytes / totalStorage) * 100, 100);

    return {
        used: totalBytes,
        total: totalStorage,
        percentage: percentage
    };
}