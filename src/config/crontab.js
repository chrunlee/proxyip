const axios = require('axios');
const mockHttp = require('think-mock-http');
let open = false;
let cronList = [
  {
    name: '西拉代理HTTPS',
    cron : '0 0 1 */1 * *',
    url: 'http://www.xiladaili.com/https/${NUM}/',
    urlcount: 5,
    immediate : open,
    host : 'www.xiladaili.com',
    selector : '.fl-table tbody tr td:first-child',
    iphandle : function (item) { 
      return item.text().trim();
    }
  },
  {
    name: '西拉代理HTTP',
    cron : '0 0 10 */1 * *',
    url: 'http://www.xiladaili.com/http/${NUM}/',
    urlcount: 5,
    immediate : open,
    host : 'www.xiladaili.com',
    selector : '.fl-table tbody tr td:first-child',
    iphandle : function (item) { 
      return item.text().trim();
    }
  },
  {
    name: 'Free Public Proxy',
    cron : '0 0 2 */1 * *',
    url: 'https://list.proxylistplus.com/Fresh-HTTP-Proxy-List-${NUM}',
    urlcount: 5,
    immediate : open,
    selector : 'table.bg tbody tr.cells',
    iphandle : function (item) { 
      let ip = item.find('td').eq(1).text().trim();
      let port = item.find('td').eq(2).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: 'Free Public Proxy - 2',
    cron : '0 0 10 */1 * *',
    url: 'https://list.proxylistplus.com/SSL-List-${NUM}',
    urlcount: 5,
    immediate : open,
    selector : 'table.bg tbody tr.cells',
    iphandle : function (item) { 
      let ip = item.find('td').eq(1).text().trim();
      let port = item.find('td').eq(2).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: '高可用HTTP',
    cron : '0 0 3 */1 * *',
    url: 'https://ip.jiangxianli.com/?page=${NUM}&protocol=http',
    urlcount: 5,
    immediate : open,
    selector : '.layui-table tbody tr',
    iphandle : function (item) { 
      let ip = item.find('td').eq(0).text().trim();
      let port = item.find('td').eq(1).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: '快代理',
    cron : '0 0 4 */1 * *',
    url: 'https://www.kuaidaili.com/free/inha/${NUM}/',
    urlcount: 5,
    immediate : open,
    selector : '#list table tbody tr',
    iphandle : function (item) { 
      let ip = item.find('td').eq(0).text().trim();
      let port = item.find('td').eq(1).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: '齐云代理',
    cron : '0 0 5 */1 * *',
    url: 'https://www.7yip.cn/free/?action=china&page=${NUM}',
    urlcount: 5,
    immediate : open,
    selector : '.container table tbody tr',
    iphandle : function (item) { 
      let ip = item.find('td').eq(0).text().trim();
      let port = item.find('td').eq(1).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: '89免费代理',
    cron : '0 0 6 */1 * *',
    url: 'https://www.89ip.cn/index_${NUM}.html',
    urlcount: 20,
    immediate : open,
    selector : '.layui-table tbody tr',
    iphandle : function (item) { 
      let ip = item.find('td').eq(0).text().trim();
      let port = item.find('td').eq(1).text().trim();
      return ip + ':' + port;
    }
  },
  {
    name: 'IP3306',
    cron : '0 0 7 */1 * *',
    url: 'http://www.ip3366.net/?stype=1&page=${NUM}',
    urlcount: 5,
    immediate : open,
    selector : '#list table tbody tr',
    iphandle : function (item) { 
      let ip = item.find('td').eq(0).text().trim();
      let port = item.find('td').eq(1).text().trim();
      return ip + ':' + port;
    }
  }
]

module.exports = cronList.map(t => {
  return {
    cron: t.cron,
    immediate: t.immediate || false,
    handle: function () { 
      let params = t;
      mockHttp({method: 'CLI', url: 'index/proxy',params}, think.app);
    }
  }
})
.concat([{
  //做IP 验证
  cron: '*/30 * * * * *',
  immediate : true,
  handle : 'index/validate'
}, {
    cron: '0 0 0 * * *',
    immediate: false,
  handle : 'index/delete'
}])