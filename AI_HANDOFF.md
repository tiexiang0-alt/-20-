# AI 任务交接脚本 (AI Handoff Protocol)

**用途**：当你在新的对话中要求 AI 修改或重写本项目时，请**第一时间**把这份文档发给它。它包含了我们经过多次调试才跑通的“黄金代码逻辑”。

---

## 给 AI 的指令 (Prompt)

"你好！我正在维护一个基于 **Vanilla JS + LeanCloud (国内版)** 的单页应用。
为了避免配置错误，请严格遵守以下**3条铁律**，不要随意修改核心配置逻辑："

### 1. 核心配置 (Configuration)

**必须使用以下完全一致的配置信息，不要更改 AppKey 或 URL：**

```javascript
const DEFAULT_CONFIG = {
    appId: "Ru4pzaooijH8G6ICWOJEirUj-MdYXbMMI",
    appKey: "KJF0dXD0lmOMn1PJDb3fMUN5", // 注意大小写：KJF0...
    serverURLs: "https://ru4pzaoo.api.lncldglobal.com" // 注意是 serverURLs (复数)
};

// 必须包含这个“强制纠错”逻辑，防止用户浏览器缓存了错误的旧 Key
function getCloudConfig() {
    let config = DEFAULT_CONFIG;
    const saved = localStorage.getItem('tie_cloud_config');
    if (saved) {
        try {
            config = JSON.parse(saved);
            // 校验：如果 URL 不对，或者 Key 不匹配，强制重置为默认值
            const currentUrl = config.serverURLs || config.serverURL;
            const isKeyMatch = (config.appKey === DEFAULT_CONFIG.appKey);
            if (!currentUrl || !currentUrl.includes('ru4pzaoo') || !isKeyMatch) {
                console.log("Cached config invalid, resetting...");
                config = DEFAULT_CONFIG;
                localStorage.setItem('tie_cloud_config', JSON.stringify(DEFAULT_CONFIG));
            }
        } catch (e) { config = DEFAULT_CONFIG; }
        return config;
    }
    localStorage.setItem('tie_cloud_config', JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
}
```

### 2. 自动初始化 (Auto-Initialization)

**必须处理“Error 101”错误。当数据库为空时，必须自动建库，而不是报错：**

```javascript
// 在 fetchCloud 的 catch 块中必须包含：
if (error.code === 101) {
    console.log("Class missing (101), initializing...");
    await initNewData(statusEl); // 调用自动初始化函数
    return;
}

// 自动初始化函数参考：
async function initNewData(statusEl) {
    const ClassInfo = AV.Object.extend('TieYixiangChecklistPublic');
    dbObject = new ClassInfo();
    dbObject.set('syncId', SYNC_ID);
    dbObject.set('taskList', DEFAULT_TASKS);
    
    // 关键：开启 Public 读写权限
    const acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    acl.setPublicWriteAccess(true);
    dbObject.setACL(acl);
    
    await dbObject.save();
    // ...更新UI...
}
```

### 3. 环境要求

* **Web 安全域名**：LeanCloud 后台已配置 `https://tiexiang0-alt.github.io`。不要随意换域名，否则报 401。
* **SDK 版本**：使用 `<script src="//code.bdstatic.com/npm/leancloud-storage@4.12.0/dist/av-min.js"></script>`。

---

**请只修改 UI 或业务逻辑，严禁动以上 3 部分的数据库连接代码！**
