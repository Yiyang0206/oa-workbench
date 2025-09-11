// 全局状态管理
const state = {
    allData: [],
    filteredData: [],
    currentCategory: 'all',
    searchQuery: '',
    isDarkMode: false
};

// 初始化页面
function init() {
    // 页面加载完成后加载数据
    window.onload = loadFlowData;
    
    // 重试按钮点击事件
    document.getElementById('retryBtn').addEventListener('click', loadFlowData);
    
    // 搜索框事件
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // 主题切换事件
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

// 加载并渲染流程数据
function loadFlowData() {
    // 显示加载中，隐藏其他状态
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('flowContainer').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');

    // 读取weaver-flows.json数据
    fetch('weaver-flows.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP错误：${response.status}`);
            return response.json();
        })
        .then(data => {
            // 保存原始数据
            state.allData = data;
            state.filteredData = data;
            
            // 生成分类标签
            generateCategoryTags(data);
            
            // 渲染流程数据
            renderFlows(data);

            // 数据渲染完成：显示内容，隐藏加载中
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('flowContainer').classList.remove('hidden');
        })
        .catch(error => {
            console.error('加载失败原因：', error);
            // 显示错误状态，隐藏加载中
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error').classList.remove('hidden');
        });
}

// 生成分类标签
function generateCategoryTags(data) {
    const categoryContainer = document.querySelector('#categoryFilter .flex');
    const existingCategories = new Set(['all']); // 避免重复分类
    
    // 清除现有动态生成的标签（保留"全部"）
    Array.from(categoryContainer.children).forEach(child => {
        if (child.dataset.category !== 'all') {
            child.remove();
        }
    });
    
    // 添加新的分类标签
    data.forEach(category => {
        if (!existingCategories.has(category.categoryName)) {
            existingCategories.add(category.categoryName);
            
            const button = document.createElement('button');
            button.className = 'category-btn px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition whitespace-nowrap theme-transition';
            button.dataset.category = category.categoryName;
            button.textContent = category.categoryName;
            
            // 添加点击事件
            button.addEventListener('click', () => handleCategoryChange(category.categoryName));
            
            categoryContainer.appendChild(button);
        }
    });
}

// 处理分类切换
function handleCategoryChange(category) {
    // 更新当前分类状态
    state.currentCategory = category;
    
    // 更新按钮样式
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('bg-gray-100', 'hover:bg-gray-200');
            btn.classList.add('bg-primary', 'text-white');
        } else {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-gray-100', 'hover:bg-gray-200');
        }
    });
    
    // 应用筛选
    applyFilters();
}

// 处理搜索
function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase().trim();
    applyFilters();
}

// 应用筛选条件（分类+搜索）
function applyFilters() {
    let result = [...state.allData];
    
    if (state.currentCategory !== 'all') {
        result = result.filter(category => category.categoryName === state.currentCategory);
    } else {
        // 如果是"全部"分类，不进行分类筛选
        result = [...state.allData];
    }
    
    // 应用分类筛选
    if (state.currentCategory !== 'all') {
        result = result.filter(category => category.categoryName === state.currentCategory);
    }
    
    // 应用搜索筛选
    if (state.searchQuery) {
        result = result.map(category => ({
            ...category,
            flows: category.flows.filter(flow => 
                flow.name.toLowerCase().includes(state.searchQuery)
            )
        })).filter(category => category.flows.length > 0);
    }
    
    // 更新状态
    state.filteredData = result;
    
    // 渲染结果
    if (result.length === 0 || (result.length > 0 && result.every(cat => cat.flows.length === 0))) {
        document.getElementById('flowContainer').classList.add('hidden');
        document.getElementById('noResults').classList.remove('hidden');
    } else {
        document.getElementById('noResults').classList.add('hidden');
        document.getElementById('flowContainer').classList.remove('hidden');
        renderFlows(result);
    }
}

// 渲染流程卡片
function renderFlows(data) {
    const container = document.getElementById('flowContainer');
    container.innerHTML = ''; // 清空容器

    // 遍历每个流程分类
    data.forEach((category, categoryIndex) => {
        // 跳过无流程的分类
        if (category.flows.length === 0) return;

        // 1. 创建分类标题栏
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'flex items-center mb-4 mt-8 first:mt-0 fade-in';
        categoryTitle.style.animationDelay = `${categoryIndex * 0.1}s`; // 分类依次出现动画
        categoryTitle.innerHTML = `
            <div class="w-1 h-6 bg-primary rounded-full mr-3"></div>
            <h2 class="text-xl font-semibold text-category theme-transition">${category.categoryName}</h2>
        `;
        container.appendChild(categoryTitle);

        // 2. 创建流程卡片容器（响应式网格）
        const cardContainer = document.createElement('div');
        cardContainer.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6';
        container.appendChild(cardContainer);

        // 3. 遍历分类下的流程，创建卡片
        category.flows.forEach((flow, flowIndex) => {
            const card = document.createElement('a');
            card.href = flow.url; // 跳转链接
            card.target = '_self'; // 在当前窗口打开（适配企业微信）
            card.className = 'bg-white rounded-xl shadow-sm p-4 card-hover fade-in theme-transition';
            // 卡片依次出现动画（延迟递增，更自然）
            card.style.animationDelay = `${categoryIndex * 0.1 + flowIndex * 0.05}s`;
            
            // 为不同类型流程匹配不同图标（提升辨识度）
            let flowIcon = 'fa-file-text-o'; // 默认图标
            const flowName = flow.name.toLowerCase();
            if (flowName.includes('请假')) flowIcon = 'fa-calendar-check-o';
            else if (flowName.includes('采购')) flowIcon = 'fa-shopping-cart';
            else if (flowName.includes('用印')) flowIcon = 'fa-stamp';
            else if (flowName.includes('报销')) flowIcon = 'fa-credit-card';
            else if (flowName.includes('出差')) flowIcon = 'fa-plane';
            else if (flowName.includes('会议')) flowIcon = 'fa-users';
            else if (flowName.includes('用车')) flowIcon = 'fa-car';
            else if (flowName.includes('人事')) flowIcon = 'fa-user';
            else if (flowName.includes('合同')) flowIcon = 'fa-file-text';

            // 卡片内容
            card.innerHTML = `
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl mb-3">
                        <i class="fa ${flowIcon}"></i>
                    </div>
                    <p class="text-cardText text-sm md:text-base line-clamp-2 theme-transition">${flow.name}</p>
                </div>
            `;
            cardContainer.appendChild(card);
        });
    });
}

// 切换主题模式
function toggleTheme() {
    const body = document.getElementById('appBody');
    const themeIcon = document.querySelector('#themeToggle i');
    const cards = document.querySelectorAll('.card-hover');
    const searchInput = document.getElementById('searchInput');
    
    // 切换主题状态
    state.isDarkMode = !state.isDarkMode;
    
    if (state.isDarkMode) {
        // 切换到深色模式
        body.classList.remove('bg-gray-50', 'text-gray-800');
        body.classList.add('bg-dark-bg', 'text-dark-text');
        
        cards.forEach(card => {
            card.classList.remove('bg-white');
            card.classList.add('bg-dark-card');
        });
        
        searchInput.classList.remove('border-gray-200');
        searchInput.classList.add('border-gray-700', 'bg-dark-card', 'text-dark-text');
        
        themeIcon.classList.remove('fa-moon-o', 'text-gray-600');
        themeIcon.classList.add('fa-sun-o', 'text-yellow-400');
    } else {
        // 切换到浅色模式
        body.classList.remove('bg-dark-bg', 'text-dark-text');
        body.classList.add('bg-gray-50', 'text-gray-800');
        
        cards.forEach(card => {
            card.classList.remove('bg-dark-card');
            card.classList.add('bg-white');
        });
        
        searchInput.classList.remove('border-gray-700', 'bg-dark-card', 'text-dark-text');
        searchInput.classList.add('border-gray-200');
        
        themeIcon.classList.remove('fa-sun-o', 'text-yellow-400');
        themeIcon.classList.add('fa-moon-o', 'text-gray-600');
    }
}

// 初始化应用
init();
    