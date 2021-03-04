
const Base = require('./base');

module.exports = class extends Base {

  //返回目前较为稳定的ip 
  async indexAction () { 
    let ip = await this.model('pan_proxy').where({ type: ['!=', null] }).order('rand()').find();
    return this.json(ip);
  }

}