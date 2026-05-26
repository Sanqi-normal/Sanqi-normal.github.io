(function($) {
    $(function() {
        var $toolbar = $('#right-toolbar');
        // .main-wrapper 在部分主题下是滚动容器（height:100vh + overflow-y:auto），
        // 在 fantasy 主题下已改为自然撑高，实际滚动容器退回到 window/documentElement。
        // 用一个函数动态取当前真实的滚动容器，兼容两种情况。
        function getScrollContainer() {
            var $mw = $('.main-wrapper');
            if ($mw.length > 0 && $mw[0].scrollHeight > $mw[0].clientHeight && $mw.css('overflow-y') !== 'visible') {
                return $mw;
            }
            return $('html, body');
        }
        
        // 1. 鼠标位置检测 (边缘呼出) - 仅限桌面端
        var toolbarTicking = false;
        $(document).on('mousemove', function(e) {
            if ($(window).width() <= 768) return;
            if (!toolbarTicking) {
                window.requestAnimationFrame(function() {
                    var screenWidth = $(window).width();
                    var mouseX = e.pageX;
                    var isPaletteActive = $('.theme-palette').hasClass('active');
                    
                    // 进入右侧极窄区域 (例如 40px) 或悬停在工具栏上时展开
                    // 如果调色板正处于激活展开状态，则强制保持工具栏不收回
                    if (mouseX > screenWidth - 40 || $toolbar.is(':hover') || isPaletteActive) {
                        $toolbar.addClass('active');
                    } else {
                        $toolbar.removeClass('active');
                    }
                    toolbarTicking = false;
                });
                toolbarTicking = true;
            }
        });

        // 移动端悬浮球点击
        $('.toolbar-trigger').on('click', function(e) {
            e.stopPropagation();
            $toolbar.toggleClass('active');
        });

        // 点击其他地方收起工具栏 (移动端)
        $(document).on('click', function(e) {
            if ($(window).width() <= 768) {
                if (!$toolbar.is(e.target) && $toolbar.has(e.target).length === 0) {
                    $toolbar.removeClass('active');
                }
            }
        });

        // 2. 初始化功能状态
        function checkImmersiveAvailability() {
            var isArticle = $('.article-layout').length > 0;
            var $immBtn = $('#tool-immersive');
            if (!isArticle) {
                $immBtn.addClass('disabled');
                $immBtn.find('.icon-expand, .icon-shrink').hide();
                $immBtn.find('.icon-disabled').show();
            } else {
                $immBtn.removeClass('disabled');
                $immBtn.find('.icon-disabled').hide();
                if ($('body').hasClass('immersive-mode')) {
                    $immBtn.find('.icon-shrink').show();
                } else {
                    $immBtn.find('.icon-expand').show();
                }
            }
        }
        checkImmersiveAvailability();

        // [1] 回到顶部
        $('#tool-totop').on('click', function() {
            getScrollContainer().animate({scrollTop: 0}, 500);
        });

        // [2] 刷新页面 (站内 PJAX 刷新)
        $('#tool-refresh').on('click', function() {
            var $svg = $(this).find('svg');
            $svg.css('animation', 'none');
            setTimeout(function() {
                $svg.css('animation', 'rotate360 1s ease-in-out');
            }, 10);
            
            if ($.pjax) {
                $.pjax.reload('.pjax', {fragment: '.pjax', timeout: 8000});
            } else {
                window.location.reload();
            }
        });

        // [3] 切换风格 (Palette 模式)
        var currentTheme = localStorage.getItem('theme');
        var $paletteItem = currentTheme
            ? $('.palette-item[data-theme-style="' + currentTheme + '"]')
            : $();
        if (!$paletteItem.length) {
            $paletteItem = $('.palette-item').first();
            currentTheme = $paletteItem.data('theme-style');
        }
        var currentDataTheme = $paletteItem.data('theme-value') || 'dark';
        applyTheme(currentTheme, currentDataTheme);

        // 点击主按钮展开/收起调色板
        $('#tool-theme').on('click', function(e) {
            e.stopPropagation();
            $(this).find('.theme-palette').toggleClass('active');
        });

        // 点击调色板项切换主题
        $('.palette-item').on('click', function(e) {
            e.stopPropagation();
            var theme = $(this).data('theme-style');
            var dataTheme = $(this).data('theme-value');
            applyTheme(theme, dataTheme);
        });

        // 点击外部关闭调色板
        $(document).on('click', function() {
            $('.theme-palette').removeClass('active');
        });

        function applyTheme(theme, dataTheme) {
            function updateThemeDOM() {
                $('html').attr('data-theme', dataTheme);
                localStorage.setItem('theme', theme);

                // 高亮当前选中的图标
                $('.palette-item').removeClass('active');
                $('.palette-item[data-theme-style="' + theme + '"]').addClass('active');
            }

            if (document.startViewTransition) {
                // 开始 GPU 截屏渐变
                var transition = document.startViewTransition(function() {
                    // 在截取新屏幕快照前，禁用元素的 CSS 原生渐变
                    $('html').addClass('theme-switching');
                    updateThemeDOM();
                });
                
                // 渐变动画彻底结束后，恢复 CSS 动画能力
                transition.finished.finally(function() {
                    document.body.offsetHeight;
                    $('html').removeClass('theme-switching');
                });
            } else {
                // 降级方案：老浏览器仍然禁用 CSS 过渡，使用瞬间硬切以保证不卡顿
                $('html').addClass('theme-switching');
                updateThemeDOM();
                setTimeout(function() {
                    $('html').removeClass('theme-switching');
                }, 50);
            }
        }

        // [4] 沉浸模式
        $('#tool-immersive').on('click', function() {
            if ($(this).hasClass('disabled')) return;
            
            $('body').toggleClass('immersive-mode');
            var isImmersive = $('body').hasClass('immersive-mode');
            
            if (isImmersive) {
                $(this).find('.icon-expand').hide();
                $(this).find('.icon-shrink').show();
                $(this).attr('data-title', '退出沉浸模式');
            } else {
                $(this).find('.icon-expand').show();
                $(this).find('.icon-shrink').hide();
                $(this).attr('data-title', '沉浸模式');
            }
        });

        // [5] 静音
        var isMuted = false;
        $('#tool-mute').on('click', function() {
            isMuted = !isMuted;
            $(this).toggleClass('muted', isMuted);
            if (window.Howler) Howler.mute(isMuted);
            if (window.siteAudio) window.siteAudio.muted = isMuted;
            $(this).attr('data-title', isMuted ? '取消静音' : '静音');
        });

        // [6] 滚动到底部
        $('#tool-tobottom').on('click', function() {
            var $c = getScrollContainer();
            $c.animate({scrollTop: $c.prop("scrollHeight")}, 500);
        });

        // 针对 PJAX 的兼容
        $(document).on('pjax:end', function() {
            checkImmersiveAvailability();
            if ($('body').hasClass('immersive-mode') && $('.article-layout').length === 0) {
                $('body').removeClass('immersive-mode');
            }
        });
    });
})(jQuery);
