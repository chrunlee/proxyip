# IP 代理池

由于最近大量使用代理抓数据，付费的太贵，免费的又有很多无效的，准备建立一个简易的代理池。

# 免费IP来源

http://www.xiladaili.com/

https://list.proxylistplus.com/Fresh-HTTP-Proxy-List-1

https://ip.jiangxianli.com/?page=1&protocol=http

https://www.kuaidaili.com/free/inha/1/

暂定这些，后续陆陆续续增加。

# 思路逻辑

1. 各个网站抓取
2. 定时任务跑，对抓取的IP进行筛选得分
3. 对于一些长期无效的IP 进行删除

# 代理属性

host/port/ipstr/ctime/utime/
score : 得分

# 哪些IP认为无效

检查N次以上，且分数低于某个分数，则无效。

## N轮筛选

https://httpbin.org/ip
http://httpbin.org/ip
https://weibo.cn

收集到的ip集合将经过N轮，间隔为t的连接测试，对于每一个ip，必须全部通过这N轮测试才能最终进入数据库。如果当天进入数据库的ip较少，则暂停一段时间（一天）再抓。
数据库中ip评价准则

检测过程中累计超时次数>USELESS_TIME&&成功率<SUCCESS_RATE就被剔除。

score = (success_rate + test_times / 500) / avg_response_time
原来的考虑是score = success_rate / avg_response_time, 即：评分=成功率/平均响应时间， 考虑到检测合格过100次的老ip比新ip更有价值，检测次数也被引入评分。

检测逻辑：以https为主，http的不要，毕竟现在大部分网站都是 https类型了。

获得一个IP ，然后一轮进行10次链接测试，先链接bin/ip ，确定可以连通的话，校验是否与IP雷同。
如果无法连通，则测试次数+1 ，成功次数不变。
如果连通，则都+1.
如果不雷同，则认为是非高匿。
然后测试链接微博或百度，如果能连通，则都+1 。
记录相应时间。
然后更新分数
结束后统计最终的数据：成功/失败/相应时间（平均）/得分。
（成功/失败）
成功+失败/响应时间



