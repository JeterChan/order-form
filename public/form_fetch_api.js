// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('orderForm');
  
  // 處理表單提交
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // 表單驗證
    if (!form.checkValidity()) {
      event.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    
    // 如果驗證通過，收集表單數據
    const formData = new FormData(form);
    
    // 將 FormData 轉換為 JSON 對象
    const jsonData = {};
    formData.forEach((value, key) => {
      // 處理陣列輸入 (items[0][name] 等)
      if (key.includes('[')) {
        const matches = key.match(/([a-z]+)\[(\d+)\]\[([a-z]+)\]/i);
        if (matches) {
          const [, arrayName, index, property] = matches;
          if (!jsonData[arrayName]) jsonData[arrayName] = [];
          if (!jsonData[arrayName][index]) jsonData[arrayName][index] = {};
          jsonData[arrayName][index][property] = value;
        }
      } else {
        jsonData[key] = value;
      }
    });
    
    // 確保商品項目是陣列
    if (jsonData.items) {
      jsonData.items = Object.values(jsonData.items);
    }
    
    // 發送請求
    fetch('/submit-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    })
    .then(response => {
      if (response.redirected) {
          window.location.href = response.url;      
      } else {
        throw new Error('未收到轉址');
      }
    })
    
    .catch(error => {
      // 處理錯誤
      alert('提交失敗：' + error.message);
      console.error('提交錯誤：', error);
    });
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
  window.addRow = function() {
    const tbody = document.getElementById('productTbody');
    const rowCount = tbody.children.length;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="text" class="form-control" name="items[${rowCount}][number]" required></td>
      <td><input type="text" class="form-control" name="items[${rowCount}][name]" required></td>
      <td><input type="text" class="form-control" name="items[${rowCount}][spec]"></td>
      <td><input type="number" class="form-control quantity" name="items[${rowCount}][quantity]" required></td>
      <td><input type="number" class="form-control price" name="items[${rowCount}][price]" required></td>
      <td><input type="number" class="form-control total" name="items[${rowCount}][total]" readonly></td>
      <td><button type="button" class="btn btn-danger btn-sm" onclick="removeRow(this)">刪除</button></td>
    `;
    
    tbody.appendChild(newRow);
  };
  
  // 删除商品行
  window.removeRow = function(button) {
    if (document.getElementById('productTbody').children.length > 1) {
      const row = button.closest('tr');
      row.remove();
      
      // 重新排序剩餘行的索引
      const rows = document.getElementById('productTbody').children;
      for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].querySelectorAll('input');
        inputs.forEach(input => {
          if (input.name && input.name.includes('[')) {
            input.name = input.name.replace(/\[\d+\]/, `[${i}]`);
          }
        });
      }
      
      // 重新計算總金額
      calculateItemTotal();
    } else {
      alert('至少需要一項商品！');
    }
  };
  
  // 初始化計算總金額
  calculateItemTotal();
});
