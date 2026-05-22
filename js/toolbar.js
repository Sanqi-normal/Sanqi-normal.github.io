(function($) {
    $(function() {
        var $toolbar = $('#right-toolbar');
        var $container = $('.main-wrapper');
        
        // 1. 鼠标位置检测 (边缘呼出)
        $(document).on('mousemove', function(e) {
            var screenWidth = $(window).width();
            var mouseX = e.pageX;
            
            // 进入右侧极窄区域 (例如 40px) 或悬停在工具栏上时展开
            if (mouseX > screenWidth - 40 || $toolbar.is(':hover')) {
                $toolbar.addClass('active');
            } else {
                $toolbar.removeClass('active');
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

        // [3] 切换亮暗 (默认暗色)
        var currentTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(currentTheme);

        $('#tool-theme').on('click', function() {
            var theme = $('html').attr('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(theme);
        });

        function applyTheme(theme) {
            $('html').attr('data-theme', theme);
            localStorage.setItem('theme', theme);
            if (theme === 'light') {
                $('#tool-theme .icon-sun').hide();
                $('#tool-theme .icon-moon').show();
            } else {
                $('#tool-theme .icon-sun').show();
                $('#tool-theme .icon-moon').hide();
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
