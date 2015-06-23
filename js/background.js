(function(){
var pageNo = 1;
var oVal;
var L = {
    getID:function(songName,pageNo){
        $.getJSON("http://www.xiami.com/web/search-songs?spm=0.0.0.0.ClRvX&key="+songName+"&limit=7&page="+pageNo+"",function(e){
            if(e==null){    //找不到歌词
            	$(".p-search-con").append("<div>w(ﾟДﾟ)w 找不到歌词~</div>")
            }else if(e.length>=1){

                for(var i =0; i<e.length;i++){
                    $(".p-search-ul").append("<li class='search-li' data-id='"+e[i].id+"' title='在当前页面添加 "+e[i].title+" 的歌词'><div class='p-search-sname'>"+e[i].title+"</div><div class='p-search-author'>"+e[i].author+"</div></li>")
                }

                if(e.length==7){	//数量等于9 显示下一页
	                if($(".page-next").length==0){
                		$(".p-search-page").append('<a href="#" class="page-next">下一页</a>');
                	}
                }else if(e.length<7){
                	$(".page-next").remove();
                }
                if(pageNo>=2){
	                if($(".page-prev").length==0){
	                	$(".p-search-page").prepend('<a href="#" class="page-prev">上一页</a>');
	                }
                }else if(pageNo==1){
                	$(".page-prev").remove();
                }
            }

        })
    },
    _getID:function(name){
        $.getJSON("http://www.xiami.com/web/search-songs?spm=0.0.0.0.ClRvX&key="+name+"",function(e){
            if(e==null){    //找不到歌词
                L.send("w(ﾟДﾟ)w 找不到歌词~",-1);
            }else{
                L.getLrcFile(e[0].id)
            }
        })
    },
    getLrcFile:function(id){
        $.getJSON("http://www.xiami.com/song/playlist/id/"+ id +"/object_name/default/object_id/0/cat/json",function(e){
            for(var i =0;i<e.data.trackList.length;i++){
                if(e.data.trackList[i].lyric){
                    var gLRC = e.data.trackList[i].lyric;
                    break;
                }
            }
            if(!gLRC){  //找到这首歌，但是没有歌词
                L.send("w(ﾟДﾟ)w 找不到歌词~",-1);
            }else{
                if(gLRC.substring(gLRC.length,gLRC.length-3)=="txt"){    //如果文件是 txt
                    $.get(gLRC,function(e){
                        L.send(e,0);
                    })
                }else if(gLRC.substring(gLRC.length,gLRC.length-3)=="lrc"){  // 文件是 lrc
                    $.get(gLRC,function(e){
                        var a = parseLyric(e);  //歌词转换成对象
                        L.send(a,1);

                    })
                }
            }

        })
    },
    send:function(data,oth){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(
                tabs[0].id,
                //发送数组
                {
                    name: "id",
                    data: data,
                    oth:oth
                },

                //返回结果
                function(response) {
                    dialog(response.farewell)
                });
        });
    }
}	// L end
        chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.id === "getname"){
                L._getID(request.songname);
                sendResponse({
                    data:"get song success!"
                });
            }
        });
$(".p-search-btn").click(function(){
	pageNo = 1;
	var input_val = $(".p-input input").val();
	if(input_val){	//输入框有内容


        if($(".p-head").position().top==0){ //搜索动画
            $(".p-search-text").hide();
            $(".p-search-con").removeClass("bg");
            $(".p-head").animate({top:"-128px"}, 200);
        }
        $(".popup-wrap").addClass("loading");
		oVal = input_val;
		$(".p-search-ul .search-li").remove();
		L.getID(""+input_val+"",pageNo)
	}else{	//输入框没内容
		alert("ヾ(　´・∀・｀)ノ请输入歌名/歌手 ~ ")
	}

})
$(document).on("click",".page-next",function(){ //下一页
    $(".popup-wrap").addClass("loading");
	pageNo++;
	$(".p-search-ul .search-li").remove();
	L.getID(""+oVal+"",pageNo);
})
$(document).on("click",".page-prev",function(){ //上一页
    $(".popup-wrap").addClass("loading");
	pageNo--;
	$(".p-search-ul .search-li").remove();
	L.getID(""+oVal+"",pageNo);
})
$("body").keydown(function() {
    if (event.keyCode == "13") {//keyCode=13是回车键
        $('.p-search-btn').click();
    }
});

//点击 添加
$(document).on("click",".search-li",function(){
    var sid = $(this).attr("data-id");
    L.getLrcFile(sid);  //获取文件并发送
})


$(".popup-wrap").ajaxStop(function(){
  $(".popup-wrap").removeClass("loading");
});

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
})()

$(function(){
    $(".exit").click(function(e){
        $(".dialog").animate({top:"170px",opacity:"0"},{
            esing:'swing',
            duration:200,
            complete:function(){
                $(".dialog").hide();
            }
        });
    })
})
    function dialog(con){
        $(".dialog").show().animate({top:"200px",opacity:"1",display:"block"}).find(".dialog-con").text(con);
    }