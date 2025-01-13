document.addEventListener('DOMContentLoaded', () => {
    // 设置标题和标签文本
    document.getElementById('extensionName').innerText = chrome.i18n.getMessage("extensionName");
    document.getElementById('currencyLabel').textContent = chrome.i18n.getMessage("currencyLabel");
    document.getElementById('updateIntervalLabel').textContent = chrome.i18n.getMessage("updateIntervalLabel");
    document.getElementById('minPriceLabel').textContent = chrome.i18n.getMessage("minPriceLabel");
    document.getElementById('maxPriceLabel').textContent = chrome.i18n.getMessage("maxPriceLabel");
    document.getElementById('webhookLabel').textContent = chrome.i18n.getMessage("webhookLabel");
    document.getElementById('webhookTmplLabel').textContent = chrome.i18n.getMessage("webhookTmplLabel");
    document.getElementById('webhookTmpl').placeholder = chrome.i18n.getMessage("placeholderWebhookTmpl");
    document.getElementById('saveConfig').textContent = chrome.i18n.getMessage("saveButton");

    // 获取并显示已保存的配置
    chrome.storage.local.get(['currency', 'updateInterval', 'minPrice', 'maxPrice', 'webhook', 'webhookTmpl', 'enableWebhook'], (data) => {
        document.getElementById('currency').value = data.currency || 'bitcoin'; // 默认选择比特币
        document.getElementById('updateInterval').value = data.updateInterval || 60; // 默认60秒
        document.getElementById('minPrice').value = data.minPrice || 0; // 默认0
        document.getElementById('maxPrice').value = data.maxPrice || 100000; // 默认100000
        document.getElementById('webhook').value = data.webhook || ''; // 默认空
        document.getElementById('webhookTmpl').value = data.webhookTmpl || ''; // 默认空
        document.getElementById('enableWebhook').checked = data.enableWebhook || false; // 默认未选中
    });

    // 添加保存配置的事件监听器
    document.getElementById('saveConfig').addEventListener('click', () => {
        const currency = document.getElementById('currency').value;
        const updateInterval = parseInt(document.getElementById('updateInterval').value) || 60;
        const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice').value) || 100000;
        const webhook = document.getElementById('webhook').value;
        const webhookTmpl = document.getElementById('webhookTmpl').value;
        const enableWebhook = document.getElementById('enableWebhook').checked; // 获取复选框状态

        chrome.storage.local.set({ currency, updateInterval, minPrice, maxPrice, webhook, webhookTmpl, enableWebhook }, () => {
            // 显示成功消息
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = chrome.i18n.getMessage("saveSuccess");
            messageDiv.style.color = "green"; // 成功消息颜色
            setTimeout(() => {
                messageDiv.textContent = ""; // 3秒后清空消息
            }, 3000);
        });
    });
});
