export const spydAlert = alertBox_();

function alertBox_() {
    let boxId = `abox-` + (+ new Date()).toString();
    return {
        showSuccess: function (msgContent, after) {
            this.show(msgContent, { bg: "#3adc91", stay: 1500 }, after);
        },
        showAlert: function (msgContent, after) {
            this.show(msgContent, { bg: "#db5d68", stay: 3000 }, after);
        },
        show: function (msgContent, cfg, after) {

            alert(msgContent); return;

            let msg = "";
            if (typeof msgContent === 'string' || msgContent instanceof String) {
                msg = msgContent
                    .replace(/\u200B/g, '')
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
                    .replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp;');
            }
            else {
                msg = JSON.stringify(msgContent);
            }

            var stayTime = 1500;
            var $box = $("#" + boxId);
            if ($box.length == 0) {

                let newBox = $(`
<div id="${boxId}" style="display:none;
    position: absolute;
    top: 40px;
    margin:0;
    padding:25px;
    z-index:99999;
    background-color:#333333;
    color: white;
    opacity: 0.9;
    border-radius: 10px;">
</div>
`
                );

                $("body").append(newBox);
            }

            var $window = $(window);

            var h = $window.height();
            var w = $window.width();
            var scroll = $window.scrollTop();

            var boxTop = -1;
            var boxLeft = -1;

            var boxWidth = 500;

            if (w < 800) {
                boxWidth = w - 50;
                boxTop = 15;
            }

            if (boxWidth < 485) {
                boxWidth = w - 100;
                boxTop = 25;
            }

            boxTop += scroll;

            boxLeft = (w - boxWidth) / 2;

            var $content = $(`<span style="color:white"></span>`)
                .append(msg);

            var $box_ = $("#" + boxId);

            $box_.css({ "width": boxWidth, "left": boxLeft });

            if (boxTop > -0.5) $box_.css("top", boxTop);

            $box_.html($content[0].outerHTML);

            if (msg.length > 15) {
                $box_.css("text-align", "");
            }
            else {
                $box_.css("text-align", "center");
            }

            if (cfg) {
                if (cfg.pos) {
                    if (cfg.pos === "top") {
                        //default
                        $box_.css('top', (15 + scroll));
                    }
                    else if (cfg.pos === "middle") {
                        $box_.css('top', (h * 0.4 + scroll));
                    }
                    else if (cfg.pos === "bottom") {
                        $box_.css('top', (h * 0.6 + scroll));
                    }
                }
                else {
                    $box_.css('top', (15 + scroll));
                }

                if (cfg.img) {
                    var el = $("<img></img>").attr("src", cfg.img);

                    if (msg && msg.length > 0) {
                        el.css({ "margin-bottom": "5px" });
                    }
                    else {

                    }

                    if (cfg.imgheight) {
                        el.css("height", cfg.imgheight);
                    }
                    else {
                        el.css("height", "40px");
                    }

                    var imgBoxHtml = $("<div style='padding:5px;overflow:hidden'></div>").html(el[0].outerHTML)[0].outerHTML;

                    $box_.prepend(imgBoxHtml);
                    $box_.css("text-align", "center");
                }
                if (cfg.stay) {
                    try {
                        stayTime = cfg.stay;
                    }
                    catch (err) {
                        stayTime = 1000;
                    }
                    //if (stayTime < 1000) {
                    //    $box_.css("opacity", "0.5");
                    //}
                }
                if (cfg.bg) {
                    $box_.css("background-color", cfg.bg);
                } else {
                    $box_.css("background-color", "#333333");
                }

            }

            $box_.fadeIn();
            setTimeout(function () {
                $box_.fadeOut();
                if (after) after();
            }, stayTime);
        }
    }
}