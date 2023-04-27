window.$docsify = {
  el: '#app',
  homepage: 'docs/index.md',
  loadSidebar: true,
  executeScript: true,
  search: {
    placeholder: '输入关键字搜索',
    noData: '没有匹配内容',
    depth: 6,
  },
  plugins: [remoteMDPlugin, codeBlockPlugin, editPlugin],
};

function remoteMDPlugin(hook, vm) {
  var tplTagRE = /\{\{-\s+d.include\s*\(\s*[\"|\'](.*)[\"|\']\s*\)\s*\}\}/g;

  hook.beforeEach(function (content, next) {
    layui.use(function () {
      // 处理插入的 md, docsify 原生 include 语法不支持 pre 标签，laytpl 会去除所有换行，影响排版，所以用正则
      function load(content) {
        if (tplTagRE.test(content)) {
          content = content.replace(tplTagRE, function (matchedStr, $1) {
            console.log(matchedStr, $1);
            var path = $1;
            var text = matchedStr;
            layui.$.ajax({
              type: 'get',
              url: path,
              async: false,
              dataType: 'text',
              success: function (data) {
                text = load(data);
              },
            });
            return text;
          });
        }

        return content;
      }

      var cdncssRE = /\{\{=\s+d.layui.cdn.css\s*\}\}/g;
      var cdnjsRE = /\{\{=\s+d.layui.cdn.js\s*\}\}/g;
      var rootRE = /\{\{\s*d.root\s*\}\}/g;
      var tocRE = /^-{3}\n+title:\s*(.)+\n+toc:\s*(true|false)\n+-{3}\n?/;
      content = load(content)
        .replace(cdncssRE, '//unpkg.com/layui@2.8.0/dist/css/layui.css')
        .replace(cdnjsRE, '//unpkg.com/layui@2.8.0/layui.js')
        .replace(rootRE, '.')
        .replace(tocRE, '');
      next(`\n ${content} \n`);
    });
  });
}

function codeBlockPlugin(hook, vm) {
  var codeBlockRE = /```([\s\S]*?)```[\s]*/g;

  hook.beforeEach(function (content, next) {
    if (codeBlockRE.test(content)) {
      content = content.replace(codeBlockRE, `\n <pre class="layui-code">$1</pre> \n`);
    }

    next(content);
  });

  hook.doneEach(function () {
    layui.use(function () {
      layui.code({
        elem: '.layui-code',
      });
      layui.$('blockquote').addClass('layui-elem-quote');
    });
  });
}

function editPlugin(hook, vm) {
  hook.afterEach(function (html) {
    var edit = `
        <div style="position:absolute;right:20px;top:20px">
          <a href="${vm.route.file}" target="_blank title="在 Github 上编辑">
            <i class="layui-icon layui-icon-edit"></i>
          </a>
        </div>`;
    return html + edit;
  });
}
