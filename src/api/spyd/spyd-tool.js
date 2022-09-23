import sha1 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

export const spydTool = getSpydTool();

function getSpydTool() {

    let escapeRegExp = str => {
        return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    };

    let replaceAll = (str, find, replace) => {
        return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
    };

    return {
        inIframe() {
            try {
                return window.self !== window.top;
            } catch (e) {
                return true;
            }
        },
        isEmpty(obj) {
            return obj === undefined || obj === null || obj.length === 0;
        },
        isObject(v) {
            if (v === null) { return false; }
            return ((typeof v === 'function') || (typeof v === 'object'));
        },
        objToBase64: function (o) {
            return this.Base64.encode(JSON.stringify(o));
        },
        objToBase64UrlSafe: function (o) {
            let s = this.Base64.encode(JSON.stringify(o));
            s = replaceAll(s, '+', '-');
            s = replaceAll(s, '/', '_');
            s = replaceAll(s, '=', '~');
            return s;
        },
        objToFormBody: function (o) {
            let s = "";
            for (var k in o) {
                s += encodeURIComponent(k) + "=" + encodeURIComponent(o[k]) + "&";
            }
            return s;
        },
        base64ToObj: function (s) {
            return JSON.parse(this.Base64.decode(s));
        },
        base64UrlSafeToObj: function (s) {
            let o = {};
            if (s && s.length) {
                let s_ = s.trim();
                s_ = replaceAll(s_, '-', '+');
                s_ = replaceAll(s_, '_', '/');
                s_ = replaceAll(s_, '~', '=');
                o = JSON.parse(this.Base64.decode(s_));
            }
            return o;
        },
        pathListToNodeList: (pathList, splitChar) => {
            let extractNodes_ = (parent, path, splitChar, nodes) => {
                let path_ = path.trim();
                while (true) {
                    if (path_.startsWith(splitChar)) {
                        path_ = path_.substr(0, path_.length - splitChar.length).trim();
                    } else if (path_.endsWith(splitChar)) {
                        path_ = path_.substr(splitChar.length).trim();
                    } else {
                        break;
                    }
                }
                if (path_.length) {
                    const node = { parent: parent };
                    const pos = path_.indexOf(splitChar);
                    if (pos > 0) {
                        node.name = path_.substr(0, pos).trim();
                    } else {
                        node.name = path_.trim();
                    }
                    if (parent) {
                        node.id = `${parent.trim()}${splitChar}${node.name}`;
                    }
                    else {
                        node.id = node.name;
                    }

                    nodes.push(node);

                    if (pos > 0) {
                        extractNodes_(
                            node.id,
                            path_.substr(pos + splitChar.length).trim(),
                            splitChar,
                            nodes
                        )
                    }
                }
            };

            let nodeList = [];
            pathList.forEach(p => {
                let lstTmp = [];
                extractNodes_("", p, splitChar, lstTmp);
                lstTmp.forEach(n => {
                    if (!nodeList.some(i => i.id === n.id)) {
                        nodeList.push(n);
                    }
                })
            });
            return nodeList;
        },
        replaceAll: replaceAll,
        UTF8: {
            getHexStr: function (s) {
                var result = "";
                for (var n = 0; n < s.length; n++) {
                    var c = s.charCodeAt(n);
                    if (c < 128) {
                        result += c.toString(16);
                    }
                    else if ((c > 127) && (c < 2048)) {
                        result += ((c >> 6) | 192).toString(16);
                        result += ((c & 63) | 128).toString(16);
                    }
                    else {
                        result += ((c >> 12) | 224).toString(16);
                        result += (((c >> 6) & 63) | 128).toString(16);
                        result += ((c & 63) | 128).toString(16);
                    }
                }
                return result;
            },
            getBytes: function (s) {
                var bytes = [];
                for (var n = 0; n < s.length; n++) {
                    var c = s.charCodeAt(n);
                    if (c < 128) {
                        bytes.push(c);
                    }
                    else if ((c > 127) && (c < 2048)) {
                        bytes.push((c >> 6) | 192);
                        bytes.push((c & 63) | 128);
                    }
                    else {
                        bytes.push((c >> 12) | 224);
                        bytes.push(((c >> 6) & 63) | 128);
                        bytes.push((c & 63) | 128);
                    }
                }
                return bytes;
            }
        },
        Base64: {
            // private property
            _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            // public method for encoding
            encodeArray: function (arrayBuffer) {
                var base64 = ''
                var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

                var bytes = new Uint8Array(arrayBuffer)
                var byteLength = bytes.byteLength
                var byteRemainder = byteLength % 3
                var mainLength = byteLength - byteRemainder

                var a, b, c, d
                var chunk

                // Main loop deals with bytes in chunks of 3
                for (var i = 0; i < mainLength; i = i + 3) {
                    // Combine the three bytes into a single integer
                    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

                    // Use bitmasks to extract 6-bit segments from the triplet
                    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
                    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
                    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
                    d = chunk & 63               // 63       = 2^6 - 1

                    // Convert the raw binary segments to the appropriate ASCII encoding
                    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
                }

                // Deal with the remaining bytes and padding
                if (byteRemainder == 1) {
                    chunk = bytes[mainLength]

                    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

                    // Set the 4 least significant bits to zero
                    b = (chunk & 3) << 4 // 3   = 2^2 - 1

                    base64 += encodings[a] + encodings[b] + '=='
                } else if (byteRemainder == 2) {
                    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

                    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
                    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

                    // Set the 2 least significant bits to zero
                    c = (chunk & 15) << 2 // 15    = 2^4 - 1

                    base64 += encodings[a] + encodings[b] + encodings[c] + '='
                }

                return base64
            },
            encode: function (input) {
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;
                var input_ = this._utf8_encode(input);
                while (i < input_.length) {
                    chr1 = input_.charCodeAt(i++);
                    chr2 = input_.charCodeAt(i++);
                    chr3 = input_.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }
                    output = output +
                        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
                }
                return output;
            },
            // public method for decoding
            decode: function (input) {
                var output = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
                var input_ = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while (i < input_.length) {
                    enc1 = this._keyStr.indexOf(input_.charAt(i++));
                    enc2 = this._keyStr.indexOf(input_.charAt(i++));
                    enc3 = this._keyStr.indexOf(input_.charAt(i++));
                    enc4 = this._keyStr.indexOf(input_.charAt(i++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    output = output + String.fromCharCode(chr1);
                    if (enc3 !== 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 !== 64) {
                        output = output + String.fromCharCode(chr3);
                    }
                }
                output = this._utf8_decode(output);
                return output;
            },
            // private method for UTF-8 encoding
            _utf8_encode: function (string) {
                //string = string.replace(/\r\n/g, "\n");
                var utftext = "";
                for (var n = 0; n < string.length; n++) {
                    var c = string.charCodeAt(n);
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            },
            // private method for UTF-8 decoding
            _utf8_decode: function (utftext) {
                let string = "";
                let i = 0;
                let c = 0, c1 = 0, c2 = 0, c3 = 0;
                //var c = c1 = c2 = 0;
                while (i < utftext.length) {
                    c = utftext.charCodeAt(i);
                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if ((c > 191) && (c < 224)) {
                        c2 = utftext.charCodeAt(i + 1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else {
                        c2 = utftext.charCodeAt(i + 1);
                        c3 = utftext.charCodeAt(i + 2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }
                }
                return string;
            }
        },
        getDateDiff: function (d, compareTo) {
            let minute = 1000 * 60;
            let hour = minute * 60;
            let day = hour * 24;
            let month = day * 30;
            let year = day * 365;

            let diffValue = compareTo - d;

            if (diffValue < 0) {
                diffValue = 0 - diffValue;
            }

            let result = "";

            let yearC = diffValue / year;
            let monthC = diffValue / month;
            let weekC = diffValue / (7 * day);
            let dayC = diffValue / day;

            if (yearC >= 1) {
                result = parseInt(yearC, 10) + "年";
            }
            else if (monthC >= 1) {
                result = parseInt(monthC, 10) + "个月";
            }
            else if (weekC >= 1) {
                result = parseInt(weekC, 10) + "周";
            }
            else if (dayC >= 1) {
                result = parseInt(dayC, 10) + "天";
            }

            return result;
        },
        getDayDiff: function (d, compareTo) {
            let minute = 1000 * 60;
            let hour = minute * 60;
            let day = hour * 24;

            let diffValue = compareTo - d;

            if (diffValue < 0) {
                diffValue = 0 - diffValue;
            }

            let dayC = diffValue / day;

            return parseInt(dayC, 10);
        },
        getTimeDiff: function (timestamp) {
            let result = "";
            let minute = 1000 * 60;
            let hour = minute * 60;
            let day = hour * 24;
            let month = day * 30;

            let now = new Date().getTime();
            let diffValue = now - timestamp;

            if (diffValue < 0) {
                //若日期不符则弹出窗口告之
                //alert("结束日期不能小于开始日期！");
            }
            let monthC = diffValue / month;
            let weekC = diffValue / (7 * day);
            let dayC = diffValue / day;
            let hourC = diffValue / hour;
            let minC = diffValue / minute;
            if (monthC >= 1) {
                result = parseInt(monthC) + "mon";
            }
            else if (weekC >= 1) {
                result = parseInt(weekC) + "w";
            }
            else if (dayC >= 1) {
                result = parseInt(dayC) + "d";
            }
            else if (hourC >= 1) {
                result = parseInt(hourC) + "h";
            }
            else if (minC >= 1) {
                result = parseInt(minC) + "m";
            } else
                result = "new";
            return result;
        },
        getSizeDesc: function (size) {
            if (size <= 0) return "0";
            if (size * 10 < 1024) return size.toString() + "B";
            if (size < 1024) return "0." + Math.floor((size * 10) / 1024).toString() + "K";
            if (size < 1024 * 1024) return Math.floor(size / 1024).toString() + "K";
            if (size * 10 < 1024 * 1024 * 1024) return (Math.round(size * 10 / (1024 * 1024)) / 10).toString() + "M";
            if (size < 1024 * 1024 * 1024) return Math.floor(size / (1024 * 1024)).toString() + "M";
            return (Math.round(size * 10 / (1024 * 1024 * 1024)) / 10).toString() + "G";
        },
        sortBy: function (field, primer, reverse) {

            var key = primer ?
                function (x) { return primer(x[field]) } :
                function (x) { return x[field] };

            var i = 1;
            if (reverse) i = -1;

            return function (a, b) {
                return a = key(a), b = key(b), i * ((a > b) - (b > a));
            }
        },
        stringToDate: function (s) {
            let bits = s.split(/\D/);
            if (bits.length < 6) {
                for (let i = bits.length; i <= 6; i++) {
                    bits.push(0);
                }
            }
            return new Date(bits[0], --bits[1], bits[2], bits[3], bits[4], bits[5]);
        },
        formatDate: function (d, fmt) {
            let o = {
                "M+": d.getMonth() + 1, //月份 
                "d+": d.getDate(), //日 
                "h+": d.getHours(), //小时 
                "m+": d.getMinutes(), //分 
                "s+": d.getSeconds(), //秒 
                "q+": Math.floor((d.getMonth() + 3) / 3), //季度 
                "ms": d.getMilliseconds() //毫秒 
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (d.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o) {
                if (k === "ms") {
                    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (("000" + o[k]).substr(("" + o[k]).length)));
                }
                else {
                    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                }
            }
            return fmt;
        },
        timestampToDateStr: function (ts) {
            let ts_ = parseInt(ts);
            let d = new Date(ts_);
            return `${d.getFullYear(d)}-${d.getMonth(d) + 1}-${d.getDate(d)}`;
        },
        createUUID: function () {
            let dt = new Date().getTime();
            let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = (dt + Math.random() * 16) % 16 | 0;
                dt = Math.floor(dt / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        createSignatureSHA1: function(str) {
            const digest = sha1(str);
            return Base64.stringify(digest);
        }
    }
};