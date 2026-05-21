/*声明三个自定义js方法*/
/*不区分大小写的判断包含， 用于搜索文章标题过滤文章*/
jQuery.expr[':'].contains = function (a, i, m) {
    return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
};
/*区分大小写的判断包含， 用于搜索文章标题过滤文章*/
jQuery.expr[':'].containsSensitive = function (a, i, m) {
    return jQuery(a).text().indexOf(m[3]) >= 0;
};
/*区分大小写，用于搜索标签过滤文章*/
jQuery.expr[':'].contains_tag = function (a, i, m) {
    var tags = String(jQuery(a).data("tag")).split(",");
    return $.inArray(m[3], tags) !== -1;
};
/*区分大小写，用于搜索作者过滤文章*/
jQuery.expr[':'].contains_author = function (a, i, m) {
    var tags = String(jQuery(a).data("author")).split(",");
    return $.inArray(m[3], tags) !== -1;
};
var blog_path = $('.theme_blog_path').val();
blog_path= blog_path.lastIndexOf("/") === blog_path.length-1?blog_path.slice(0, blog_path.length-1):blog_path;

/*使用pjax加载页面，速度更快，交互更友好*/
var content = $(".pjax");
var container = $(".main-wrapper");
var $searchInput = $("#local-search-input");
var $outlineList = $('#outline-list');
var $localSearchResult = $("#local-search-result")
var isFullScreen = $(window).width() <= 1024
var shortcutKey = $('#theme_shortcut').val() !== 'false'
var pageshortcut = $('#page_shortcut').val() !== 'true'
$(document).pjax('.site_url,.nav-item a,.post-card,.hero-btn', '.pjax', {fragment: '.pjax', timeout: 8000});$(document).on({
    /*点击链接后触发的事件*/
    'pjax:click': function () {
        /*原有内容淡出*/
        content.removeClass('fadeIns').addClass('fadeOuts');
        /*请求进度条*/
        NProgress.start();
        updateTopProgress(0);

        // 1/10 概率触发赛博故障效果
        if (Math.random() < 0.1) {
            triggerCyberGlitch($('.pjax'));
        }
    },

    /*pjax开始请求页面时触发的事件*/
    'pjax:start': function () {
        content.css({'opacity': 0});
    },

    /*进度更新*/
    'pjax:send': function() {
        // 模拟进度更新，因为 pjax 没有真实的百分比回调，我们配合 NProgress 的节奏
        let prog = 0;
        const interval = setInterval(() => {
            prog += (Math.random() * 10);
            if (prog >= 90) {
                clearInterval(interval);
                updateTopProgress(90);
            } else {
                updateTopProgress(prog);
            }
        }, 200);
        $(document).one('pjax:end', () => clearInterval(interval));
    },

    /*pjax请求回来页面后触发的事件*/
    'pjax:end': function () {
        NProgress.done();
        updateTopProgress(100);
        setTimeout(() => updateTopProgress(-1), 500); // 隐藏
        container.scrollTop(0);
        afterPjax();
    }
});

function updateTopProgress(percent) {
    const $bar = $('#top-progress-bar');
    const $num = $('#top-progress-num');
    const $container = $('#top-progress-container');

    if (percent < 0) {
        $container.fadeOut(300);
        return;
    }

    $container.show();
    $bar.css('width', percent + '%');
    $num.text(Math.round(percent) + '%');
}
function afterPjax() {
    // 文章默认背景
    var path = window.location.pathname;
    var blog_path = $('.theme_blog_path').val() || '';
    if (blog_path === '' ? path === '/' : path === blog_path || path === blog_path + '/') {
        container.addClass('index');
    } else {
        container.removeClass('index');
    }

    // 导航栏高亮更新
    $('.nav-item').removeClass('active');
    $('.nav-item a').each(function() {
        var href = $(this).attr('href');
        // 处理各种路径匹配情况，确保高亮正确
        if (path === href || 
            path === href + 'index.html' || 
            (href !== '/' && href !== blog_path && path.indexOf(href) === 0)) {
            $(this).parent().addClass('active');
        }
    });

    // 搜索结果清空
    $localSearchResult.hide().html('');
    $searchInput.val('');

    /*渲染MathJax数学公式*/
    if($("script[type='text/x-mathjax-config']").length>0){
        $.getScript($("#MathJax-js").val(),function () {
            MathJax.Hub.Queue(
                ["resetEquationNumbers",MathJax.InputJax.TeX],
                ["Typeset",MathJax.Hub]
            );
        });
    }

    /*新内容淡入*/
    content.css({'opacity': 1}).removeClass('fadeOuts').addClass('fadeIns');
    bind();
    initEffects();
}


/*快捷键/组合键*/
var publickey = {"shift": false, "ctrl": false, "alt": false, "last": 0};
if (shortcutKey && pageshortcut) {
    $(document).keydown(function (e) {
        var tobottom = container.prop("scrollHeight") - container.scrollTop() - container.height();
        var totop = container.scrollTop();
        if (!$searchInput.is(":focus")) {
            if (e.keyCode === 74) { /* J */
                container.animate({scrollTop: container.prop("scrollHeight") - container.height()}, tobottom, "linear");
            } else if (e.keyCode === 75) { /* K */
                container.animate({scrollTop: 0}, totop, "linear");
            } else if (e.keyCode === 71) { /* G */
                if (publickey.shift) {
                    container.animate({scrollTop: container.prop("scrollHeight")}, 800);
                } else if (publickey.last === 71) { /* G */
                    container.animate({scrollTop: 0}, 800);
                }
            } else if (e.keyCode === 16) { /* shift */
                publickey.shift = true;
            }
        }
    })

    $(document).keyup(function (e) {
        if (!$searchInput.is(":focus")) {
            if (e.which === 74 || e.which === 75) { /* J K - 上滑/下滑*/
                container.stop(true);
            } else if (e.which === 16) {
                publickey.shift = false;
            }
        }
        publickey.last = e.keyCode;
    })
}


/*搜索输入框: 回车跳转到第一个搜索结果*/
$searchInput.keydown(function (e) {
    if (e.which === 13) { /* 回车 */
        var $firstResult = $("#local-search-result a:visible:first");
        if ($firstResult.length > 0) {
            $firstResult.trigger("click");
        }
        $(':focus').blur();
    } else if (e.which === 27) { /* esc */
        $(this).val('').blur();
        $("#local-search-result").hide().html('');
    }
});
var clickScrollTo = false
function syncOutline(_this) {
    try{
        if ($('#outline-list .toc-link[href!="#"]').length > 0 && !clickScrollTo) {
            var activeIndex = null
            $('#outline-list .toc-link[href!="#"]').each(function (index) {
                var diff = _this.scrollTop - $(_this).find(decodeURI($(this).attr('href')))[0].offsetTop
                if (diff < -20) {
                    activeIndex = index === 0 ? 0 : index - 1
                    return false
                }
            })
            $('#outline-list .toc-link[href!="#"].active').removeClass('active')
            if (activeIndex === null) {
                $('#outline-list .toc-link[href!="#"]:last').addClass('active')
            } else {
                $('#outline-list .toc-link[href!="#"]:eq(' + activeIndex + ')').addClass('active')
            }
            if ($('#outline-list .toc-link[href!="#"].active')[0].offsetTop - $outlineList.height() - $outlineList[0].scrollTop > -80) {
                $outlineList.scrollTop($('#outline-list .toc-link[href!="#"].active')[0].offsetTop + 80 - $outlineList.height())
            } else if ($('#outline-list .toc-link[href!="#"].active')[0].offsetTop < $outlineList[0].scrollTop) {
                $outlineList.scrollTop($('#outline-list .toc-link[href!="#"].active')[0].offsetTop)
            }
        }
    } catch (e) {
        console.error('同步toc位置失败！', e)
    }
}

$(function () {
    bind();
    initEffects(); // 初始化特效

    // 监测滚动，同步大纲
    container.on('scroll', function () {
        var _this = this
        var $rocket = $("#rocket");
        if (container.scrollTop() >= 200 && $rocket.css("display") === "none") {
            $("#rocket").removeClass("launch").css("display", "block").css("opacity", "0.5");
        } else if (container.scrollTop() < 200 && $rocket.css("display") === "block") {
            $("#rocket").removeClass("launch").css("opacity", "1").css("display", "none");
        }
        syncOutline(_this)
    })

    // 全文搜索初始化
    if ($('#local-search-result').length>0) {
        $.getScript(blog_path + '/js/search.js', function () {
            searchFunc(blog_path + "/search.json", 'local-search-input', 'local-search-result');
        })
    }

    /*回到页首*/
    $("#rocket").on("click", function (e) {
        $(this).addClass("launch");
        container.animate({scrollTop: 0}, 500);
    });

});

/*绑定新加载内容的点击事件*/
function bind() {
    /*渲染高亮代码块结构与样式*/
    if ($('#theme_highlight_on').val() === 'true') {
        $('pre code').each(function (i, block) {
            var $pre = $(this).parent('pre');
            if ($pre.find('.copy-btn').length === 0) {
                var hasCopy = $('#theme_code_copy').val() !== 'false';
                if (hasCopy) {
                    $pre.append('<div class="copy-btn" onclick="copyCode(this)">COPY</div>');
                }
            }
            var codeClass = $(this).attr('class') || '';
            if (codeClass.indexOf('hljs') === -1) {
                hljs.highlightElement(block);
            }
        });
    }

    // 文章列表排序
    $('.sort-btn').on('click', function() {
        var $btn = $(this);
        var sortType = $btn.data('sort');
        var $grid = $('#home-post-grid');
        var $items = $grid.children('.post-card');

        if ($btn.hasClass('active')) {
            // 切换升降序
            if ($btn.hasClass('desc')) {
                $btn.removeClass('desc').addClass('asc');
            } else {
                $btn.removeClass('asc').addClass('desc');
            }
        } else {
            $('.sort-btn').removeClass('active');
            $btn.addClass('active');
        }

        var isDesc = $btn.hasClass('desc');

        $items.sort(function(a, b) {
            var valA, valB;
            if (sortType === 'date') {
                valA = $(a).data('date');
                valB = $(b).data('date');
                return isDesc ? valB - valA : valA - valB;
            } else if (sortType === 'title') {
                valA = $(a).data('title').toString();
                valB = $(b).data('title').toString();
                return isDesc ? valB.localeCompare(valA, 'zh-CN') : valA.localeCompare(valB, 'zh-CN');
            }
            return 0;
        });

        $grid.append($items);
    });

    // 公告更多展示
    $('#show-more-announce').on('click', function() {
        $('.announce-box').show();
        $(this).hide();
    });

    initArticle();
    $(".article_number").text($("#yelog_site_posts_number").val());
    $(".site_word_count").text($("#yelog_site_word_count").val());
    $(".site_uv").text($("#busuanzi_value_site_uv").text());
    $(".site_pv").text($("#busuanzi_value_site_pv").text());

    // 使用 MutationObserver 替代废弃的 DOMNodeInserted
    var uvObserver = new MutationObserver(function() {
        $(".site_uv").text($("#busuanzi_value_site_uv").text());
    });
    var pvObserver = new MutationObserver(function() {
        $(".site_pv").text($("#busuanzi_value_site_pv").text());
    });
    var uvEl = document.getElementById('busuanzi_value_site_uv');
    var pvEl = document.getElementById('busuanzi_value_site_pv');
    if (uvEl) uvObserver.observe(uvEl, { childList: true, characterData: true, subtree: true });
    if (pvEl) pvObserver.observe(pvEl, { childList: true, characterData: true, subtree: true });
    //绑定文章内tag的搜索事件
    $(".pjax article .article-meta .tag a").on("click", function (e) {
        $searchInput.val("#" + $(this).text().trim());
        $searchInput.trigger('input');
    });
    //绑定文章内作者的点击事件
    $(".pjax article .article-meta .author").on("click", function (e) {
        $searchInput.val("@" + $(this).text().trim());
        $searchInput.trigger('input');
    });
    //初始化文章toc
    $("#outline-list").html($(".pjax article .toc-ref .toc").clone());
    $("#outline-list .toc").append($(".pjax article .toc-ref > .toc-item").clone());
    // 修复自定义标题的关联关系
    $("#outline-list").find('.toc-link').each(function() {
        if (!$(this).attr('href')) {
            var tocText = $(this).text().replaceAll(/[^a-zA-Z0-9]/g, '')
            $(this).attr('href', '#' + encodeURIComponent(tocText))
            $(this).parent().attr('class').split(' ').forEach(function (item) {
                if (item.indexOf('toc-level-') !== -1) {
                    $('.main-wrapper').find('h'+item.replace('toc-level-', '')).each(function () {
                        if ($(this).text().replaceAll(/[^a-zA-Z0-9]/g, '') === tocText) {
                            $(this).attr('id', encodeURIComponent(tocText))
                        }
                    })
                }
            })
        }
    })
    syncOutline(container[0])
    //绑定文章toc的滚动事件
    $("a[href^='#']").click(function () {
        var $this = $(this)
        if ($this.parents('#outline-list').length > 0) {
            $('#outline-list .toc-link[href!="#"].active').removeClass('active')
            $this.addClass('active')
        }
        clickScrollTo = true
		    var targetOffsetTop = $(decodeURI($this.attr("href")))[0].offsetTop
        container.animate({scrollTop: container.scrollTop > targetOffsetTop ? (targetOffsetTop + 20) : (targetOffsetTop - 20)}, 500, 'swing', function () {
            clickScrollTo = false
        });
        return false;
    });
    /*给文章中的站内跳转绑定pjax*/
    $(document).pjax('.pjax article a[target!=_blank]', '.pjax', {fragment: '.pjax', timeout: 8000});

    /*初始化 img*/
    if (img_resize !== 'photoSwipe') {
        content.find('img:not([data-ignore])').each(function () {
            if (!$(this).parent().hasClass('div_img')) {
                $(this).wrap("<div class='div_img'></div>");
                var alt = this.alt;
                if (alt) {
                    $(this).after('<div class="img_alt"><span>' + alt + '</span></div>');
                }
            }
            if ($(window).width() > 426) {
                $(this).on("click", function (e) {
                    var _that = $(this);
                    $("body").append('<img class="img_hidden" style="display:none" src="' + this.src + '" />');
                    var img_width = "";
                    var img_height = "";
                    var img_top = "";
                    var img_left = "";
                    if ((this.width / this.height) > (document.body.clientWidth / document.body.clientHeight) && $(".img_hidden").width() > document.body.clientWidth) {
                        img_width = document.body.clientWidth + "px";
                        img_height = this.height * document.body.clientWidth / this.width + "px";
                        img_top = (document.body.clientHeight - this.height * document.body.clientWidth / this.width) / 2 + "px";
                        img_left = "0px";
                    } else if (((this.width / this.height) < (document.body.clientWidth / document.body.clientHeight) && $(".img_hidden").height() > document.body.clientHeight)) {
                        img_width = this.width * document.body.clientHeight / this.height + "px";
                        img_height = document.body.clientHeight + "px";
                        img_top = "0px";
                        img_left = (document.body.clientWidth - this.width * document.body.clientHeight / this.height) / 2 + "px";
                    } else {
                        img_height = $(".img_hidden").height() + "px";
                        img_width = $(".img_hidden").width() + "px";
                        img_top = (document.body.clientHeight - $(".img_hidden").height()) / 2 + "px";
                        img_left = (document.body.clientWidth - $(".img_hidden").width()) / 2 + "px";
                    }
                    $("body").append('<div class="img_max" style="opacity: 0"></div>');
                    $("body").append('<img class="img_max" src="' + this.src + '" style="top:' + $(this).offset().top + 'px;left:' + $(this).offset().left + 'px; width:' + $(this).width() + 'px;height: ' + this.height + 'px;">');
                    $(this).css("visibility", "hidden");
                    setTimeout(function () {
                        $("img.img_max").attr("style", "").css({
                            "top": img_top,
                            "left": img_left,
                            "width": img_width,
                            "height": img_height
                        });
                        $("div.img_max").css("opacity", "1");
                    }, 10);
                    $(".img_max").on("click", function (e) {
                        $("img.img_max").css({
                            "width": _that.width() + "px",
                            "height": _that.height() + "px",
                            "top": _that.offset().top + "px",
                            "left": _that.offset().left + "px"
                        })
                        $("div.img_max").css("opacity", "0");
                        setTimeout(function () {
                            _that.css("visibility", "visible");
                            $(".img_max").remove();
                            $(".img_hidden").remove();
                        }, 500);
                    })
                })
            }
        });
    }

}

/**
 * 复制代码
 */
function copyCode(e) {
    var $code = $(e).siblings('code');
    if (copy($code.text())) {
        $(e).addClass('success').html('SUCCESS');
        setTimeout(function () {
            $(e).removeClass('success').html('COPY');
        }, 1500);
    }
}

function copy(text) {
    if (text && navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(function() {
            // fallback for older browsers
            var target = document.createElement('textarea');
            target.style.opacity = '0';
            target.value = text;
            document.body.appendChild(target);
            target.select();
            document.execCommand('copy', true);
            document.body.removeChild(target);
        });
        return true;
    }
    return false;
}

/**
 * 赛博故障核心逻辑：随机切片与位移 (Cyber Glitch)
 * @param {jQuery} $target 目标容器，需包含 .layer-pink 和 .layer-cyan
 */
function triggerCyberGlitch($target, duration = 1000) {
    const $pink = $target.find('.layer-pink');
    const $cyan = $target.find('.layer-cyan');
    const $main = $target.find('.avatar, .pjax-content'); // 适配头像或全屏
    
    let startTime = Date.now();

    function glitchLoop() {
        if (Date.now() - startTime > duration) {
            $pink.hide();
            $cyan.hide();
            $main.css('transform', 'none');
            return;
        }

        if (Math.random() > 0.3) {
            const top1 = Math.floor(Math.random() * 80);
            const bottom1 = Math.floor(Math.random() * (100 - top1));
            const top2 = Math.floor(Math.random() * 80);
            const bottom2 = Math.floor(Math.random() * (100 - top2));

            const x1 = (Math.random() * 10 - 5) + 'px';
            const y1 = (Math.random() * 6 - 3) + 'px';
            const x2 = (Math.random() * 10 - 5) + 'px';
            const y2 = (Math.random() * 6 - 3) + 'px';

            $pink.show().css({
                'clip-path': `inset(${top1}% 0 ${bottom1}% 0)`,
                'transform': `translate(${x1}, ${y1})`
            });

            $cyan.show().css({
                'clip-path': `inset(${top2}% 0 ${bottom2}% 0)`,
                'transform': `translate(${x2}, ${y2})`
            });

            $main.css('transform', `translate(${(Math.random() * 4 - 2)}px, 0)`);
        } else {
            $pink.hide();
            $cyan.hide();
            $main.css('transform', 'none');
        }

        setTimeout(glitchLoop, Math.random() * 150 + 50);
    }

    glitchLoop();
}

/**
 * 初始化特效
 */
function initEffects() {
    // 1. 博客名乱码闪烁
    // ... (rest of methods)
    const $brandTitle = $('.brand-text h1');
    if ($brandTitle.length > 0) {
        const originalText = $brandTitle.text();
        const letters = "!@#$%^&*()_+{}[]|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let isGlitching = false;

        $brandTitle.on('mouseenter', function() {
            if (isGlitching) return;
            isGlitching = true;
            $(this).addClass('glitching');
            
            let iteration = 0;
            const interval = setInterval(() => {
                $(this).text(originalText.split("").map((letter, index) => {
                    if (index < iteration) return originalText[index];
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join(""));

                if (iteration >= originalText.length) {
                    clearInterval(interval);
                    $(this).text(originalText).removeClass('glitching');
                    isGlitching = false;
                }
                iteration += originalText.length / 10;
            }, 40);
        });
    }

    // 2. 导航栏文字逐字符跳动
    $('.nav-item-text .zh, .top-links a.site_url').each(function() {
        const $this = $(this);
        const text = $this.text().trim();
        if (text) {
            const html = text.split('').map((char, i) => 
                `<span class="jump-char" style="animation-delay: ${i * 0.05}s">${char}</span>`
            ).join('');
            $this.html(html);
        }
    });

    // 3. Hero View More 波动
    $('.hero-btn').each(function() {
        const $this = $(this);
        const $arrow = $this.find('span');
        const originalText = $this.contents().filter(function() {
            return this.nodeType === 3; // 文本节点
        }).text().trim();
        
        if (originalText) {
            const html = originalText.split('').map((char, i) => 
                `<span class="wave-char" style="animation-delay: ${i * 0.05}s">${char === ' ' ? '&nbsp;' : char}</span>`
            ).join('') + ` <span>${$arrow.text()}</span>`;
            $this.html(html);
        }
    });

    // 4. 顶部系统状态数字乱跳
    const $sysStatus = $('#sys-status');
    if ($sysStatus.length > 0) {
        const $bigDate = $sysStatus.find('.big');
        const $month = $sysStatus.find('.sys-month');
        const $year = $sysStatus.find('.sys-year');
        const $blogCountSpan = $sysStatus.find('.sys-text > span:last-child'); // 使用 > 确保只选中外层的第二个 span

        // 暂存原始值
        const originalDate = $bigDate.text();
        const originalMonth = $month.text();
        const originalYear = $year.text();
        const originalBlogHtml = $blogCountSpan.html();
        
        // 预提取数字：匹配并提取 HTML 中的第一个数字位
        const matchBlog = originalBlogHtml.match(/\d+/);
        const originalBlogNum = matchBlog ? parseInt(matchBlog[0]) : 0;

        let glitchInterval;
        let isGlitching = false;

        $sysStatus.on('mouseenter', function() {
            if (isGlitching) return;
            isGlitching = true;

            let count = 0;
            const maxGlitches = 8; // 跳动次数

            glitchInterval = setInterval(() => {
                // 1. 日期随机 (1-28)
                $bigDate.text(Math.floor(Math.random() * 28) + 1);
                // 2. 月份随机 (01-12)
                $month.text('/' + (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0'));
                // 3. 年份随机 (2000-2050)
                $year.text('/' + (Math.floor(Math.random() * 51) + 2000));
                
                // 4. 博客数随机 (基于原始数字浮动)
                const randomBlogNum = Math.max(0, originalBlogNum + Math.floor(Math.random() * 20) - 10);
                // 仅替换数字部分，保留 " BLOG" 后缀
                $blogCountSpan.html(originalBlogHtml.replace(/\d+/, randomBlogNum));

                count++;
                if (count >= maxGlitches) {
                    clearInterval(glitchInterval);
                    restore();
                }
            }, 60);
        });

        $sysStatus.on('mouseleave', function() {
            if (isGlitching) {
                clearInterval(glitchInterval);
                restore();
            }
        });

        function restore() {
            $bigDate.text(originalDate);
            $month.text(originalMonth);
            $year.text(originalYear);
            $blogCountSpan.html(originalBlogHtml);
            isGlitching = false;
        }
    }

    // 5. 头像故障效果
    $('.user-info').on('mouseenter', function() {
        triggerCyberGlitch($(this).find('.avatar-container'), 500);
    });
}
