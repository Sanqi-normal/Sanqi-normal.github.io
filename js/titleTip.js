jQuery.fn.quberTip = function (options) {
	var defaults = {
		speed: 500,
		xOffset: 10,
		yOffset: 10
	};
	var options = $.extend(defaults, options);
	return this.each(function () {
		var $this = jQuery(this);
		if ($this.attr('data-title') != undefined) {
			//Pass the title to a variable and then remove it from DOM
			if ($this.attr('data-title') != '') {
				var tipTitle = ($this.attr('data-title'));
			} else {
				var tipTitle = 'QuberTip';
			}
			//Remove title attribute
			$this.removeAttr('data-title');
			$(this).hover(function (e) {
				if ($(window).width() > 1024) {
					$("body").append("<div id='tooltip' class='quber-tip'>" + tipTitle + "</div>");
					$("#tooltip")
						.css("top", (e.pageY + defaults.xOffset) + "px")
						.css("left", (e.pageX + defaults.yOffset) + "px")
						.fadeIn(options.speed);
				}
			}, function () {
				//Remove the tooltip from the DOM
				$("#tooltip").remove();
			});
			
			var ticking = false;
			$(this).mousemove(function (e) {
				if (!ticking) {
					window.requestAnimationFrame(function() {
						$("#tooltip")
							.css("top", (e.pageY + defaults.xOffset) + "px")
							.css("left", (e.pageX + defaults.yOffset) + "px");
						ticking = false;
					});
					ticking = true;
				}
			});
		}
	});
};