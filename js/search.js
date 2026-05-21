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
        // perform local searching
        datas.forEach(function (data) {
          var isMatch = true;
          if (!data.title || data.title.trim() === '') {
            data.title = "Untitled";
          }
          var data_title = data.title.trim().toLowerCase();
          var data_content = data.content.trim().replace(/<[^>]+>/g, "").toLowerCase();
          var data_url = data.url;
          var index_title = -1;
          var index_content = -1;
          var first_occur = -1;

          if (data_content !== '') {
            keywords.forEach(function (keyword, i) {
              index_title = data_title.indexOf(keyword);
              index_content = data_content.indexOf(keyword);

              if (index_title < 0 && index_content < 0) {
                isMatch = false;
              } else {
                if (index_content < 0) {
                  index_content = 0;
                }
                if (i == 0) {
                  first_occur = index_content;
                }
              }
            });
          } else {
            isMatch = false;
          }
          
          if (isMatch) {
            var post_date = "";
            var urls = data_url.split("/");
            if (urls.length >= 4) {
                post_date = urls[1]+"/"+urls[2]+"/"+urls[3];
            }
            str += "<li><a href='" + data_url + "'><span class='post-title' title='"+data.title+"'>" + data.title + "</span><span class='post-date' title='"+post_date+"'>"+post_date+"</span></a>";
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
                match_content = match_content.replace(regS, "<em class=\"search-keyword\">" + keyword + "</em>");
              });

              str += "<p class=\"search-result\">" + match_content + "...</p>"
            }
            str += "</li>";
          }
        });
        str += "</ul>";
        if (str.indexOf('<li>') === -1) {
          return $resultContent.innerHTML = "<ul><span class='local-search-empty'>没有找到内容，更换下搜索词试试吧~<span></ul>";
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
