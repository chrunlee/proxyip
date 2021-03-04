
const Base = require('./base');
let start = 1;
module.exports = class extends Base {

  //返回目前较为稳定的ip 
  async indexAction () { 
    let total = await this.model('pan_proxy').count();
    if (start >= total - 1) { 
      start = 1;
    } else {
      start++;
    }
    let ip = await this.model('pan_proxy').order('id asc').limit(start,1).find();
    return this.json(ip);
  }

}