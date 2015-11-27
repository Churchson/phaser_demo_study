# phaser_demo_study

本项目是学习[phaser的官方示例](https://github.com/photonstorm/phaser-examples)时，为方便查看和记录学习心得而建立的。

欢迎参考[我的学习体会](http://427studio.net/blog/1/251)

主要原因是以下几点：

* 在官网上的示例页面被墙

* phaser-examples官方项目检出后要使用比较麻烦，index.php自动跳回官网页面，debug.php在较低版本wamp上无法运行，在较高版本wamp上，运行个别示例也会报错（提示：在浏览器控制台看报告哪个资源不存在，打开debug.php看if分支，在页面上取消相应复选框的勾选，再刷新页面），而且还有访问font.google的麻烦（提示：把地址换成360提供的font.google的代替地址）。

* phaser的中文资料不多，也借此机会分享一点学习phaser的心得，其实就是通过看示例，理解api们的用法，在js文件里写了一点`中文注释`，词句都比较土，以能看懂为目的。

这个项目把phaser-examples打乱的目录结构改回了最基本的方式，一个项目使用的js和素材在同一个文件夹下，加上一个壳子的index.html，检出本项目后放到http服务器下跑，访问各个index.html即可，个别示例在文件系统直接打开index.html的方式不能用。

目前我也刚刚开始学，慢慢更新。

我学习的时候参考了[官方教程](https://github.com/photonstorm/phaser/tree/master/resources/tutorials)和[官方API文档](https://github.com/photonstorm/phaser/tree/master/docs)，在官网上访问它们居然被墙，所以在它的github上检出再访问。

在知乎上还看到一个网友发的[中文教程](http://www.grycheng.com/?cat=335)，比英文教程阅读起来方便些。


###欢迎交流：

新浪微博：[@冷镜](http://weibo.com/zidafone)

个人博客：[http://blog.427studio.net](http://blog.427studio.net)

QQ：908789432
