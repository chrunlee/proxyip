
const Base = require('./base');
let start = 1;
module.exports = class extends Base {

  //返回目前较为稳定的ip 
  async indexAction () { 
    let total = await this.model('pan_proxy').count();
    if (start >= total - 10) { 
      start = 1;
    } else {
      start++;
    }
    console.log(start);
    let ip = await this.model('pan_proxy').order('id desc').limit(start,1).select();
    return this.json(ip[0]);
  }

}