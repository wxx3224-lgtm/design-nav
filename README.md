# DesignKit — 设计师效率工具箱

极简设计师导航网站。常用网站收录、尺寸规范速查、快捷复制，一站式效率工具箱。

## 本地预览

```bash
cd ~/projects/design-nav
python3 -m http.server 5190
# 打开 http://localhost:5190
```

## 部署上线（免费）

### 方式一：Vercel（推荐，最简单）

1. 把项目推到 GitHub：
```bash
cd ~/projects/design-nav
gh repo create design-nav --public --source=. --push
```

2. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录

3. 点击 "Import Project" → 选择 `design-nav` 仓库 → 点 "Deploy"

4. 部署完成后会给你一个域名（如 `design-nav-xxx.vercel.app`），直接访问就是你的网站

5. 如果想用自定义域名（如 `nav.yourdomain.com`），在 Vercel 项目设置 → Domains 里添加

### 方式二：GitHub Pages

1. 推到 GitHub（同上）

2. 进入仓库 Settings → Pages → Source 选 `main` 分支 → Save

3. 等 1-2 分钟，网站就在 `https://你的用户名.github.io/design-nav/`

## 更新内容

改完 `data.json` 后，一键推送到线上：

```bash
cd ~/projects/design-nav
git add data.json
git commit -m "更新链接数据"
git push
```

Vercel / GitHub Pages 会自动检测到 push 并重新部署，通常 30 秒内生效。

## 文件结构

```
design-nav/
├── index.html      ← 页面骨架
├── style.css       ← 视觉样式
├── app.js          ← 渲染逻辑 + 编辑功能
├── data.json       ← 所有内容数据（改这个文件更新内容）
├── schemes/        ← 早期方案对比（可删除）
└── README.md       ← 本文件
```

## 编辑模式

点击页面右上角铅笔图标进入编辑模式：
- 添加/编辑/删除链接卡片
- 重命名/删除分类
- 添加/编辑/删除尺寸规范和快捷复制条目
- 导出最新 data.json（物理备份）
- 重置为默认数据

所有修改存在浏览器 localStorage 中。如果想永久保存到代码里：
1. 编辑模式下点"💾 导出配置"
2. 用下载的文件替换项目里的 `data.json`
3. `git push` 推送到线上
