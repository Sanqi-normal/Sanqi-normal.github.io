var searchAll;
var searchFunc = function (path, search_id, content_id) {
  'use strict';
  $.ajax({
    url: path,
    dataType: 'json',
    success: function (datas) {
      var $resultContent = document.getElementById(content_id);

      searchAll = function (val) {
        var str = '<ul class=\"search-result-list\">';
        var keywords = val.trim().toLowerCase().split(/[\s\-]+/);
        $resultContent.innerHTML = "";
        if (val.trim().length <= 0) {
          return;
        }

        // Get active filters
        var activeFilters = [];
        $('.filter-chk:checked').each(function() {
            activeFilters.push($(this).data('type'));
        });

        // perform local searching
        datas.forEach(function (data) {
          var isMatch = true;
          if (!data.title || data.title.trim() === '') {
            data.title = "Untitled";
          }
          var data_title = data.title.trim().toLowerCase();
          var data_content = data.content.trim().replace(/<[^>]+>/g, "").toLowerCase();
          var data_categories = (data.categories || []).join(" ").toLowerCase();
          var data_tags = (data.tags || []).join(" ").toLowerCase();
          
          var data_url = data.url;
          var index_title = -1;
          var index_content = -1;
          var first_occur = -1;

          keywords.forEach(function (keyword, i) {
            index_title = data_title.indexOf(keyword);
            index_content = data_content.indexOf(keyword);
            var index_categories = data_categories.indexOf(keyword);
            var index_tags = data_tags.indexOf(keyword);

            var matchTitle = activeFilters.indexOf('title') !== -1 && index_title >= 0;
            var matchContent = activeFilters.indexOf('content') !== -1 && index_content >= 0;
            var matchCategories = activeFilters.indexOf('categories') !== -1 && index_categories >= 0;
            var matchTags = activeFilters.indexOf('tags') !== -1 && index_tags >= 0;

            if (!matchTitle && !matchContent && !matchCategories && !matchTags) {
              isMatch = false;
            } else {
              if (i === 0) {
                if (index_content >= 0) first_occur = index_content;
                else if (index_title >= 0) first_occur = 0;
                else first_occur = 0;
              }
            }
          });
          
          if (isMatch) {
            var post_date = "";
            var urls = data_url.split("/");
            if (urls.length >= 4) {
                post_date = urls[1]+"/"+urls[2]+"/"+urls[3];
            }
            var highlightedTitle = data.title;
            keywords.forEach(function (keyword) {
              var regS = new RegExp(keyword, "gi");
              highlightedTitle = highlightedTitle.replace(regS, "<em class=\"search-keyword\">$&</em>");
            });

            str += "<li><a href='" + data_url + "'><span class='post-title' title='"+data.title+"'>" + highlightedTitle + "</span><span class='post-date' title='"+post_date+"'>"+post_date+"</span></a>";
            
            // Render categories and tags in search results
            if (data.categories && data.categories.length > 0) {
                str += "<div class='search-result-meta'><svg viewBox='0 0 24 24' width='12' height='12' fill='currentColor' style='margin-right:5px'><path d='M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/></svg>";
                data.categories.forEach(function(cat, idx) {
                    var highlightedCat = cat;
                    keywords.forEach(function(keyword) {
                        highlightedCat = highlightedCat.replace(new RegExp(keyword, "gi"), "<em class='search-keyword'>$&</em>");
                    });
                    str += "<span class='search-result-cat'>" + highlightedCat + "</span>" + (idx < data.categories.length - 1 ? ", " : "");
                });
                str += "</div>";
            }
            if (data.tags && data.tags.length > 0) {
                str += "<div class='search-result-meta'><svg viewBox='0 0 24 24' width='12' height='12' fill='currentColor' style='margin-right:5px'><path d='M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z'/></svg>";
                data.tags.forEach(function(tag, idx) {
                    var highlightedTag = tag;
                    keywords.forEach(function(keyword) {
                        highlightedTag = highlightedTag.replace(new RegExp(keyword, "gi"), "<em class='search-keyword'>$&</em>");
                    });
                    str += "<span class='search-result-tag'>#" + highlightedTag + "</span>" + (idx < data.tags.length - 1 ? " " : "");
                });
                str += "</div>";
            }

            var content = data.content.trim().replace(/<[^>]+>/g, "");
            if (first_occur >= 0) {
              var start = first_occur - 20;
              var end = first_occur + 80;
              if (start < 0) start = 0;
              if (start == 0) end = 100;
              if (end > content.length) end = content.length;
              var match_content = content.substr(start, end);

              keywords.forEach(function (keyword) {
                var regS = new RegExp(keyword, "gi");
                match_content = match_content.replace(regS, "<em class=\"search-keyword\">$&</em>");
              });

              str += "<p class=\"search-result\">" + match_content + "...</p>"
            }
            str += "</li>";
          }
        });
        str += "</ul>";
        if (str.indexOf('<li>') === -1) {
          var emptyText = (window.THEME_CONFIG && window.THEME_CONFIG.i18n_search_empty) ? window.THEME_CONFIG.i18n_search_empty : "没有找到内容，更换下搜索词试试吧~";
          return $resultContent.innerHTML = "<ul><span class='local-search-empty'>" + emptyText + "<span></ul>";
        }
        $resultContent.innerHTML = str;

        $(document).pjax('#local-search-result a', '.pjax', {fragment: '.pjax', timeout: 8000});
        $("#local-search-result a").mouseenter(function (e) {
            $("#local-search-result a.hover").removeClass("hover");
            $(this).addClass("hover");
        });
        $("#local-search-result a").mouseleave(function (e) {
            $(this).removeClass("hover");
        });
      }
    },
    error: function() {
        console.error("Failed to load search.json");
    }
  });
}
