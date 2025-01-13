let priceElement;

function createPriceElement() {
    priceElement = document.createElement('div');
    priceElement.style.position = 'fixed';
    priceElement.style.bottom = '20px';
    priceElement.style.right = '20px';
    priceElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    priceElement.style.borderRadius = '5px';
    priceElement.style.zIndex = '9999';
    priceElement.style.display = 'flex';
    priceElement.style.alignItems = 'center';
    priceElement.style.justifyContent = 'center';
    priceElement.style.padding = '10px';
    priceElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
    priceElement.style.transition = 'transform 0.3s, opacity 0.3s';
    priceElement.style.transform = 'translateX(0)';
    priceElement.style.color = 'white';
    priceElement.style.fontSize = '16px';
    priceElement.style.whiteSpace = 'nowrap'; // 不换行
    priceElement.style.cursor = 'pointer'; // 鼠标悬停时显示手型
    document.body.appendChild(priceElement);

    // 控制容器的显示和隐藏
    let timeout;
    priceElement.onmouseenter = function() {
        priceElement.style.transform = 'translateX(0)'; // 鼠标悬停时显示容器
        priceElement.style.opacity = '1'; // 设置透明度为100%
        clearTimeout(timeout); // 清除定时器
    };

    // 鼠标离开事件
    priceElement.onmouseleave = function() {
        timeout = setTimeout(() => {
            priceElement.style.transform = 'translateX(100%)'; // 隐藏容器，只显示5%
            priceElement.style.opacity = '0.3'; // 设置透明度为30%
        }, 3000); // 3秒后收缩
    };

    // 初始化容器透明度
    priceElement.style.opacity = '0.3'; // 初始透明度为30%
    priceElement.style.transform = 'translateX(100%)'; // 初始隐藏状态
}

function updatePrice(currency, price) {
    if (!priceElement) {
        createPriceElement();
    }
    priceElement.textContent = `${currency.slice(0, 3).toUpperCase()}: $${price}`;
}

// 监听来自后台的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updatePrice') {
        updatePrice(request.currency, request.price);
    }
});

updatePrice('bitcoin', '...');

// 显示当前标签页的 ID
console.log(`Current tab ID: ${window.location.href}`); 