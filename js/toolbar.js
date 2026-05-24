(function($) {
    $(function() {
        var $toolbar = $('#right-toolbar');
        var $container = $('.main-wrapper');
        
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
            $container.animate({scrollTop: 0}, 500);
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
        var currentTheme = localStorage.getItem('theme') || 'tech'; // 修正默认值为 tech
        applyTheme(currentTheme);

        // 点击主按钮展开/收起调色板
        $('#tool-theme').on('click', function(e) {
            e.stopPropagation();
            $(this).find('.theme-palette').toggleClass('active');
        });

        // 点击调色板项切换主题
        $('.palette-item').on('click', function(e) {
            e.stopPropagation();
            var theme = $(this).data('theme-style');
            applyTheme(theme);
        });

        // 点击外部关闭调色板
        $(document).on('click', function() {
            $('.theme-palette').removeClass('active');
        });

        function applyTheme(theme) {
            // 注意：原有逻辑中 light 对应 simple，dark 对应 tech
            // 为了保持数据属性的一致性，我们将 data-theme 设置为对应的名称
            var dataTheme = 'dark';
            if (theme === 'simple') dataTheme = 'light';
            if (theme === 'manga') dataTheme = 'manga';
            if (theme === 'street') dataTheme = 'street';

            $('html').attr('data-theme', dataTheme);
            localStorage.setItem('theme', theme);
            
            // 高亮当前选中的图标
            $('.palette-item').removeClass('active');
            $('.palette-item[data-theme-style="' + theme + '"]').addClass('active');
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
            $container.animate({scrollTop: $container.prop("scrollHeight")}, 500);
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
