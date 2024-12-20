document.addEventListener('DOMContentLoaded', function () {
    const modelSelect = document.getElementById('modelSelect');
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    let lastAIMessageDiv; // 用于存储最后一条 AI 回复的 div
    let messageHistory = []; // 存储聊天记录
   // 获取可用模型
    function fetchModels() {
        const apiUrl = document.getElementById('apiUrl').value.trim();
        fetch(`${apiUrl}/api/tags`)
            .then(response => response.json())
            .then(data => {
                const models = data.models.map(model => model.name);
                modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
                modelSelect.value = models[0];
            })
            .catch(err => console.error('Error fetching models:', err));
    }
    userInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') { // 检测到回车键
            event.preventDefault(); // 防止默认的换行行为
            sendMessage(); // 调用发送消息的函数
        }
    });
    // 发送消息
    function sendMessage() {
        const apiUrl = document.getElementById('apiUrl').value.trim();
        const message = userInput.value.trim();
        if (!message) return;
        messageHistory.push({ role: 'user', content: "用户之前向你询问的消息"+message });
        appendMessageToChat(`用户: ${message}`); // 添加用户消息

        // 禁用输入框和按钮，显示加载信息
        userInput.disabled = true;
        sendBtn.disabled = true;
        userInput.placeholder = 'AI 正在回复中...'; // 在输入框中显示提示信息

        const requestData = {
            model: modelSelect.value,
            messages: [{ role: 'user', content: message }],
            stream: true
        };

        fetch(`${apiUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            const reader = response.body.getReader();
            const textDecoder = new TextDecoder("utf-8");

            let fullResponse = '';  // 用于存储完整的 AI 回复内容

            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        console.log("Stream finished.");
                        userInput.disabled = false; // 启用输入框
                        sendBtn.disabled = false; // 启用按钮
                        userInput.placeholder = ''; // 清除提示信息
                        return;
                    }
                    const chunk = textDecoder.decode(value, { stream: true });
                    const data = JSON.parse(chunk);
                    if (data.message) {
                        fullResponse += data.message.content; // 将内容逐字累加到 fullResponse
                        // 更新最后一条 AI 回复为最新内容
                        replaceLastAIMessage(`AI: ${fullResponse}`);
                    }
                    readStream();
                });
            }
            readStream();
        })
        .catch(error => {
            console.error("Error fetching chat stream:", error);
            userInput.disabled = false; // 出现错误时启用输入框
            sendBtn.disabled = false; // 出现错误时启用按钮
            userInput.placeholder = ''; // 清除提示信息
            appendMessageToChat('AI 回复失败，请重试。'); // 错误提示
        });

        userInput.value = ''; // 清空用户输入框
    }

    function appendMessageToChat(message) {
        const div = document.createElement('div');
        div.textContent = message;
        const isUser = message.startsWith('用户: ');
        div.className = isUser ? 'user-message' : 'ai-message'; 
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight; // 保持滚动到底部

        // 记录最后一条 AI 消息的 div
        if (message.startsWith('AI: ')) {
            lastAIMessageDiv = div;
        }else{
            messageHistory.push({ role: 'user', content: "ai之前对此的回复:"+div.textContent}); // 记录 AI 回复
            lastAIMessageDiv = null;
        }
        
    }

    function replaceLastAIMessage(message) {
        if (lastAIMessageDiv) {
            lastAIMessageDiv.textContent = message; // 替换最后一条 AI 回复
        } else {
            appendMessageToChat(message); // 没有 AI 回复时添加
        }
    }

    // 事件监听
    sendBtn.addEventListener('click', sendMessage);

    // 初始化加载模型
    fetchModels();
});
