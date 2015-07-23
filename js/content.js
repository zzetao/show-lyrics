var timeLong =0;    //当前播放 时间
var oWrap = $(".lyric_wrap");   //获取歌词 外框
var isPause = false; //判断歌词暂停，true 暂停
var timer;  //  歌词自动滚动定时器
var lrcDATA;    //存储歌词数据 object
var ctlTool=-1;   //是否可控制工具栏 1 可，-1 否
var timeEnd;    //歌词结束时间;
var oBody;  //添加到页面的父节点
var oClass=""; // 自定义样式
var delClass="";	//等于1则不删除	针对douban

$(function(){

var L = {
    getID:function(songName){
    	if(!songName||songName!=" "){
	        $.getJSON("http://www.xiami.com/web/search-songs?spm=0.0.0.0.ClRvX&key="+songName+"",function(e){
	            if(e==null){    //找不到歌词
	                L.setLrc("w(ﾟДﾟ)w 找不到歌词~",-1)
	            }else if(e.length==1){  // 只有一条歌词文件
	                L.getlrcFile(e[0].id)
	            }else if(e.length>=2){
	                L.getlrcFile(e[0].id)   //默认载入第一首
	            }

	        })
    	}
    },
    getlrcFile:function(id){
        $.getJSON("http://www.xiami.com/song/playlist/id/"+ id +"/object_name/default/object_id/0/cat/json",function(e){
            for(var i =0;i<e.data.trackList.length;i++){
            	if(e.data.trackList[i].lyric){
            		var gLRC = e.data.trackList[i].lyric;
            		break;
            	}
            }

            if(!gLRC){  //找到这首歌，但是没有歌词
                L.setLrc("w(ﾟДﾟ)w 找不到歌词~",-1);
            }else{
                ctlTool=1;
                if(gLRC.substring(gLRC.length,gLRC.length-3)=="txt"){    //如果文件是 txt
                    $.get(gLRC,function(e){
                        L.setLrc(e,0);
                    })
                }else if(gLRC.substring(gLRC.length,gLRC.length-3)=="lrc"){  // 文件是 lrc
                    $.get(gLRC,function(e){
                        var a = parseLyric(e);  //歌词转换成对象
                        L.setLrc(a,1);

                    })
                }
            }

        })
    },
    setLrc:function(data,val){
        if($("#lyric_Con").length>0){   //先 判断 元素是否存在
        	if($("#lyric_Con").css("display")=="none"){	//再判断是否为隐藏
        		$("#lyric_Con").show();
        	}
            if(val==1){		//1 	//是lrc文件
                var oLrc = "";
                lrcDATA = data;
                var len;    //获取最后一个属性
                for (var e in lrcDATA) { //循环 each 数据 添加l
                    oLrc += "<li data-length='" + e + "'><span>" + lrcDATA[e] + "</span></li>";
                    len = e;
                }
                len++;
                lrcDATA[len] = "—— end ——";

                $(".lyric_wrap").empty().append(oLrc+"<li data-length='"+ len +"'>—— end ——</li>")
                clearInterval(timer)    //停止之前的timer
                timer = setInterval(autoLrc(lrcDATA),1000)
            }else if(val==0){	//0	//txt文件
            	ctlTool=-1;
                $(".lyric_wrap").empty().append("<pre>文本歌词，不支持自动滚动</br>" + data + "</br>----------- end ----------</pre>")
            }else if(val==-1){	//-1  	//没有歌词
                $(".lyric_wrap").empty().append(data);
            }


        }else{  //不存在 则创建
            var oLrc = "";
            lrcDATA = data;
            //Tool dom
            var oTool = "<div class='lyric_wrap_drag' title='拖动'></div>" +	//左上角拖拽歌词
            			"<div class='lyric_shut' title='关闭'></div>" +	//关闭
                        "<div class='lyric_tool'>" +
                        "<div class='lyric_time_next'>Next</div>" +
                        "<div class='lyric_time_prev'>Prev</div>" +
                        "<div class='lyric_time_pause'>Pause</div>" +
                        "</div>";
            if(val==1){ //如果文件是 lrc
            	ctlTool = 1;
                var len;
                for (var e in lrcDATA) { //循环 each 数据 添加l
                    oLrc += "<li data-length='" + e + "'><span>" + lrcDATA[e] + "</span></li>";
                    len=e;
                }
                len++;
                lrcDATA[len] = "—— end ——";
                $(oBody).prepend("<div id='lyric_Con' class='"+oClass+"'>"+oTool+"<div class='lyric_wrap' style='top:30px'>" + oLrc + "<li data-length='"+ len +"'>—— end ——</li></div></div>")
                clearInterval(timer)
                timer = setInterval(autoLrc(lrcDATA),1000)
            }else if(val==0){
            	ctlTool=-1;
                $(oBody).prepend("<div id='lyric_Con' class='"+oClass+"'>"+oTool+"<div class='lyric_wrap'><pre>文本歌词，不支持自动滚动</br>" + lrcDATA + "</br>----------- end ----------</pre></div></div>")
            }else if(val==-1){
                $(oBody).prepend("<div id='lyric_Con' class='"+oClass+"'>"+oTool+"<div class='lyric_wrap'>" + lrcDATA + "</div></div>")
            }
                    //next btn
                    $(document).on("click",".lyric_time_next",function(){
                        if($(".lyric_wrap li").length>5){
                            var c_time = timeLong;

                            for(var i=timeLong;i<10000;i++){
                                if($("[data-length="+i+"]").length>0){  //循环，如果找到下一条歌词，那么则暂停循环
                                    break;
                                }
                                c_time++;   //c_time 陪着 一直 ++
                            }
                            $("[data-length]").removeClass("l_current");
                            $("[data-length="+c_time+"]").addClass("l_current");  //更改下一条歌词为当前
                            //Wrap的top值 + 下一条歌词的高度

                            $(".lyric_wrap").animate({"top":$(".lyric_wrap").position().top-$("[data-length="+c_time+"]").height()})
                            timeLong=c_time;    //当前播放时间 等于下一条歌词时间

                        }
                    })
                    //prev btn
                    $(document).on("click",".lyric_time_prev",function(){

                        if($(".lyric_wrap li").length>5){
                            var c_time = timeLong;
                            var c_curr = 0;
                            for(var i=timeLong;i>0;i--){
                                if($("[data-length="+i+"]").length>0){  //循环，如果找到下一条歌词，那么则暂停循环
                                    c_curr++;
                                    if(c_curr==2){
                                        break;
                                    }
                                }
                                c_time--;   //c_time 陪着 一直 ++
                            }
                            $("[data-length]").removeClass("l_current");
                            $("[data-length="+c_time+"]").addClass("l_current");  //更改下一条歌词为当前
                            //Wrap的top值 + 下一条歌词的高度

                            $(".lyric_wrap").animate({"top":$(".lyric_wrap").position().top+$("[data-length="+c_time+"]").height()})
                            timeLong=c_time;    //当前播放时间 等于下一条歌词时间
                        }
                    })

                    //pasue btn
                    $(document).on("click",".lyric_time_pause",function(event){
                    	event.preventDefault();
                        if($(".lyric_wrap li").length>5){
                            if(isPause==false){
                                isPause=true;
                                $(this).text("Start");
                            }else if(isPause==true){
                                isPause=false;
                                $(this).text("Pause");
                                clearInterval(timer)
                                timer = setInterval(autoLrc(lrcDATA),1000)
                            }
                        }
                    })

                    //点击歌词
                    $(document).on("click",".lyric_wrap li span",function(){
                    	timeLong = Number($(this).parent().attr("data-length"));
						$("[data-length]").removeClass("l_current");
                        $("[data-length="+timeLong+"]").addClass("l_current");  //更改下一条歌词为当前
                    })

                    //关闭
                    $(document).on("click",".lyric_shut",function(){
                    	$("#lyric_Con").hide();
                    	timeLong = 0;
                    	clearInterval(timer);
                    })

        }   //判断 if end
    }   //set Lrc end
}
var getName = {
    youku:function(){
        var name  = $(".base_info .title #subtitle").text();
        var author = $(".base_info .title a:first").text();
        return name; //优酷返回歌名，不返回歌手名，因为歌手名是中文，影响搜索
    },
    youtube:function(){
    	var name = $("#watch-headline-title").text();
    	return name;
    },
    yinyuetai:function(){
    	var name = $(".v_play_title .pl_title h3").text();
    	var author = $(".v_play_title .pl_title span a").text();	//歌手
    	return name;
    },
    qq:function(){	//暂时没有调用
	    var name = $(".mv_title").text();
	    var author = $("#singer_name a").text();
	    return name;
    },
    tudou:function(){
    	var name = $(".con_summary h1.kw").attr("title");
    	return name;
    },
    iqiyi:function(){
    	var name = $(".jiemu-tit").text();
    	return name;
    },
    sohu:function(){
    	var name = $("#crumbsBar h2").text()||$("#video-title").text();
    	return name;
    },
    xunlei:function(){
    	var name = $(".player_top .title h1").text();
    	return name;
    },
    sina:function(){
    	var name = $(".Vd_titBox h2").text();
    	return name;
    },
    letv:function(){
    	var name = $(".Info .title h3").text();
    	return name;
    },
    douban:function(){
    	if(localStorage.bubbler_song_info){
			var song = JSON.parse(localStorage.bubbler_song_info);
	    	return song.song_name+" "+song.artist;
    	}
    }


};
 //判断网站
        switch(window.location.host)
        {
            case "v.youku.com": 	//优酷
            {
            	if(_name(getName.youku())){
	                var y_seldom = $(".base_info .guide .crumbs a:first").text();
	                if(y_seldom=="音乐"||y_seldom=="音乐频道"){   //判断当前页 是否是音乐频道
	                    oClass="l_youku";   //设置网站样式
	                    oBody = "#playerBox #player";
	                        $("#lyric_Con").addClass("l_youku");
	                        setTimeout(function(){
	                            L.getID(getName.youku());
	                        },1000)
	                }
            	}
            }
            break;
            case "www.youtube.com": 	//youtube
            {
                if(window.location.pathname==="/watch"){
	                    var y_key =$(".watch-meta-item .watch-info-tag-list li a").text();
	                    if(y_key.indexOf("音乐")>1||y_key.indexOf("Music")>1){

                        oBody = ".html5-video-player";
                        oClass = "l_class";

	                    	//发送事件
				        chrome.extension.sendMessage({id: "getname",songname:getName.youtube()}, function(response) {
				            console.log(response);
				        });

	                    }
                }
            }
            break;
            case "v.yinyuetai.com": 	//音乐台
            {
            	if(_name(getName.yinyuetai())){
	            	oClass="l_class";
	            	oBody = "#vPlay";
	            	L.getID(getName.yinyuetai());
            	}
            }
            break;
            case "y.qq.com": 	//QQ MV
            {
		        setTimeout(function(){
	            	if(_name($(".mv_title").text())){
		            	oBody = "#player_cont";
		            	oClass = "l_class";
		            	L.getID($(".mv_title").text());
	            	}
		        },2000)
            }
            break;
            case "www.tudou.com":
            {
            	var td_title = document.title;
            	var isType = $(".information .d_p").text();
            	if($(".information .v_channel a").text()=="音乐"||isType.indexOf("歌曲类型")>0){
            		oBody = ".player_main";
            		oClass = "l_class";
            		L.getID(getName.tudou());
            		//点击右侧列表
            		$(document).on("click",".tab_panel_pic .scroll_box div",function(e){
            			e.preventDefault();
            			timeLong = 0;
            			$(".lyric_wrap").css("top","30px");
            			L.getID($(this).find(".txt h6 a").text());
            		})
            	}
            }
            break;
            case "www.iqiyi.com":
            {
            	if($(".mod-crumb_bar .mod-play_tags a:eq(1)").text()=="音乐"){
            		oBody = "#flashbox";
            		oClass = "l_class";
            		L.getID(getName.iqiyi());
            	}
            }
            break;
            case "tv.sohu.com":
            {
            	if($("#crumbsBar .crumbs a:eq(0)").text()=="音乐"){
            		oBody = "#sohuplayer";
            		oClass = "l_sohu";
            		L.getID(getName.sohu());
            	}
            }
            break;
            case "yinyue.kankan.com":
            {
            	var a = window.location.pathname;
            	if(a.substring(0,4)=="/vod"){
            		oBody = "#_player";
            		oClass = "l_class";
            		L.getID(getName.xunlei());
            	}
            }
            break;
            case "video.sina.com.cn":
            {
            	var a = window.location.pathname;
            	if(a.substring(0,8)=="/p/music"){
            		oBody = "#acVideo";
            		oClass = "l_class";
            		L.getID(getName.sina());
            	}
            }
            break;
            case "www.letv.com":
            {
            	if($(".seat-list .Li02 .frecy a").text()=="音乐"){
            		oBody = "#fla_box";
            		$("#fla_box").css("position","relative");
            		oClass = "l_class";
            		L.getID(getName.letv());
            		//点击右侧列表
            		$(document).on("click","a.a_jujiTemp",function(e){
            			e.preventDefault();
            			timeLong = 0;
            			$(".lyric_wrap").css("top","30px");
            			L.getID($(this).attr("title"));
            		})
            	}
            }
            case "douban.fm":
            {
            	delClass =1;
            	var _song;
            	if($("#fm-player")){
            		//下载app挪动
            		$("#fm-section-app-entry").css({"top":"0","left":"0","width":"112px"}).appendTo('#fm-section2');
            		oBody = "#fm-player";
            		oClass = "l_douban";
	            	//删除歌曲存储数据
	            	localStorage.removeItem('bubbler_song_info');
	            	_song = getName.douban();	//存储

	            	setInterval(function(){
	            		if(_song!=getName.douban()){	//每一秒查询歌曲名是否不等于，如果不等于则就是有切换音乐
	            			timeLong = 0;
	            			$(".lyric_wrap").css("top","60px");
	            			L.getID(getName.douban());
	            			_song = getName.douban();
	            		}
	            	},1000)

            	}
            }
            default:
            {
            }
        }	//switch end

                //通过 搜索插入	//接受事件
                chrome.runtime.onMessage.addListener(
                  function(request, sender, sendResponse) {
                    //console.log(sender)
                    //校验是否
                    if (request.name == "id"){
                    	timeLong = 0;
                        if(!oBody){
                            oBody = "body";
                        }
                        L.setLrc(request.data,request.oth);
                    	$(".lyric_wrap").css("top","30px");

                        if(request.oth!=-1){	//-1找不到歌词，则不可控制工具栏
                        	ctlTool=1;
                        }

                        //发送结果
                        sendResponse({farewell: "已添加到当前页面 :)"});
                    }
                  });

                //滚轮事件
	                $(document).on("mousewheel","#lyric_Con",function(event){
	                	e = window.event;
	                	//在当前对象滚动不影响到整体
				        if (e.preventDefault) e.preventDefault();
				        else e.returnValue = false;

				        //向上输出120,向下输出-120
				        var ew = event.originalEvent.wheelDelta/120;
				        ew>0?ew=10:ew=-10;	//输出值加赋值10

	                	var courrTop = $(".lyric_wrap").position().top;
	                	$(".lyric_wrap").css("top",courrTop+ew);
	                })

}); //load end



//判断歌名是否有包含 '歌词'
function _name(str){
	if(/中文字幕|中英字幕|字幕|歌词|中字版|中文版/.test(str)){
		return false;
	}else{
		return true;
	}
}
//歌词自动滚动 定时器
function autoLrc(data){
    timeEnd = $(".lyric_wrap li").last().attr("data-length");   //选择歌词最后一个元素 作为 结尾
    return function(){
        timeLong+=1;
        if(timeLong==timeEnd||isPause==true){
            clearInterval(timer);
        }
        var songLRC = "";
        if(data[timeLong]!=undefined){
            $(".lyric_wrap").animate({"top":$(".lyric_wrap").position().top-=$("[data-length="+timeLong+"]").height()})
            $("[data-length]").removeClass("l_current");
            $("[data-length="+timeLong+"]").addClass("l_current");
            var songLRC = data[timeLong];
        }
        //console.log(timeLong+" : "+ songLRC+" - "+$("[data-length="+timeLong+"]").height());
    }
}
//解析歌词
function parseLyric(lrc) {
  var lyrics = lrc.split("\n");
  var lrcObj = {};
  for (var i = 0; i < lyrics.length; i++) {
    var lyric = decodeURIComponent(lyrics[i]);
    var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
    var timeRegExpArr = lyric.match(timeReg);
    if (!timeRegExpArr) continue;
    var clause = lyric.replace(timeReg, '');    //歌词
    for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
      var t = timeRegExpArr[k]; //歌词时间
      var min = Number(String(t.match(/\[\d*/i)).slice(1)),
        sec = Number(String(t.match(/\:\d*/i)).slice(1));
      var time = min * 60 + sec;
      lrcObj[time] = clause;
    }
  }
  return lrcObj;
}

// 字幕  拖动
(function(){
    var y,m;
    var ele = ".lyric_wrap";
    $(document).on("mousedown",""+ele+"",function(e){
        e.pageY=e.pageY||e.y;
        if(e.which == 1) {
            m = true;
            y = e.pageY - parseInt(this.offsetTop);
        }
    })

    $(document).mousemove(function(e){
        if(m) {
            e.pageY=e.pageY||e.y;
            $(""+ele+"").css("top",e.pageY-y+'px')
        }
    })
    $(document).mouseup(function(e){
        m=false;
    })
}());

// 整体  拖动
(function(){
    var x,y,m;
    var ele = ".lyric_wrap_drag";
    $(document).on("mousedown",""+ele+"",function(e){

        e.pageY=e.pageY||e.y;
        e.pageX=e.pageX||e.x;
        if(e.which == 1) {
            m = true;
            x = e.pageX - parseInt(lyric_Con.offsetLeft);
            y = e.pageY - parseInt(lyric_Con.offsetTop);
        }
        $("#lyric_Con").css({"left":e.pageX-x+"px","top":e.pageY-y+"px"});  //先设置当前位置
        $(""+ele+"").css("cursor","pointer")
        if(delClass!=1){
	        $("#lyric_Con").removeClass(oClass);    //再移除
        }
    })

    $(document).mousemove(function(e){
        if(m) {
            e.pageY=e.pageY||e.y;
            e.pageX=e.pageX||e.x;
            $("#lyric_Con").css({"left":e.pageX-x+"px","top":e.pageY-y+"px"})   //-12 点击按下 移动 会有抖动
        }
    })
    $(document).mouseup(function(e){
        $(""+ele+"").css("cursor","pointer")
        m=false;
    })
}());