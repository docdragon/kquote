/**
 * @file utils.js
 * @description Chứa các hàm tiện ích chung, có thể tái sử dụng trong toàn bộ ứng dụng.
 */

/**
 * Định dạng một số thành chuỗi tiền tệ VNĐ.
 * @param {number} number - Số cần định dạng.
 * @returns {string} Chuỗi đã định dạng.
 */
export function formatCurrency(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number || 0);
}

/**
 * Định dạng ngày thành chuỗi 'DD/MM/YYYY'.
 * @param {string|Date} dateStringOrDate - Ngày cần định dạng.
 * @returns {string} Chuỗi ngày đã định dạng.
 */
export function formatDate(dateStringOrDate) {
    if (!dateStringOrDate) return '';
    try {
        const date = new Date(dateStringOrDate);
        if (isNaN(date.getTime())) return '';
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
        return '';
    }
}

/**
 * Chuyển số thành chữ Tiếng Việt.
 * @param {number|string} s - Số cần chuyển đổi.
 * @returns {string} Chuỗi chữ tương ứng.
 */
export function numberToWordsVi(s) {
    const dg = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const dv = ['', 'nghìn', 'triệu', 'tỷ'];
    s = String(s).split('.')[0];
    if (s === "0") return "Không";
    let i = s.length;
    let str = "";
    let M = 0;
    while (i > 0) {
        let CS = "";
        let DVV = parseInt(s.substring(i - 1, i));
        i--;
        let CH = (i > 0) ? parseInt(s.substring(i - 1, i--)) : -1;
        let H = (i > 0) ? parseInt(s.substring(i - 1, i--)) : -1;

        if (H !== -1 && H !== 0) CS += dg[H] + " trăm ";
        if (CH !== -1 && CH !== 0) CS += (CH === 1 ? "mười " : dg[CH] + " mươi ");
        if (CH === 0 && DVV !== 0 && H !== -1) CS += "lẻ ";
        
        if (DVV !== -1 && DVV !== 0) {
            if (CH === 1 && DVV === 1) CS = CS.replace("mười ", "mười một ");
            else if (CH === 1 && DVV === 5) CS = CS.replace("mười ", "mười lăm ");
            else if (CH !== 1 && DVV === 1 && CH !== 0) CS += "mốt ";
            else if (DVV === 5 && CH > 1) CS += "lăm ";
            else CS += dg[DVV] + " ";
        }
        
        if (CS.trim() !== "") {
            str = CS + (dv[M] || '') + " " + str;
        }
        M++;
    }
    str = str.trim();
    return str.charAt(0).toUpperCase() + str.slice(1) + " đồng";
}

/**
 * Tạo ID báo giá chuyên nghiệp dựa trên ngày.
 * @returns {string} ID báo giá.
 */
export function generateProfessionalQuoteId() {
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const randomSuffix = Date.now().toString().slice(-5);
    return `${datePrefix}-${randomSuffix}`;
}

/**
 * Tạo ID duy nhất cho các hạng mục.
 * @param {string} [prefix='id'] - Tiền tố cho ID.
 * @returns {string} ID duy nhất.
 */
export function generateUniqueId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * Chuyển số thành số La Mã.
 * @param {number} num - Số cần chuyển đổi.
 * @returns {string} Chuỗi số La Mã.
 */
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
