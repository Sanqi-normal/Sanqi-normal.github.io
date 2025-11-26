// Canvas 背景动画
function initCyberBackground() {
    const canvas = document.getElementById('sun-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // 鼠标位置跟踪
    let mouseX = 0;
    let mouseY = 0;
    let normalizedMouseX = 0;
    let normalizedMouseY = 0;
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();

    // 监听鼠标移动
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        normalizedMouseX = (mouseX / width - 0.5) * 2; // -1 到 1
        normalizedMouseY = (mouseY / height - 0.5) * 2; // -1 到 1
    });

    // 星星数据 - 添加原始位置和深度属性
    const stars = Array.from({ length: 150 }, () => {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.6;
        return {
            x: x,
            y: y,
            originalX: x, // 保存原始位置
            originalY: y,
            size: Math.random() * 2 + 0.5,
            blinkSpeed: Math.random() * 0.05,
            depth: Math.random() * 0.8 + 0.2, // 深度值 0.2-1.0，用于视差效果
            blinkOffset: Math.random() * Math.PI * 2 // 闪烁偏移
        };
    });

    let gridOffset = 0;
    const gridSpeed = 0.5;
    let time = 0;

    function draw() {
        time += 0.01;
        
        // 背景填充
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#050510');
        bgGradient.addColorStop(1, '#1a0b1a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制星星（带视差效果）
        stars.forEach(star => {
            // 计算视差偏移 - 深度越大偏移越大
            const parallaxX = normalizedMouseX * 20 * star.depth;
            const parallaxY = normalizedMouseY * 20 * star.depth;
            
            // 应用视差效果到原始位置
            const currentX = star.originalX + parallaxX;
            const currentY = star.originalY + parallaxY;
            
            // 闪烁效果
            const blink = Math.sin(time * star.blinkSpeed + star.blinkOffset) * 0.3 + 0.7;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
            ctx.globalAlpha = blink;
            
            ctx.beginPath();
            ctx.arc(currentX, currentY, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // 绘制复古太阳
        const centerX = width / 2;
        const horizonY = height * 0.6;
        const sunRadius = Math.min(width, height) * 0.15;

        const sunGrad = ctx.createLinearGradient(centerX, horizonY - sunRadius*2, centerX, horizonY);
        sunGrad.addColorStop(0, '#ffff00');
        sunGrad.addColorStop(0.5, '#ff00ff');
        sunGrad.addColorStop(1, '#9900ff');

        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(centerX, horizonY - 40, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 太阳切割线
        for (let i = 0; i < 10; i++) {
            const y = horizonY - 40 + (i * 10) - 20;
            if (y > horizonY - 40 - sunRadius) {
                const heightCut = i * 1.5;
                ctx.fillStyle = bgGradient;
                ctx.fillRect(centerX - sunRadius, y, sunRadius * 2, heightCut);
            }
        }

        // 绘制右侧竖行汉字
        ctx.save();
        ctx.translate(width - 60, height / 2 - 100);
        
        ctx.font = '50px "FZShuTi", "STHupo", cursive';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.textAlign = 'center';
        
        const text = '浮生一梦 何以解忧';
        const chars = text.split('');
        const lineHeight = 50;
        
        chars.forEach((char, index) => {
            // 为每个字符添加轻微的上下波动
            const waveOffset = Math.sin(time * 2 + index * 0.5) * 2;
            ctx.fillText(char, 0, index * lineHeight + waveOffset);
        });
        
        ctx.restore();

        // 绘制 3D 透视网格
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
        ctx.lineWidth = 1;

        // 垂直线
        ctx.save();
        ctx.beginPath();
        for(let i = -width; i < width * 2; i += 80) {
             ctx.moveTo(centerX, horizonY);
             let factor = (i - centerX) * 3;
             ctx.lineTo(centerX + factor, height);
        }
        ctx.stroke();

        // 水平移动线
        gridOffset = (gridOffset + gridSpeed) % 40;
        
        for (let i = 0; i < 20; i++) {
            let p = (gridOffset + i * 40);
            let y = horizonY + (p * p) / 800; 
            
            if (y > height) continue;

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();

        // 地平线光晕
        const glowGrad = ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 20);
        glowGrad.addColorStop(0, 'rgba(0,255,255,0)');
        glowGrad.addColorStop(0.5, 'rgba(0,255,255,0.8)');
        glowGrad.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, horizonY - 2, width, 4);

        requestAnimationFrame(draw);
    }

    draw();
}


// 故障效果系统
function initGlitchEffects() {
    let isGlitchActive = false;
    
    // 随机故障效果 (1-3分钟随机触发)
    function triggerRandomGlitch() {
 if (isGlitchActive) return;
        
        isGlitchActive = true;
        
        // 随机选择故障颜色
        const colors = ['#ff00ff', '#00ffff', '#ccff00'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 设置故障颜色变量
        document.documentElement.style.setProperty('--color-magenta', randomColor);
        
        document.body.classList.add('vhs-glitch-effect');
        
        // 随机故障持续时间 300-800ms
        const duration = Math.random() * 500 + 300;
        
        setTimeout(() => {
            document.body.classList.remove('vhs-glitch-effect');
            isGlitchActive = false;
            
            // 恢复默认颜色
            document.documentElement.style.setProperty('--color-magenta', '#ff00ff');
            
            // 设置下一次随机故障
            const nextGlitch = Math.random() * 120000 + 160000; // 1-3分钟
            setTimeout(triggerRandomGlitch, nextGlitch);
        }, duration);
    }
    
    function setupButtonGlitch() {
        const buttons = document.querySelectorAll('button, a, .category-btn, .nav-btn, .tape-button');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                if (isGlitchActive) return;
                
                isGlitchActive = true;
                
                // 随机选择点击故障颜色
                const colors = ['#ff00ff', '#00ffff'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                document.documentElement.style.setProperty('--color-magenta', randomColor);
                
                document.body.classList.add('vhs-glitch-effect');
                
                // 较短的点击故障持续时间
                setTimeout(() => {
                    document.body.classList.remove('vhs-glitch-effect');
                    document.documentElement.style.setProperty('--color-magenta', '#ff00ff');
                    isGlitchActive = false;
                }, 200);
            });
        });
    }
    
    // 文字故障效果
    function setupTextGlitch() {
        // 为标题添加故障效果
        const titles = document.querySelectorAll('h1, h2, h3, .article-title, .post-title');
        
        titles.forEach(title => {
            if (!title.classList.contains('glitch')) {
                title.classList.add('glitch');
                title.setAttribute('data-text', title.textContent);
            }
        });
    }

    
    // 初始化所有故障效果
    setupButtonGlitch();
    setupTextGlitch();

    
    // 延迟启动随机故障效果，让页面先加载完成
    setTimeout(() => {
        const firstGlitch = Math.random() * 30000 + 10000; // 10-40秒后第一次故障
        setTimeout(triggerRandomGlitch, firstGlitch);
    }, 2000);
}



// 单独触发故障效果
function triggerSingleGlitch() {
    if (document.body.classList.contains('vhs-glitch-effect')) return;
    
    const colors = ['#ff00ff', '#00ffff', '#ccff00'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.documentElement.style.setProperty('--color-magenta', randomColor);
    
    document.body.classList.add('vhs-glitch-effect');
    setTimeout(() => {
        document.body.classList.remove('vhs-glitch-effect');
        document.documentElement.style.setProperty('--color-magenta', '#ff00ff');
    }, 300);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initCyberBackground();
    initGlitchEffects();
    console.log("效果已加载");
});

// 防抖重置函数
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // 可以在这里添加窗口大小改变时的适配逻辑
    }, 250);
});