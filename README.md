# 构建产物（自动发布）

这个仓库只放打包好的文件，供酒馆助手（Tavern Helper）脚本直接 import。
源码不在仓库里，请回主仓库修改。

最新版本：`v20261031-1415`（见 [`latest.json`](./latest.json)）

## 用法一：固定版本（不会自动更新）

### dist/CrazyME/手机PhoNE/index.js

```js
import 'https://testingcf.jsdelivr.net/gh/MIchelia344/SillyTavern_Product@v20261031-1415/dist/CrazyME/手机PhoNE/index.js'
```

## 用法二：自动更新加载器（推荐，贴一次以后不用改）

下面是本版生成的加载器全文，粘进酒馆助手脚本库即可；
它每次刷新先读 `latest.json` 拿到最新 tag，再 import 那个不可变地址，
所以既不会吃到旧缓存，也不用在更新时改脚本。

### dist/CrazyME/手机PhoNE/index.js

```js
// ==== 手机PhoNE 自动更新加载器（整段贴进酒馆助手脚本库，以后不用再改）====
const REPO = 'MIchelia344/SillyTavern_Product';
const CDN = 'https://testingcf.jsdelivr.net/gh/' + REPO;
const FILE = 'dist/CrazyME/手机PhoNE/index.js';
const FALLBACK = 'v20261031-1415';

async function newestTag() {
  try {
    const res = await fetch(`${CDN}@main/latest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const info = await res.json();
      if (info && info.version) return info.version;
    }
  } catch (error) {
    console.warn('[手机PhoNE] 取版本清单失败，试 GitHub API', error);
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/tags`, { cache: 'no-store' });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list[0] && list[0].name) return list[0].name;
    }
  } catch (error) {
    console.warn('[手机PhoNE] 取 tag 列表失败，用内置版本', error);
  }
  return FALLBACK;
}

const tag = await newestTag();
console.info('[手机PhoNE] 加载版本', tag);
try {
  await import(`${CDN}@${tag}/${FILE}`);
} catch (error) {
  console.warn('[手机PhoNE] 该版本加载失败，退回内置版本', error);
  await import(`${CDN}@${FALLBACK}/${FILE}`);
}
```

## 缓存说明（实测）

- `@main`：`max-age=604800`（浏览器 7 天）、`s-maxage=43200`（CDN 12 小时）
- `@<tag>`：`max-age=31536000, immutable`（一年，且永不变）

所以「自动更新」不能靠 `@main`，要靠「每次取到新 tag 再 import」。
