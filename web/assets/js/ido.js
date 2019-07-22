var Ido = {
		DATA : null,  // api列表
		MAP : {}, //api  Map
		ACTIVE: null,
		//初始化
		init : function (){
		 	var that = this;
		 	that.bind();
		 	that.renderService();
		 	
		 	var service = UrlUtil.fetchParamV("service");
		 	var code = UrlUtil.fetchParamV("code");
		 	service &&  that.serviceEvent(service, code);
		},
		
		bind : function (){
			var that = this;
			$("#j-search").bind("click", function(){
				that.search();
			});
			
			$('#input-search').keydown(function(e){
				if(e.keyCode==13){
					that.search();
				}
			});
			
			$("#dashboard").bind("click", function(){
				$("#service-content").show();
				$("#api-content").hide();
			});
			
		},
		renderService : function (){
			var that = this;
			var content = $("#service-content .row");
			for(var code in SERVICE){
				var service = SERVICE[code];
				var col = $(`<div class="col-lg-2"></div>`);
				content.append(col);
				var card = $(`<div class="card alert nestable-cart single-card  ${service.active ? 'active' : ''}" data-code="${code}">
					                        <div class="card-header"><h4>${code} - ${service.name}</h4></div>
					                        <div class="api-count" id="api-count-${code}"></div>
					                    </div>`)
					                    .appendTo(col)
					                    .bind("click", function (){
					                    	var activeCode = $(this).data("code");
							        		that.serviceEvent(activeCode);
			    					     });
			}
		},
		serviceEvent : function(activeCode, apiCode){
			var that = this;
			for(var c in SERVICE){
				SERVICE[c].active = c == activeCode;
			}
    		ACTIVE_SERVICE = SERVICE[activeCode];
    		ACTIVE_SERVICE.code = activeCode;
    		$("#service-content .card").removeClass("active");
        	$(this).addClass("active");
        	$("#service-content").hide();
			$("#api-content").show();
			$("#service-name").text(SERVICE[activeCode].name)
			that.loadApi(apiCode);
			UrlUtil.initByUrl("service", activeCode);
		},
		search : function(){
			var that = this;
			var key = $("#input-search").val();
			that.renderApi(that.DATA, key);
		},
		loadApi : function (apiCode){
			var that = this;
			$(".api-item").remove();
			ACTIVE_SERVICE && 
			that.http( (ACTIVE_SERVICE.idoPrefix ?  ACTIVE_SERVICE.idoPrefix : ACTIVE_SERVICE.prefix) + "/ido/list", null, function (data){
				if(data && data.items){
					that.DATA = data;
					//接口拼接
					$(that.DATA.items).each(function(index, item){
						var patterns =  item.patterns
						for(var index in patterns){
							 item.patterns[index] = ACTIVE_SERVICE.prefix + patterns[index];
						}
						that.MAP[item.code] = item;
					});
					that.renderApi(that.DATA);
					apiCode && that.apiEvent(apiCode);
					$(`#api-count-${ACTIVE_SERVICE.code}`).text(data.items.length);
				}
			});
		},

	    /** 渲染API */
		renderApi : function (data, key){
			var that = this;
			var sidebar = $("#api-context");
			$(".api-item").remove();
			var versionMap = {};
			$(data.items).each(function(index, item){
				if(key){
					var flag =  Ido.filter(item, key);
					if(!flag){
						return;
					}
				}
				name = item.name ? item.name : item.patterns;
				var version = item.version;
				var parent = sidebar;
				var api = $(`<li class="api-item" id="api-item-${item.code}"><a href="javascript:void(0);">${name}</a></li>`);
				if(!key && version){ //如果有版本号，放在版本号里
					if(!versionMap[version]){
						var ul = $(`<ul></ul>`);
						var versionHtml = $(`<li class="api-item"><a class="sidebar-sub-toggle"><i class="ti-layout"></i> ${version} <span class="sidebar-collapse-icon ti-angle-down"></span></a></li>`);
						versionHtml.append(ul);
						sidebar.append(versionHtml);
						versionMap[version] = ul;
					}
					 parent =  versionMap[version];
				}
				parent.append(api);
				api.bind("click", function(){
					that.apiEvent(item.code);
				});
				
			});
		
		},	
		apiEvent : function (apiCode){
			var that = this;
			
			var item = that.MAP[apiCode];
			if(!item){
				return false;
			}
			that.ACTIVE = item;
			var reqContext = $("#req-params tbody");
			var respContext = $("#resp-params tbody");
			reqContext.empty();
			respContext.empty();
			if(!item.reqParams){
				//加载参数
				that.http((ACTIVE_SERVICE.idoPrefix ?  ACTIVE_SERVICE.idoPrefix : ACTIVE_SERVICE.prefix) +"/ido/" + item.code, null, function (data){
				//	console.log(data);
					item.reqParams = data.reqParams;
					that.renderParams(reqContext,  item.reqParams );
					that.renderRespParams(respContext,  item.respParams );
				});
			}else{
				that.renderParams(reqContext, item.reqParams );
				that.renderRespParams(respContext,  item.respParams );
			}
			var name = item.name ? item.name : item.patterns;
			$("#api-name").html(name+"&nbsp;");
			$("#api-method").text(item.methods ? item.methods : "GET|POST" );
			$("#api-path").text(item.patterns);
			
			$(".api-item").removeClass("active");
			$("#api-item-"+apiCode).addClass("active");
			
			$("#service-content").hide();
			$("#api-content").show();
			UrlUtil.initByUrl("code", item.code);
		},
		//搜索过滤  
		filter : function (item, key ){
			var that = this;
			if(!key || !item){
				return false;
			}
			if(item.name && item.name.toLowerCase().indexOf(key.toLowerCase()) >=0 ) {
				return true;
			}
			var flag = false;
			$(item.patterns).each(function(index, path){
				if(path.toLowerCase().indexOf(key.toLowerCase()) >=0){
					 flag = true;
					 return flag;
				}
			});
			return flag;
		},
		renderParams :function (context,  params){
			var that = this;
			$(params).each(function(index, param){
				that.renderParam(context, param);
			});
		},	
		renderParam :	function(context, param){
			var that = this;
			if(param.object){
				 that.renderParams(context, param.params);
				 return;
			}
			var sortType = param.type.substring(param.type.lastIndexOf(".") +1);
			var required = param.required ? `<span class="badge badge-primary">${param.required}</span>` : param.required;
			var pathVariable = param.pathVariable;
			context.append(`
					<tr>
                        <td>${param.name} ${pathVariable ? ' <span class="api-field">  路径参数 <span class="ti-arrow-top-right"/></span> ' :""}</td>
                        <td >${param.description}</td>
                        <td title="${param.type}">${sortType}</td>
                        <td > ${required}</td>
                        <td> ${param.version ?param.version : "1.0.0"}</td>
                        <td > <input class="mock-param"  data-name="${param.name}" /></td>
                    </tr>
			 `);		
			
		},
		//渲染返回参数
		renderRespParams :function (context,  params , prefix){
			var that = this;
			$(params).each(function(index, param){
				that.renderRespParam(context, param, prefix);
			});
		},	
		renderRespParam :	function(context, param, prefix){
			var that = this;
			var prefix = prefix ? prefix : "";
			var sortType = param.type.substring(param.type.lastIndexOf(".") +1);
			var object = param.object;		
			context.append(`
					<tr>
                        <td>${prefix} &nbsp;<span class="${object ? '': 'api-field'}">${param.name}</span>  ${object ? '<span class="ti-angle-double-down"/>' : '' } </td>
                        <td >${param.description}</td>
                        <td title="${param.type}">${sortType}</td>
                        <td> ${param.version ?param.version : "1.0.0"}</td>
                    </tr>
			 `);		
			if(object){
				prefix = prefix +"&nbsp;"+ param.name + "." ;
				 that.renderRespParams(context, param.params, prefix);
				 return;
			}
		},
		http : function(url, param, callback) { // ajax 统一方法
			var that = this;
			if(!param){
				param = {};
			}
			$.ajax({
				type : "GET",
				url : url,
				data : param,
				beforeSend: function(request) {
					//token && request.setRequestHeader("Authorization", token);
	            },
				success : function(data) {
					//console.log(data);
					callback && callback(data);
				},
				error : function(e){
					console.log(e);
					if(e.status == 502){
						that.msg("系统重启中.....");
						return;
					}
					that.msg(e.statusText);
				}
			});
		},
	    msg : function(msg, error){
	    	var that = this;
	    	var msgConfig = {
			        "positionClass": "toast-bottom-right",
			        timeOut: 5000,
			        "closeButton": true,
			        "debug": false,
			        "newestOnTop": true,
			        "progressBar": true,
			        "preventDuplicates": true,
			        "onclick": null,
			        "showDuration": "300",
			        "hideDuration": "1000",
			        "extendedTimeOut": "1000",
			        "showEasing": "swing",
			        "hideEasing": "linear",
			        "showMethod": "fadeIn",
			        "hideMethod": "fadeOut",
			        "tapToDismiss": false
			};
	    	if(error){
	    		toastr.error(msg,'出错啦!', msgConfig)
	    	}else{
	    		toastr.info(msg,'小提示', msgConfig)
	    	}
	    	
	    }
	};

var Mock = {
		init : function (){
			var that = this;
			var token = $.cookie('token');
			token &&  $("#req-authorization").val(token);
			that.bindEvent();
		},
		bindEvent : function(){
			var that = this;
			$("#j-mock").bind("click", function(){
				that.doMock();
			});
			$("#btn-resp-copy").bind("click", function(){
		        $("#response-context").select();
		        document.execCommand("Copy");
			});
			$('#req-authorization').keydown(function(e){
				if(e.keyCode==13){
					that.doMock();
				}
			});
		},
		doMock : function (){
			var that = this;
			var api = Ido.ACTIVE;
			console.log(api)
			//请求参数值
			var httpParam = {};
			$(".mock-param").each(function(){
				httpParam[$(this).data("name")] = $(this).val();
			});
			console.log(httpParam);
			var path = api.patterns[0];
			var flag = true;
			api.reqParams &&
			$(api.reqParams).each(function(index, param){
				var val = httpParam[param.name];
				if(param.pathVariable){
					//TODO 路径替换
					if(!val){
						Ido.msg(`${param.description}[${param.name}] 不能为空!`);
						flag = false;
						return false;
					}
					path = path.replace(`{${param.name}}`, val);
				}else if(param.required && !val) {
					Ido.msg(`${param.description}[${param.name}] 不能为空!`);
					flag = false;
					return false;
				}
			});
			if(!flag){
				return false;
			}
			
			$("#api-path").text(path);
			//请求方法
			var method =  api.methods ? api.methods[0] : 'GET';
			//请求头
			var token = $("#req-authorization").val();
			 $.cookie('token', token);
			console.log(path);
			//请求
			that.http(path, method, httpParam,  token, function (data){
				console.log(data);
				$("#modal-response").modal("show");
				$("#response-context").text(JSON.stringify(data));
			});
			
		},
		http : function(url, method,  param,  token,  callback) { // ajax 统一方法
			var that = this;
			$.ajax({
				type : method,
				url : url,
				data : param,
				beforeSend: function(request) {
					 token && request.setRequestHeader("Authorization", token);
	            },
				success : function(data) {
					console.log(data);
					callback && callback(data);
				},
				error : function(e){
					console.log(e);
					//callback(e);
				}
			});
		},
}



var SERVICE = {
		App : {
			name : "App相关",
			count : 0,
			prefix : "/api/social",
		},
		Platform : {
			name : "后台管理",
			count : "",
			prefix : "/api/platform"
		},
		Order : {
			name : "订单相关",
			count : "",
			prefix : "/api",
			idoPrefix : "/api/order"
		},
		Commission : {
			name : "佣金相关",
			count : "",
			prefix : "/"
		},
		User : {
			name : "用户相关",
			count : "",
			prefix : "/api/user"
		},
		Count : {
			name : "汇总相关",
			count : "",
			prefix : "/api"
		}
	}