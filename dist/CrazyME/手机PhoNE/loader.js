// ==== 手机PhoNE 自动更新加载器（整段贴进酒馆助手脚本库，以后不用再改）====
const REPO = 'MIchelia344/SillyTavern_Product';
const CDN = 'https://testingcf.jsdelivr.net/gh/' + REPO;
const FILE = 'dist/CrazyME/手机PhoNE/index.js';
const FALLBACK = 'v20261031-1418';

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
