/**
 * url util
 */
var UrlUtil = {
  init: function() {
    var that = this;
    //  that.initByUrl(pname , pvalue);
    // that.initEvent();
  },
  fetch: function(regex) {
    var params = location.href;
    return params.match(regex);
  },
  initByUrl: function(pname, pvalue, valueType) {
    var that = this;
    valueType =  valueType ? valueType : "w"; // \w  或者 \d
    var regex =new RegExp(`.*[&|?]${pname}=(\\${valueType}*)&?.?`,"i"); 
    var params = location.href;
    var data = params.match(regex);
   
    if (data == null) { // 没有页面参数  添加
      params = params.indexOf("?") > -1 ? params : params + "?";
      if ((params.length - 1) == params.indexOf("?")) {
        params = params + pname + "=" + pvalue;
      } else {
        params = params + "&" + pname + "=" + pvalue;
      }
      that.pushState(params);
    
    } else {   // 有参数 替换
      params = params.replace(new RegExp(pname+"=\\"+ valueType +"*"), pname + "=" + pvalue);
      that.pushState(params);
    }
  },
  initEvent: function() {
    var that = this;
  },
  fetchParamV : function(paramName) { // 从URL中获取指定参数名的值
		var that = this;
		var reg = new RegExp("(^|&)" + paramName + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) {
			return unescape(r[2]);
		}
		return null;
	},
  // 换页和跳转时 更新URL中的页数
  initUrlPage: function(pageNum) {
    var that = this;
    var params = location.href;
	console.log(params)
    params = params.replace(/page=\d*/, "page=" + pageNum);
    that.pushState(params);
  },
  // 不跳转页面 更改URL中的参数
  pushState: function(url) {
    if ('pushState' in history) {
      window.history.pushState({}, '', url);
    }
  }
}