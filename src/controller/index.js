const Base = require('./base.js');
const axios = require('axios');
const moment = require('moment');
const cheerio = require('cheerio');
const tunnel = require('tunnel');
const http = require('http');
const async = require('async');


module.exports = class extends Base {

  __before () { 
    if (!this.isCli) { 
      return this.body = 'deny';
    }
  }
  

  async _getHtml (url,header) { 
    let html = await axios.get(url,header).then(rs => rs.data).catch(err => {
      return null;
    });
    return html;
  }
  _getArrByNum (str,num) { 
    let arr = [];
    for (let start = 1; start <= num; start++) { 
      arr.push(str.replace('${NUM}', start));
    }
    return arr;
  }
  _getHeader (host,cookie) { 
    let obj = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en,zh-CN;q=0.9,zh;q=0.8',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36'
    }
    if (host) { 
      obj.Host = host;
    }
    if (cookie) { 
      obj.Cookie = cookie;
    }
    return obj;
  }
  // .fl-table tbody tr|td|[0,1]
  _getIpContent (html,selector,handle) {
    let $ = cheerio.load(html);
    let iparr = [];
    $(selector).each((idx, item) => {
      let str = handle($(item));
      if (str) { 
        let obj = {
          host: str.split(':')[0].trim(),
          port: str.split(':')[1].trim(),
          ipstr: str.trim(),
          ctime: moment().format('YYYY-MM-DD HH:mm:ss')
        }
        iparr.push(obj);
      }
    })
    return iparr;
  }


  //common proxy callback
  async proxyAction () { 
    let params = this.ctx.req.params;
    think.logger.info(`代理定时任务:[${params.name}] 开始抓取...`)
    let count = 0;
    let arr = this._getArrByNum(params.url,params.urlcount)
    let header = this._getHeader(params.host||'');
    for (let str of arr) { 
      let html = await this._getHtml(str, header);
      if (html) { 
        let ipArr = this._getIpContent(html, params.selector,params.iphandle);
        for (let obj of ipArr) { 
          let rst = await think.model('pan_proxy').thenAdd(obj, { ipstr: obj.ipstr });
          if(rst.type == 'add')count++;
        }
      }
    }
    think.logger.info(`代理定时任务:[${params.name}] 共计获取${count} 条记录。`)
  }


  async _testProxy (proxy,url) { 
    let start = +new Date();
    let rst = await axios({
      method: 'GET',
      url: url,
      header: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36'
      },
      proxy: {
        host: proxy.host,
        port : proxy.port
      }
    }).then(rs => rs.data).catch(err => {
      return null;
    });
    let end = +new Date();
    return {
      restime: end - start,
      rst : rst
    }
  }

  async _testProxys (proxy,url) { 
    let start = +new Date();
    let rst = await axios({
      method: 'GET',
      url: url,
      header: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36'
      },
      proxy: false,
      httpAgent: tunnel.httpsOverHttp({
        rejectUnauthorized: false,
        proxy: {
          keepAlive: false,
          host: proxy.host,
          port: proxy.port
        }
      })
    }).then(rs => rs.data).catch(err => {
      console.log(err);
      return null;
    });
    let end = +new Date();
    return {
      restime: end - start,
      rst : rst
    }
  }

  async deleteAction () { 
    await this.model('pan_proxy').where({ type: null, errnum: ['>', 10] }).delete();
    await this.model('pan_proxy').where({ score: ['<', '0.1'], sucnum: ['<', 10] }).delete();
  }

  //验证ip可用性
  async validateAction () { 
    let httpUrl = 'http://httpbin.org/ip';
    let httpsUrl = 'https://httpbin.org/ip';
    let list = await this.model('pan_proxy').order('utime asc').limit(0,100).select();
    let thiz = this;
    async.mapLimit(list, list.length, async function (item) { 
      let { id, type,host, sucnum, errnum } = item;
      let rst1 = await thiz._testProxy(item, httpUrl);
      let rst2 = await thiz._testProxys(item, httpsUrl);
      let restime = 10000;
      if (!type) { 
        if (rst2.rst != null && rst2.rst.origin == host) {
          type = 'HTTPS';
          await thiz.model('pan_proxy').where({ id: id }).update({ type: type });
        } else if (rst1.rst != null && rst1.rst.origin == host) { 
          type = 'HTTP';
          await thiz.model('pan_proxy').where({ id: id }).update({ type: type });
        }
      }
      if (type == 'HTTPS' && rst2.rst != null) {
        sucnum = (sucnum || 0) + 1;
        restime = rst2.restime;
      } else if (type == 'HTTP' && rst1.rst != null) { 
        sucnum = (sucnum || 0) + 1;
        restime = rst2.restime;
      } else {
        errnum = (errnum || 0) + 1;
      }
      let score = (sucnum || 0) / (Math.max(1, errnum || 0));
      await thiz.model('pan_proxy').where({ id: id }).update({
        sucnum: sucnum||0,
        errnum: errnum||0,
        restime: restime,
        score: score,
        utime : moment().format('YYYY-MM-DD HH:mm:ss')
      })

    })
  }

};
