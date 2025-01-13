let minPrice; // 用于存储最小价格
let maxPrice; // 用于存储最大价格
let webhookUrl; // 用于存储Webhook URL  
let webhookTmpl; // 用于存储Webhook模板
let currency; // 用于存储货币
let enableWebhook; // 用于存储是否启用Webhook
let lastPrice; // 用于存储上一个价格

// 初始化设置
function initializeSettings() {
    chrome.storage.local.get(['currency', 'updateInterval', 'minPrice', 'maxPrice', 'webhook', 'webhookTmpl', 'enableWebhook'], (data) => {
        // 设置定时器
        setMinPrice(data.minPrice || 0); // 默认0
        setMaxPrice(data.maxPrice || 100000); // 默认100000
        setEnableWebhook(data.enableWebhook || false); // 默认未启用
        setWebhook(data.webhook || ''); // 默认空
        setWebhookTmpl(data.webhookTmpl || ''); // 默认空
        setCurrency(data.currency || 'bitcoin'); // 默认比特币
        setFetchInterval(data.updateInterval || 60); // 默认60秒
        if (data.currency) {
            console.log(`Initializing with currency: ${data.currency}`);
            fetchCryptoPrice(data.currency); // 初始获取价格
        }
    });
}

// 设置货币
function setCurrency(c) {
    currency = c;
    console.log(`Currency set to: ${currency}`);
}

// 设置最小价格
function setMinPrice(price) {
    minPrice = price;
    console.log(`Min price set to: $${price}`);
}

// 设置最大价格
function setMaxPrice(price) {
    maxPrice = price;
    console.log(`Max price set to: $${price}`);
}

// 设置是否启用Webhook
function setEnableWebhook(enable) {
    enableWebhook = enable;
    console.log(`Enable webhook set to: ${enable}`);
}

// 设置Webhook URL
function setWebhook(url) {
    webhookUrl = url;
    console.log(`Webhook URL set to: ${url}`);
}   

// 设置Webhook模板
function setWebhookTmpl(tmpl) {
    webhookTmpl = tmpl;
    console.log(`Webhook template set to: ${tmpl}`);
}

// 设置定时器
function setFetchInterval(interval) {
    // 清除之前的定时器
    chrome.alarms.clear('fetchPrice', () => {
        console.log('Previous alarm cleared.');
    });

    // 使用 chrome.alarms 创建定时器
    chrome.alarms.create('fetchPrice', { periodInMinutes: interval / 60 }); // 转换为分钟
    console.log(`Alarm set to fetch price every ${interval} seconds.`);
}

// 发送价格到Webhook的函数
async function sendToWebhook(price) {
    if (!enableWebhook) {
        console.log('Webhook is not enabled. Skipping webhook notification.');
        return;
    }

    if (!webhookUrl || webhookUrl === '') {
        console.warn("Webhook URL is not configured. Skipping webhook notification.");
        return; // 如果没有配置Webhook URL，则不发送
    }

    if (!webhookTmpl || webhookTmpl.trim() === '') {
        console.log('No webhook template configured. Skipping webhook notification.');
        return;
    }

    const payload = webhookTmpl
        .replace('#COIN#', `${currency.slice(0, 3).toUpperCase()}`)
        .replace('#PRICE#', price)
        .replace('#TIMESTAMP#', new Date().toISOString());
    console.log(`Sending webhook with payload: ${payload}`);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if (response.ok) {
            console.log(`Price sent to webhook successfully: $${price}`);
        } else {
            console.error(`Failed to send price to webhook. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending price to webhook:', error);
    }
}

// 获取价格并推送到内容脚本
async function fetchCryptoPrice(currency) {
    const CRYPTO_API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`;
    console.log(`Fetching price for currency: ${currency}`);
    try {
        const response = await fetch(CRYPTO_API_URL);
        const data = await response.json();
        const price = data[currency]?.usd;

        if (price) {
            console.log(`Fetched price for ${currency}: $${price}`);
            // 推送价格到webhook
            if (lastPrice === undefined || Math.abs(price - lastPrice) > 1) { // 检查价格变化是否超过1
                lastPrice = price; // 更新上一个价格
                await sendToWebhook(price);
                console.log(`${currency.charAt(0).toUpperCase() + currency.slice(1)} Price: $${price} sent to webhook.`);
            } else {
                console.log(`${currency.charAt(0).toUpperCase() + currency.slice(1)} Price: $${price} is within the range, not sending webhook.`);
            }
            // 发送价格到所有标签页
            chrome.tabs.query({}, (tabs) => { // 查询所有标签
                tabs.forEach(tab => {
                    if (tab.id) {
                        console.log(`Sending price to tab ID: ${tab.id}`); // 打印每个标签页的 ID
                        chrome.tabs.sendMessage(tab.id, { action: 'updatePrice', currency, price });
                        console.log(`Price sent to content script: ${currency} - $${price} in tab ID: ${tab.id}`);
                    }
                });
            });
        } else {
            console.warn(`Price not available for currency: ${currency}`);
        }
    } catch (error) {
        console.error('Error fetching crypto price:', error);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed!');
    initializeSettings(); // 初始化设置

    // 监听价格更新
    chrome.alarms.onAlarm.addListener((alarm) => {
        console.log('Alarm triggered:', alarm.name);
        if (alarm.name === 'fetchPrice') {
            chrome.storage.local.get(['currency'], (data) => {
                console.log('Fetched currency from storage:', data.currency);
                if (data.currency) {
                    fetchCryptoPrice(data.currency);
                } else {
                    console.warn('No currency found in storage.');
                }
            });
        }
    });

    // 监听配置变化
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.updateInterval) {
            console.log('Update interval changed:', changes.updateInterval.newValue);
            setFetchInterval(changes.updateInterval.newValue); // 更新定时器
        }
        if (area === 'local' && changes.minPrice) {
            console.log('Min price changed:', changes.minPrice.newValue);
            setMinPrice(changes.minPrice.newValue); // 更新最小价格
        }
        if (area === 'local' && changes.maxPrice) {
            console.log('Max price changed:', changes.maxPrice.newValue);
            setMaxPrice(changes.maxPrice.newValue); // 更新最大价格
        }
        if (area === 'local' && changes.webhook) {
            console.log('Webhook changed:', changes.webhook.newValue);
            setWebhook(changes.webhook.newValue); // 更新Webhook URL
        }
        if (area === 'local' && changes.webhookTmpl) {
            console.log('Webhook template changed:', changes.webhookTmpl.newValue);
            setWebhookTmpl(changes.webhookTmpl.newValue); // 更新Webhook模板
        }
        if (area === 'local' && changes.currency) {
            console.log('Currency changed:', changes.currency.newValue);
            setCurrency(changes.currency.newValue); // 更新货币
        }
    });
});

