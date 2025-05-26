// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('orderForm');
  
  // 處理表單提交
  form.addEventListener('submit', function(event) {

    const recaptchaResponse  = grecaptcha.getResponse();
    if (!recaptchaResponse ) {
      event.preventDefault();
      alert("請先通過驗證");
      grecaptcha.reset();
      return;
    }
    
    // 🔽 至少填寫一項電話欄位的驗證
    const phone = document.getElementById('phone');
    const indoorPhone = document.getElementById('indoorPhone');
    const phoneValue = phone?.value.trim() || '';
    const indoorPhoneValue = indoorPhone?.value.trim() || '';

    if (!phoneValue && !indoorPhoneValue) {
      event.preventDefault();
      phone.setCustomValidity("請至少填寫市話或手機號碼");
      indoorPhone.setCustomValidity("請至少填寫市話或手機號碼");
      
      grecaptcha.reset();
      const modal = new bootstrap.Modal(document.getElementById('phoneWarningModal'));
      modal.show();
      return;
    } else {
      phone.setCustomValidity("");
      indoorPhone.setCustomValidity("");
    }

    // 表單驗證
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
      form.classList.add('was-validated');

      grecaptcha.reset();
      return;
    }

    // 填入 reCAPTCHA token 至隱藏欄位
    document.getElementById('gRecaptchaResponse').value = recaptchaResponse;
  });
  
  // 計算單項商品總價
  function calculateItemTotal() {
    const quantityInputs = document.querySelectorAll('.quantity');
    const priceInputs = document.querySelectorAll('.price');
    const totalInputs = document.querySelectorAll('.total');
    let grandTotal = 0;
    
    for (let i = 0; i < quantityInputs.length; i++) {
      const quantity = parseFloat(quantityInputs[i].value) || 0;
      const price = parseFloat(priceInputs[i].value) || 0;
      const total = quantity * price;
      
      totalInputs[i].value = total;
      grandTotal += total;
    }
    
    // 更新總金額顯示
    document.getElementById('grandTotal').textContent = grandTotal.toLocaleString() + ' 元';
    document.getElementById('hiddenTotal').value = grandTotal;
  }
  
  // 監聽數量和價格變更事件
  document.addEventListener('input', function(event) {
    if (event.target.classList.contains('quantity') || event.target.classList.contains('price')) {
      calculateItemTotal();
    }
  });
  
  // 添加新商品行
  window.addRow = function () {
    const tbody = document.getElementById('productTbody');
    const rowCount = tbody.children.length;

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td data-label="編號">
        <input type="text" class="form-control" name="items[${rowCount}][number]" required>
      </td>
      <td data-label="品名">
        <input type="text" class="form-control" name="items[${rowCount}][name]" required>
      </td>
      <td data-label="規格">
        <input type="text" class="form-control" name="items[${rowCount}][spec]">
      </td>
      <td data-label="數量">
        <input type="number" class="form-control quantity" name="items[${rowCount}][quantity]" oninput="value=value.replace('-','')" required>
      </td>
      <td data-label="單價">
        <input type="number" class="form-control price" name="items[${rowCount}][price]" oninput="value=value.replace('-','')" required>
      </td>
      <td data-label="總價">
        <input type="number" class="form-control total" name="items[${rowCount}][total]" readonly>
      </td>
      <td data-label="操作">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">刪除</button>
      </td>
    `;

    tbody.appendChild(newRow);
  };


  
  window.removeRow = function(button) {
    const tableBody = document.getElementById('productTbody');
    const rows = Array.from(tableBody.children);

    if (rows.length <= 1) {
      alert('至少需要一項商品！');
      return;
    }

    // 刪除該列
    const targetRow = button.closest('tr');
    targetRow.remove();

    // 重新編號剩下每一列的 input name 和 data-label（保持正確索引）
    const updatedRows = Array.from(tableBody.children);
    updatedRows.forEach((row, index) => {
      const cells = row.children;

      if (cells.length === 7) {
        // 分別對每個 <td> 進行更新
        const [numberTd, nameTd, specTd, quantityTd, priceTd, totalTd, btnTd] = cells;

        // 更新 data-label 不變，但 name 屬性需重編索引
        numberTd.querySelector('input').name = `items[${index}][number]`;
        nameTd.querySelector('input').name = `items[${index}][name]`;
        specTd.querySelector('input').name = `items[${index}][spec]`;
        quantityTd.querySelector('input').name = `items[${index}][quantity]`;
        priceTd.querySelector('input').name = `items[${index}][price]`;
        totalTd.querySelector('input').name = `items[${index}][total]`;
      }
    });

    // 重新計算總金額
    calculateItemTotal();
  };

  // 初始化計算總金額
  calculateItemTotal();
});
