document.addEventListener('DOMContentLoaded', async () => {
    // --- SHARED CLOUD CONFIG (Mirrored from timeline.html) ---
    const APP_ID = "Ru4pzaooijH8G6ICWOJEirUj-MdYXbMMI";
    const APP_KEY = "KJF0dXD0lmOMn1PJDb3fMUN5";
    const SERVER_URL = "https://ru4pzaoo.api.lncldglobal.com";

    // Init LeanCloud
    if (typeof AV !== 'undefined') {
        AV.init({ appId: APP_ID, appKey: APP_KEY, serverURLs: SERVER_URL });
    }

    // --- COUNTDOWN LOGIC ---
    const timerElement = document.getElementById('countdown-timer');
    let deadline = null;

    async function getSharedDeadline() {
        try {
            if (typeof AV === 'undefined') throw new Error("SDK not loaded");

            const timerEl = document.getElementById('countdown-timer');
            if (timerEl) timerEl.innerText = "⏳ 正在同步云端...";

            const query = new AV.Query('TieYixiangGlobalSettings');
            query.equalTo('settingVersion', 3); // Force fresh sync for Beijing Time fix
            const results = await query.find();

            if (results.length > 0) {
                const settings = results[0];
                const savedStart = settings.get('campaignStartTime');
                if (timerEl) {
                    // Flash success briefly or just start
                    const dateStr = savedStart.toLocaleDateString();
                    console.log(`Synced to: ${dateStr}`);
                }
                return new Date(savedStart.getTime() + (20 * 24 * 60 * 60 * 1000));
            } else {
                console.log("Initializing Global Deadline (Beijing Time v3)...");
                const SettingsClass = AV.Object.extend('TieYixiangGlobalSettings');
                const settings = new SettingsClass();

                // Calculate Beijing Midnight (UTC+8) strictly
                const now = new Date();
                const nowUTC = now.getTime() + (now.getTimezoneOffset() * 60000); // Current global UTC
                const beijingTime = nowUTC + (8 * 60 * 60 * 1000); // Shift to Beijing frame
                const beijingMidnight = beijingTime - (beijingTime % (24 * 60 * 60 * 1000)); // Floor to start of day
                const globalMidnight = beijingMidnight - (8 * 60 * 60 * 1000); // Shift back to UTC

                const startObj = new Date(globalMidnight);

                settings.set('campaignStartTime', startObj);
                settings.set('settingVersion', 3); // Version Tag

                // Essential Permissions
                const acl = new AV.ACL();
                acl.setPublicReadAccess(true);
                acl.setPublicWriteAccess(true);
                settings.setACL(acl);

                await settings.save();
                return new Date(startObj.getTime() + (20 * 24 * 60 * 60 * 1000));
            }
        } catch (e) {
            console.error("Countdown Sync Error", e);
            const timerEl = document.getElementById('countdown-timer');
            if (timerEl) {
                timerEl.innerHTML = `<span style="font-size:14px; color:red;">云同步失败: ${e.message || "Network"}</span>`;
                // Wait 3s then fallback
                await new Promise(r => setTimeout(r, 3000));
            }

            // Fallback: Attempt local Beijing Midnight calculation
            const now = new Date();
            const nowUTC = now.getTime() + (now.getTimezoneOffset() * 60000);
            const beijingTime = nowUTC + (8 * 60 * 60 * 1000);
            const beijingMidnight = beijingTime - (beijingTime % (24 * 60 * 60 * 1000));
            const globalMidnight = beijingMidnight - (8 * 60 * 60 * 1000);

            return new Date(globalMidnight + (20 * 24 * 60 * 60 * 1000));
        }
    }

    if (timerElement) {
        timerElement.innerText = "⏳ 同步中...";
        deadline = await getSharedDeadline();

        function updateTimer() {
            if (!deadline) return;
            const now = new Date();
            const diff = deadline - now;

            if (diff <= 0) {
                timerElement.textContent = "行动结束";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Style: Large Days, smaller time
            timerElement.innerHTML = `<span style="font-size: 1.2em; color: var(--system-red);">${days}天</span> ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            requestAnimationFrame(updateTimer);
        }
        updateTimer();
    }

    // 2. Clock Logic (Hub)
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        setInterval(() => {
            const now = new Date();
            clockElement.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }
});

// 3. Todo Logic (Exported function to be called in timeline.html)
function initTodo() {
    const list = document.getElementById('todo-list');
    const input = document.getElementById('new-task-input');
    const btn = document.getElementById('add-task-btn');

    // Default Tasks from Strategy
    const defaultTasks = [
        { text: "购买羊肉专用新碗 (明天上午)", done: false, deadline: "Day 1" },
        { text: "认证小红书/抖音企业号 (明天全天)", done: false, deadline: "Day 1" },
        { text: "燕回 & 厨师 喊堂口号培训", done: false, deadline: "Day 2" },
        { text: "联系首批8-10位探店达人", done: false, deadline: "Day 3" },
        { text: "拍摄'15年老店'宣传素材", done: false, deadline: "Day 4" }
    ];

    // Load from local storage or defaults
    let tasks = JSON.parse(localStorage.getItem('tieyixiang_tasks')) || defaultTasks;

    function render() {
        list.innerHTML = '';
        tasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = `todo-item ${task.done ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="todo-checkbox" onclick="toggleTask(${index})"></div>
                <div class="todo-text">
                    <div>${task.text}</div>
                    <div style="font-size:10px; color: #FFD60A; margin-top:2px;">截止: ${task.deadline}</div>
                </div>
                <div style="margin-left:auto; opacity:0.3; cursor:pointer;" onclick="deleteTask(${index})">✕</div>
            `;
            list.appendChild(item);
        });
        localStorage.setItem('tieyixiang_tasks', JSON.stringify(tasks));
    }

    window.toggleTask = (index) => {
        tasks[index].done = !tasks[index].done;
        render();
    };

    window.deleteTask = (index) => {
        tasks.splice(index, 1);
        render();
    };

    function addTask() {
        const val = input.value.trim();
        if (val) {
            tasks.unshift({ text: val, done: false, deadline: "自定" });
            input.value = '';
            render();
        }
    }

    btn.addEventListener('click', addTask);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    render();
}
// 4. Accordion Logic (Operations Page & Manual Page)
document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.glass-sheet h2');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sheet = header.parentElement;
            sheet.classList.toggle('collapsed');
        });
    });
});
